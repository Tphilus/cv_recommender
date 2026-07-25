from typing import List

from pydantic import BaseModel, Field


class SkillGap(BaseModel):
    skill: str
    resource_name: str
    resource_url: str


class JobMatch(BaseModel):
    job_title: str
    match_score: int  # 0-100
    reasoning: str
    apply_links: List[str] = Field(default_factory=list)  # e.g. LinkedIn/Indeed search URLs
    skill_gaps: List[SkillGap] = Field(default_factory=list)


class JobMatchReport(BaseModel):
    matches: List[JobMatch]
