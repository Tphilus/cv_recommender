from unittest.mock import patch

from app.schemas.cv_schema import ExtractedCV
from app.schemas.improvement_schema import ImprovementReport
from app.schemas.job_match_schema import JobMatchReport


@patch("app.services.llm_service.match_jobs")
@patch("app.services.llm_service.generate_improvements")
@patch("app.services.llm_service.extract_cv_from_file")
@patch("app.routers.cv.to_image_bytes", return_value=(b"fake-png-bytes", "image/png"))
@patch("app.services.s3_service.upload_file", return_value="cvs/fake-key.pdf")
def test_upload_cv_returns_processing_status(
    mock_upload, mock_to_image, mock_extract, mock_improve, mock_match, client, api_key_headers
):
    mock_extract.return_value = ExtractedCV(
        full_name="Ama Owusu", skills=["Python"], years_of_experience=2.0, experience=[], education=[]
    )
    mock_improve.return_value = ImprovementReport(overall_score=80, strengths=[], improvements=[])
    mock_match.return_value = JobMatchReport(matches=[])

    with open("tests/fixtures/sample_cv.pdf", "rb") as f:
        response = client.post(
            "/cv/upload",
            headers=api_key_headers,
            files={"file": ("sample_cv.pdf", f, "application/pdf")},
        )

    assert response.status_code == 200
    body = response.json()
    assert body["status"] == "processing"
    assert "candidate_id" in body


def test_upload_cv_without_api_key_rejected(client):
    with open("tests/fixtures/sample_cv.pdf", "rb") as f:
        response = client.post("/cv/upload", files={"file": ("sample_cv.pdf", f, "application/pdf")})

    assert response.status_code == 422  # missing required x-api-key header


def test_get_candidate_not_found(client, api_key_headers):
    response = client.get("/cv/000000000000000000000000", headers=api_key_headers)
    assert response.status_code == 404
