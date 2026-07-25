from app.models.candidate import Candidate
from app.models.analysis import Analysis


def test_candidate_defaults_to_processing_status():
    candidate = Candidate(cv_s3_key="cvs/abc.pdf", original_filename="cv.pdf")
    assert candidate.status == "processing"
    assert candidate.full_name is None
    assert candidate.uploaded_at is not None


def test_candidate_populates_by_alias():
    candidate = Candidate(**{"_id": "123", "cv_s3_key": "cvs/abc.pdf", "original_filename": "cv.pdf"})
    assert candidate.id == "123"


def test_analysis_stores_raw_report_dicts():
    analysis = Analysis(
        candidate_id="123",
        extracted_profile={"full_name": "Ama Owusu"},
        improvements={"overall_score": 80},
        job_matches={"matches": []},
    )
    assert analysis.candidate_id == "123"
    assert analysis.extracted_profile["full_name"] == "Ama Owusu"
