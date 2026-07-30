# CV Recommender API

FastAPI backend that accepts a candidate's CV (PDF/DOCX/TXT/image), extracts structured
data via an LLM, suggests concrete CV improvements, and recommends jobs with real
apply/learning links.

### LLM provider

[`app/services/llm_service.py`](app/services/llm_service.py) supports four
interchangeable providers via `get_llm(provider)`: `huggingface` (default —
Hugging Face's `Qwen/Qwen3.5-9B`, free-tier), `groq`, `gemini`, and `openai` (the
multimodal/vision fallback for image uploads and scanned PDFs — see
`VISION_CAPABLE_PROVIDERS`). Switch the active default via `DEFAULT_LLM_PROVIDER` in
`.env`; all four stay fully implemented and working regardless of which is active.

Qwen3.5-9B is a "thinking" model — its hidden reasoning trace is disabled via
`chat_template_kwargs.enable_thinking=False` (bound *after* `with_structured_output`,
see the comment in `llm_service.py`), since left on it burns most of the token budget
before producing the real answer.

## Local setup

```bash
cd backend
python -m venv venv
venv\Scripts\activate          # Windows
pip install -r requirements.txt
copy .env.example .env         # fill in OPENAI_API_KEY / GEMINI_API_KEY / MONGODB_URI
uvicorn app.main:app --reload
```

MongoDB connectivity uses Motor (`motor.motor_asyncio.AsyncIOMotorClient`), created on
startup and closed on shutdown via a FastAPI `lifespan` (see `app/core/deps.py`). Point
`MONGODB_URI` in `.env` at your Atlas connection string (with the real password, not
the `<db_password>` placeholder Atlas gives you), then verify with:

```bash
curl http://localhost:8000/health/db
```

### CV file storage: AWS S3

Uploaded CVs are written to S3 via
[`app/services/s3_service.py`](app/services/s3_service.py). Set `AWS_S3_ACCESS_KEY_ID`,
`AWS_S3_SECRET_ACCESS_KEY`, `AWS_S3_REGION`, and `AWS_STORAGE_BUCKET_NAME` in `.env`.
CVs are stored under the `cvs/` prefix with a UUID-prefixed key. Previews are served
through the backend proxy endpoint (`GET /cv/{candidate_id}/preview-file`), which
streams the file bytes from S3 behind the existing `x-api-key` auth.

### LLM call tracing: LangSmith

Every LangChain call in [`app/services/llm_service.py`](app/services/llm_service.py)
(extraction, improvements, job matching) can be traced in
[LangSmith](https://smith.langchain.com). Set `LANGSMITH_TRACING=true`,
`LANGSMITH_API_KEY`, and `LANGSMITH_PROJECT` in `.env`. The `langsmith` SDK reads its
config from `os.environ`, not from our `Settings` object, so
[`app/core/config.py`](app/core/config.py) mirrors those four values across at import
time — no other code needs to know tracing exists. Leave `LANGSMITH_TRACING=false` (the
default) to disable it entirely.

## Running tests

```bash
pytest
```

Unit tests mock `boto3`, the LangChain LLM clients, and MongoDB. Integration tests
use `mongomock-motor` for an in-memory async Mongo and FastAPI's `TestClient`, with
LLM calls mocked. Coverage target is ≥80%, enforced via `pytest.ini`.

## API

| Method | Path                          | Description                              | Auth    |
|--------|-------------------------------|-------------------------------------------|---------|
| POST   | `/cv/upload`                  | Upload CV, kicks off async analysis       | API Key |
| GET    | `/cv/{candidate_id}`          | Candidate metadata + status               | API Key |
| GET    | `/cv/{candidate_id}/analysis` | Extracted profile + improvement report    | API Key |
| POST   | `/jobs/recommendations`       | `{candidate_id}` → job matches with links | API Key |
| GET    | `/health`                     | Liveness/readiness probe                  | none    |
| GET    | `/health/db`                  | Manual MongoDB reachability check         | none    |

Send the API key in the `x-api-key` header.

## Deployment

Docker image built and pushed to ECR via CodeBuild, deployed to Elastic Beanstalk
(behind an ALB) via CodePipeline / GitHub Actions (`.github/workflows/dev.yml`,
`prod.yml` at the repo root). Secrets are pulled from AWS Secrets Manager into the
EB instance environment at boot (see `.ebextensions/01_environment.config` and
`scripts/load_secrets_to_env.py`).
