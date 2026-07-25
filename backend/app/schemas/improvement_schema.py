from typing import List

from pydantic import BaseModel


class Improvement(BaseModel):
    section: str  # e.g. "Summary", "Experience - Company X"
    issue: str  # what's wrong
    suggestion: str  # concrete rewrite / fix
    priority: str  # "high" | "medium" | "low"


class ImprovementReport(BaseModel):
    overall_score: int  # 0-100
    strengths: List[str]
    improvements: List[Improvement]
