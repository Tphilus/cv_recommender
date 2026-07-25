from datetime import datetime, timezone
from typing import Optional

from pydantic import BaseModel, ConfigDict, Field


class Analysis(BaseModel):
    model_config = ConfigDict(populate_by_name=True)

    id: Optional[str] = Field(default=None, alias="_id")
    candidate_id: str
    extracted_profile: dict  # ExtractedCV, stored as raw dict
    improvements: dict  # ImprovementReport, stored as raw dict
    job_matches: dict  # JobMatchReport, stored as raw dict
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
