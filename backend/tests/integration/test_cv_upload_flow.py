from unittest.mock import patch

from app.schemas.cv_schema import ExtractedCV
from app.schemas.improvement_schema import ImprovementReport
from app.schemas.job_match_schema import JobMatchReport


@patch("app.services.llm_service.match_jobs")
@patch("app.services.llm_service.generate_improvements")
@patch("app.services.llm_service.extract_cv_from_file")
@patch("app.routers.cv.to_image_bytes", return_value=(b"fake-png-bytes", "image/png"))
@patch("app.services.s3_service.upload_file", return_value="cvs/fake-key.png")
def test_upload_cv_returns_processing_status(
    mock_upload, mock_to_image, mock_extract, mock_improve, mock_match, client, api_key_headers
):
    mock_extract.return_value = ExtractedCV(
        full_name="Ama Owusu", skills=["Python"], years_of_experience=2.0, experience=[], education=[]
    )
    mock_improve.return_value = ImprovementReport(overall_score=80, strengths=[], improvements=[])
    mock_match.return_value = JobMatchReport(matches=[])

    response = client.post(
        "/cv/upload",
        headers=api_key_headers,
        files={"file": ("sample_cv.png", b"fake-image-bytes", "image/png")},
    )

    assert response.status_code == 200
    body = response.json()
    assert body["status"] == "processing"
    assert "candidate_id" in body


@patch("app.services.s3_service.upload_file", side_effect=RuntimeError("Invalid Signature: cloud_name mismatch"))
def test_upload_cv_returns_502_when_storage_fails(mock_upload, client, api_key_headers):
    response = client.post(
        "/cv/upload",
        headers=api_key_headers,
        files={"file": ("sample_cv.png", b"fake-image-bytes", "image/png")},
    )

    assert response.status_code == 502
    assert "Invalid Signature" in response.json()["detail"]


def test_upload_cv_rejects_unsupported_file_type(client, api_key_headers):
    # Legacy binary .doc (pre-2007 Word format) is deliberately not supported —
    # only modern .docx, which python-docx can actually parse without an
    # external converter.
    response = client.post(
        "/cv/upload",
        headers=api_key_headers,
        files={"file": ("sample_cv.doc", b"fake-doc-bytes", "application/msword")},
    )

    assert response.status_code == 400
    assert "Unsupported file type" in response.json()["detail"]


def test_upload_cv_without_api_key_rejected(client):
    response = client.post("/cv/upload", files={"file": ("sample_cv.png", b"fake-image-bytes", "image/png")})

    assert response.status_code == 422  # missing required x-api-key header


def test_get_candidate_not_found(client, api_key_headers):
    response = client.get("/cv/000000000000000000000000", headers=api_key_headers)
    assert response.status_code == 404


@patch("app.services.s3_service.upload_file", return_value="cvs/fake-key.pdf")
@patch("app.services.s3_service.download_file", return_value=b"fake-pdf-bytes")
def test_get_cv_preview_file_streams_bytes_with_mime(
    mock_download, mock_upload, client, api_key_headers
):
    upload_response = client.post(
        "/cv/upload",
        headers=api_key_headers,
        files={"file": ("sample_cv.pdf", b"fake-pdf-bytes", "application/pdf")},
    )
    candidate_id = upload_response.json()["candidate_id"]

    response = client.get(f"/cv/{candidate_id}/preview-file", headers=api_key_headers)

    assert response.status_code == 200
    assert response.headers["content-type"] == "application/pdf"
    assert response.content == b"fake-pdf-bytes"
    mock_download.assert_called_once_with("cvs/fake-key.pdf")


@patch("app.services.s3_service.upload_file", return_value="cvs/fake-key.png")
@patch("app.services.s3_service.download_file", return_value=b"x")
def test_get_cv_preview_file_derives_mime_from_filename_extension(
    mock_download, mock_upload, client, api_key_headers
):
    for filename, expected_mime in [
        ("resume.pdf", "application/pdf"),
        ("resume.docx", "application/vnd.openxmlformats-officedocument.wordprocessingml.document"),
        ("resume.txt", "text/plain"),
        ("photo.png", "image/png"),
        ("photo.JPG", "image/jpeg"),  # case-insensitive
    ]:
        upload_response = client.post(
            "/cv/upload",
            headers=api_key_headers,
            files={"file": (filename, b"x", expected_mime)},
        )
        candidate_id = upload_response.json()["candidate_id"]

        response = client.get(f"/cv/{candidate_id}/preview-file", headers=api_key_headers)
        # text/plain gets "; charset=utf-8" appended by Starlette — compare the base type only.
        assert response.headers["content-type"].split(";")[0] == expected_mime, filename


@patch("app.services.s3_service.upload_file", return_value="cvs/fake-key.pdf")
@patch("app.services.s3_service.download_file", side_effect=RuntimeError("NoSuchKey"))
def test_get_cv_preview_file_returns_502_when_download_fails(mock_download, mock_upload, client, api_key_headers):
    upload_response = client.post(
        "/cv/upload",
        headers=api_key_headers,
        files={"file": ("sample_cv.pdf", b"fake-pdf-bytes", "application/pdf")},
    )
    candidate_id = upload_response.json()["candidate_id"]

    response = client.get(f"/cv/{candidate_id}/preview-file", headers=api_key_headers)

    assert response.status_code == 502
    assert "NoSuchKey" in response.json()["detail"]


def test_get_cv_preview_file_unknown_candidate_404(client, api_key_headers):
    response = client.get("/cv/000000000000000000000000/preview-file", headers=api_key_headers)
    assert response.status_code == 404


def test_get_cv_preview_file_without_api_key_rejected(client):
    response = client.get("/cv/000000000000000000000000/preview-file")
    assert response.status_code == 422  # missing required x-api-key header


@patch("app.services.s3_service.upload_file", return_value="cvs/fake-key.pdf")
@patch("app.services.s3_service.delete_file")
def test_delete_candidate_removes_candidate_and_file(mock_delete, mock_upload, client, api_key_headers):
    upload_response = client.post(
        "/cv/upload",
        headers=api_key_headers,
        files={"file": ("sample_cv.pdf", b"fake-pdf-bytes", "application/pdf")},
    )
    candidate_id = upload_response.json()["candidate_id"]

    response = client.delete(f"/cv/{candidate_id}", headers=api_key_headers)

    assert response.status_code == 204
    mock_delete.assert_called_once_with("cvs/fake-key.pdf")
    assert client.get(f"/cv/{candidate_id}", headers=api_key_headers).status_code == 404


@patch("app.services.s3_service.upload_file", return_value="cvs/fake-key.pdf")
@patch("app.services.s3_service.delete_file", side_effect=RuntimeError("AccessDenied"))
def test_delete_candidate_still_deletes_db_record_if_s3_delete_fails(mock_delete, mock_upload, client, api_key_headers):
    upload_response = client.post(
        "/cv/upload",
        headers=api_key_headers,
        files={"file": ("sample_cv.pdf", b"fake-pdf-bytes", "application/pdf")},
    )
    candidate_id = upload_response.json()["candidate_id"]

    response = client.delete(f"/cv/{candidate_id}", headers=api_key_headers)

    assert response.status_code == 204
    assert client.get(f"/cv/{candidate_id}", headers=api_key_headers).status_code == 404


def test_delete_candidate_not_found(client, api_key_headers):
    response = client.delete("/cv/000000000000000000000000", headers=api_key_headers)
    assert response.status_code == 404


def test_delete_candidate_without_api_key_rejected(client):
    response = client.delete("/cv/000000000000000000000000")
    assert response.status_code == 422  # missing required x-api-key header
