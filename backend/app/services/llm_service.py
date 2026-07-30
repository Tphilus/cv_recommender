import base64
from typing import List

from langchain_core.messages import HumanMessage
from langchain_core.prompts import ChatPromptTemplate
from langchain_google_genai import ChatGoogleGenerativeAI
from langchain_groq import ChatGroq
from langchain_huggingface import ChatHuggingFace, HuggingFaceEndpoint
from langchain_openai import ChatOpenAI
from pydantic import BaseModel

from app.core.config import settings
from app.schemas.cv_schema import ExtractedCV, _RawJobMatch, _RawJobMatchReport, _RawSkillGap
from app.schemas.improvement_schema import ImprovementReport
from app.schemas.job_match_schema import JobMatch, JobMatchReport, SkillGap
from app.services.job_search_service import build_learning_link, build_search_links


def get_llm(provider: str = settings.DEFAULT_LLM_PROVIDER):
    if provider == "gemini":
        return ChatGoogleGenerativeAI(model="gemini-2.0-flash", api_key=settings.GEMINI_API_KEY)
    # if provider == "groq":
    #     return ChatGroq(model="llama-3.3-70b-versatile", api_key=settings.GROQ_API_KEY, temperature=0)
    if provider == "openai":
        return ChatOpenAI(model="gpt-4o", api_key=settings.OPENAI_API_KEY, temperature=0)
        
    
    if provider == "huggingface":
        endpoint = HuggingFaceEndpoint(
            repo_id="Qwen/Qwen3.5-9B",
            task="conversational",
            huggingfacehub_api_token=settings.HUGGING_FACE_API_KEY,
            max_new_tokens=2048,
            timeout=90,
        )
        return ChatHuggingFace(llm=endpoint)
    return ChatGroq(model="llama-3.3-70b-versatile", api_key=settings.GROQ_API_KEY, temperature=0)
 


def _structured_llm(provider: str, schema: type[BaseModel]):
    """Returns a runnable that outputs a validated instance of `schema`.

    ChatHuggingFace can't do this the way ChatOpenAI/ChatGroq/ChatGoogleGenerativeAI
    can: its default with_structured_output method ('function_calling') raises
    NotImplementedError for Pydantic schemas outright, and its 'json_schema'/'json_mode'
    methods only ever return a plain dict, never the Pydantic object. So for huggingface
    we ask for a JSON-schema-constrained dict and validate it into `schema` ourselves —
    every other provider already returns a validated instance directly.
    """
    llm = get_llm(provider)
    if provider == "huggingface":
        structured = llm.with_structured_output(schema, method="json_schema")
        # Qwen3.5 is a "thinking" model — left alone, it burns most (sometimes all) of
        # the token budget on a hidden reasoning trace before the real JSON answer even
        # starts, which was causing empty/truncated output and 100s+ latency per call.
        # Disabling it via the chat template cuts that down to ~2-6s. This must be bound
        # AFTER with_structured_output — binding it before causes the same empty-output
        # failure (confirmed by testing both orders against the live API).
        structured = structured.bind(extra_body={"chat_template_kwargs": {"enable_thinking": False}})
        return structured | schema.model_validate
    return llm.with_structured_output(schema)



VISION_CAPABLE_PROVIDERS = {"openai", "gemini"}
# VISION_FALLBACK_PROVIDER = "openai"
VISION_FALLBACK_PROVIDER = "groq"



def extract_cv_from_file(file_bytes: bytes, mime_type: str, provider: str = settings.DEFAULT_LLM_PROVIDER) -> ExtractedCV:
    """Multimodal call: sends the raw CV (a rendered page image) to the LLM and forces
    structured output validated against the ExtractedCV Pydantic schema."""
    if provider not in VISION_CAPABLE_PROVIDERS:
        provider = VISION_FALLBACK_PROVIDER
    llm = _structured_llm(provider, ExtractedCV)
    b64 = base64.b64encode(file_bytes).decode()
    message = HumanMessage(content=[
        {"type": "text", "text": "Extract all candidate information from this CV into the structured schema."},
        {"type": "image_url", "image_url": f"data:{mime_type};base64,{b64}"},
    ])
    return llm.invoke([message])


def extract_cv_from_text(text: str, provider: str = settings.DEFAULT_LLM_PROVIDER) -> ExtractedCV:
    """Text-only fallback extraction path, used for DOCX uploads where the raw text is
    already available and a rendered-image round trip would lose no information."""
    llm = _structured_llm(provider, ExtractedCV)
    prompt = ChatPromptTemplate.from_messages([
        ("system", "Extract all candidate information from this CV text into the structured schema."),
        ("human", "{cv_text}"),
    ])
    chain = prompt | llm
    return chain.invoke({"cv_text": text})


def generate_improvements(cv: ExtractedCV, provider: str = settings.DEFAULT_LLM_PROVIDER) -> ImprovementReport:
    llm = _structured_llm(provider, ImprovementReport)
    prompt = ChatPromptTemplate.from_messages([
        ("system", "You are a senior technical recruiter. Critique this CV honestly and "
                   "give concrete, actionable rewrite suggestions per section."),
        ("human", "{cv_json}"),
    ])
    chain = prompt | llm
    return chain.invoke({"cv_json": cv.model_dump_json()})


def match_jobs(cv: ExtractedCV, provider: str = settings.DEFAULT_LLM_PROVIDER, location: str = "") -> JobMatchReport:
    """Asks the LLM to judge fit (title, score, reasoning, skill gaps) but never trusts it
    to invent URLs — apply/learning links are always built deterministically afterwards
    via job_search_service, so every link in the response is guaranteed valid."""
    llm = _structured_llm(provider, _RawJobMatchReport)
    prompt = ChatPromptTemplate.from_messages([
        ("system", "Given this candidate profile, suggest the 5 best-fit job titles. "
                   "For each, provide a match score (0-100), reasoning, and the skills the "
                   "candidate is missing for that role (skill_gaps)."),
        ("human", "{cv_json}"),
    ])
    chain = prompt | llm
    raw: _RawJobMatchReport = chain.invoke({"cv_json": cv.model_dump_json()})

    matches: List[JobMatch] = []
    for m in raw.matches:
        links = build_search_links(m.job_title, location)
        skill_gaps = [
            SkillGap(
                skill=g.skill,
                resource_name="Coursera",
                resource_url=build_learning_link(g.skill)["coursera"],
            )
            for g in m.skill_gaps
        ]
        matches.append(JobMatch(
            job_title=m.job_title,
            match_score=m.match_score,
            reasoning=m.reasoning,
            apply_links=list(links.values()),
            skill_gaps=skill_gaps,
        ))
    return JobMatchReport(matches=matches)
