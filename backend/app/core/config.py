import os

from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env", env_file_encoding="utf-8", extra="ignore")

    ENV: str = "dev"

    MONGODB_URI: str = "mongodb://localhost:27017"
    MONGODB_DB_NAME: str = "cv_recommender"

    OPENAI_API_KEY: str = ""
    GEMINI_API_KEY: str = ""
    GROQ_API_KEY: str = ""
    DEFAULT_LLM_PROVIDER: str = ""

    API_KEY: str = "dev-local-api-key"

    # AWS S3 — active storage backend (app/services/s3_service.py)
    AWS_S3_ACCESS_KEY_ID: str = ""
    AWS_S3_SECRET_ACCESS_KEY: str = ""
    AWS_S3_REGION: str = "eu-north-1"
    AWS_STORAGE_BUCKET_NAME: str = ""

    # LangSmith — traces every LangChain LLM call in app/services/llm_service.py
    LANGSMITH_TRACING: bool = False
    LANGSMITH_ENDPOINT: str = "https://api.smith.langchain.com"
    LANGSMITH_API_KEY: str = ""
    LANGSMITH_PROJECT: str = "default"


settings = Settings()

# The langsmith SDK reads its config directly from os.environ, not from our Settings
# object, so it has to be mirrored across explicitly. Doing this once here (config.py
# is imported before any LangChain code runs) enables tracing app-wide with no changes
# needed in llm_service.py.
if settings.LANGSMITH_TRACING:
    os.environ["LANGSMITH_TRACING"] = "true"
    os.environ["LANGSMITH_ENDPOINT"] = settings.LANGSMITH_ENDPOINT
    os.environ["LANGSMITH_API_KEY"] = settings.LANGSMITH_API_KEY
    os.environ["LANGSMITH_PROJECT"] = settings.LANGSMITH_PROJECT
