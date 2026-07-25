import pytest
from pydantic import ValidationError

from app.schemas.cv_schema import ExtractedCV
from app.schemas.improvement_schema import ImprovementReport
from app.schemas.job_match_schema import JobMatchReport


def test_extracted_cv_requires_full_name():
    data = {
        "full_name": "Ama Owusu",
        "skills": ["Python", "FastAPI"],
        "years_of_experience": 3.5,
        "experience": [],
        "education": [],
    }
    cv = ExtractedCV(**data)
    assert cv.full_name == "Ama Owusu"
    assert cv.years_of_experience == 3.5


def test_extracted_cv_missing_required_field_raises():
    with pytest.raises(ValidationError):
        ExtractedCV(skills=["Python"], years_of_experience=1.0, experience=[], education=[])


def test_improvement_report_defaults():
    report = ImprovementReport(overall_score=72, strengths=["Clear structure"], improvements=[])
    assert report.overall_score == 72
    assert report.improvements == []


def test_job_match_report_apply_links_default_empty():
    report = JobMatchReport(matches=[{
        "job_title": "Backend Engineer",
        "match_score": 88,
        "reasoning": "Strong Python + FastAPI background",
    }])
    assert report.matches[0].apply_links == []
    assert report.matches[0].skill_gaps == []
