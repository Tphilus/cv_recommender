from unittest.mock import MagicMock, patch

from app.schemas.cv_schema import ExtractedCV
from app.services import llm_service
from app.services.llm_service import _RawJobMatch, _RawJobMatchReport, _RawSkillGap


def _sample_cv() -> ExtractedCV:
    return ExtractedCV(
        full_name="Ama Owusu",
        skills=["Python", "FastAPI"],
        years_of_experience=3.5,
        experience=[],
        education=[],
    )


@patch.object(llm_service, "get_llm")
def test_match_jobs_never_trusts_llm_for_urls(mock_get_llm):
    """The LLM is only asked for title/score/reasoning/skill names; every apply_link and
    resource_url in the final report must come from job_search_service, not the model."""
    raw_report = _RawJobMatchReport(matches=[
        _RawJobMatch(
            job_title="Backend Engineer",
            match_score=90,
            reasoning="Strong Python background",
            skill_gaps=[_RawSkillGap(skill="Kubernetes")],
        )
    ])
    mock_chain = MagicMock()
    mock_chain.invoke.return_value = raw_report
    mock_llm = MagicMock()
    mock_llm.with_structured_output.return_value = mock_llm
    mock_get_llm.return_value = mock_llm

    with patch("app.services.llm_service.ChatPromptTemplate.from_messages") as mock_prompt:
        mock_prompt.return_value.__or__.return_value = mock_chain
        result = llm_service.match_jobs(_sample_cv())

    match = result.matches[0]
    assert match.job_title == "Backend Engineer"
    assert all(link.startswith("https://") for link in match.apply_links)
    assert any("linkedin.com" in link for link in match.apply_links)
    assert match.skill_gaps[0].skill == "Kubernetes"
    assert match.skill_gaps[0].resource_url.startswith("https://www.coursera.org/search?query=")


@patch.object(llm_service, "get_llm")
def test_extract_cv_from_file_invokes_multimodal_message(mock_get_llm):
    expected_cv = _sample_cv()
    mock_llm = MagicMock()
    mock_llm.with_structured_output.return_value = mock_llm
    mock_llm.invoke.return_value = expected_cv
    mock_get_llm.return_value = mock_llm

    result = llm_service.extract_cv_from_file(b"png-bytes", "image/png")

    assert result == expected_cv
    mock_llm.with_structured_output.assert_called_once_with(ExtractedCV)
    [message] = mock_llm.invoke.call_args[0][0]
    assert message.content[1]["image_url"].startswith("data:image/png;base64,")


@patch.object(llm_service, "get_llm")
def test_extract_cv_from_text_uses_text_prompt(mock_get_llm):
    expected_cv = _sample_cv()
    mock_chain = MagicMock()
    mock_chain.invoke.return_value = expected_cv
    mock_llm = MagicMock()
    mock_llm.with_structured_output.return_value = mock_llm
    mock_get_llm.return_value = mock_llm

    with patch("app.services.llm_service.ChatPromptTemplate.from_messages") as mock_prompt:
        mock_prompt.return_value.__or__.return_value = mock_chain
        result = llm_service.extract_cv_from_text("Ama Owusu, Backend Engineer")

    assert result == expected_cv
    mock_chain.invoke.assert_called_once_with({"cv_text": "Ama Owusu, Backend Engineer"})


@patch.object(llm_service, "get_llm")
def test_generate_improvements_returns_report(mock_get_llm):
    from app.schemas.improvement_schema import ImprovementReport

    expected_report = ImprovementReport(overall_score=75, strengths=["Clear"], improvements=[])
    mock_chain = MagicMock()
    mock_chain.invoke.return_value = expected_report
    mock_llm = MagicMock()
    mock_llm.with_structured_output.return_value = mock_llm
    mock_get_llm.return_value = mock_llm

    with patch("app.services.llm_service.ChatPromptTemplate.from_messages") as mock_prompt:
        mock_prompt.return_value.__or__.return_value = mock_chain
        result = llm_service.generate_improvements(_sample_cv())

    assert result == expected_report


def test_get_llm_defaults_to_openai():
    with patch("app.services.llm_service.ChatOpenAI") as mock_openai:
        llm_service.get_llm("openai")
        mock_openai.assert_called_once()


def test_get_llm_gemini_provider():
    with patch("app.services.llm_service.ChatGoogleGenerativeAI") as mock_gemini:
        llm_service.get_llm("gemini")
        mock_gemini.assert_called_once()


def test_get_llm_groq_provider():
    with patch("app.services.llm_service.ChatGroq") as mock_groq:
        llm_service.get_llm("groq")
        mock_groq.assert_called_once()
