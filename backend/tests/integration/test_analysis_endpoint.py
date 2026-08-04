async def test_get_analysis_before_pipeline_completes(client, api_key_headers, mock_db):
    from app.models.candidate import Candidate

    candidate = Candidate(cv_s3_key="cvs/fake.pdf", original_filename="cv.pdf")
    result = await mock_db["candidates"].insert_one(candidate.model_dump(by_alias=True, exclude={"id"}))
    candidate_id = str(result.inserted_id)

    response = client.get(f"/cv/{candidate_id}/analysis", headers=api_key_headers)

    assert response.status_code == 200
    body = response.json()
    assert body["status"] == "processing"
    assert "extracted_profile" not in body


async def test_get_analysis_after_pipeline_completes(client, api_key_headers, mock_db):
    candidate_result = await mock_db["candidates"].insert_one({
        "cv_s3_key": "cvs/fake.pdf",
        "original_filename": "cv.pdf",
        "status": "analyzed",
    })
    candidate_id = str(candidate_result.inserted_id)
    await mock_db["analyses"].insert_one({
        "candidate_id": candidate_id,
        "extracted_profile": {"full_name": "Ama Owusu"},
        "improvements": {"overall_score": 82},
        "job_matches": {"matches": []},
    })

    response = client.get(f"/cv/{candidate_id}/analysis", headers=api_key_headers)

    assert response.status_code == 200
    body = response.json()
    assert body["status"] == "analyzed"
    assert body["extracted_profile"]["full_name"] == "Ama Owusu"
    assert body["improvements"]["overall_score"] == 82
    assert body["job_matches"] == {"matches": []}


def test_get_analysis_unknown_candidate_404(client, api_key_headers):
    response = client.get("/cv/000000000000000000000000/analysis", headers=api_key_headers)
    assert response.status_code == 404


def test_get_candidate_success(client, api_key_headers):
    from unittest.mock import patch

    with patch("app.services.s3_service.upload_file", return_value="cvs/fake-key.png"), \
         patch("app.services.llm_service.extract_cv_from_file"), \
         patch("app.services.llm_service.generate_improvements"), \
         patch("app.services.llm_service.match_jobs"):
        upload_response = client.post(
            "/cv/upload",
            headers=api_key_headers,
            files={"file": ("cv.png", b"fake-bytes", "image/png")},
        )
    candidate_id = upload_response.json()["candidate_id"]

    response = client.get(f"/cv/{candidate_id}", headers=api_key_headers)

    assert response.status_code == 200
    assert response.json()["original_filename"] == "cv.png"
