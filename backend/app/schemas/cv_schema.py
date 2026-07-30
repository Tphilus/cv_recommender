from typing import List, Optional

from pydantic import BaseModel, Field


class Experience(BaseModel):
    company: str
    title: str
    start_date: Optional[str] = None
    end_date: Optional[str] = None
    summary: str
    achievements: List[str] = Field(default_factory=list)


class Education(BaseModel):
    institution: str
    degree: str
    field_of_study: Optional[str] = None
    graduation_year: Optional[str] = None


class ExtractedCV(BaseModel):
    full_name: str
    email: Optional[str] = None
    phone: Optional[str] = None
    headline: Optional[str] = Field(None, description="Current title / summary line")
    skills: List[str]
    years_of_experience: float
    experience: List[Experience]
    education: List[Education]
    certifications: List[str] = Field(default_factory=list)


class _RawSkillGap(BaseModel):
    skill: str


class _RawJobMatch(BaseModel):
    job_title: str
    match_score: int
    reasoning: str
    skill_gaps: List[_RawSkillGap] = []


class _RawJobMatchReport(BaseModel):
    matches: List[_RawJobMatch]