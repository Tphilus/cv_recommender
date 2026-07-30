# CV Recommender API

FastAPI backend that accepts a candidate's CV (PDF/DOCX/TXT/image), extracts structured
data via a multimodal LLM (OpenAI GPT-4o or Gemini 1.5 Pro), suggests concrete CV
improvements, and recommends jobs with real apply/learning links.

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
