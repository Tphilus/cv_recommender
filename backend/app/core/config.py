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


settings = Settings()
