from datetime import datetime, timezone
from typing import Optional

from pydantic import BaseModel, ConfigDict, Field


class Candidate(BaseModel):
    model_config = ConfigDict(populate_by_name=True)

    id: Optional[str] = Field(default=None, alias="_id")
    full_name: Optional[str] = None
    email: Optional[str] = None
    cv_s3_key: str
    original_filename: str
    uploaded_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    status: str = "processing"  # processing | analyzed | failed
    error_detail: Optional[str] = None
