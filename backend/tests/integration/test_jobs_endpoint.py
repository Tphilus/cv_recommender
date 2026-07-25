async def test_job_recommendations_returns_cached_matches(client, api_key_headers, mock_db):
    candidate = await mock_db["candidates"].insert_one({
        "full_name": "Ama Owusu",
        "cv_s3_key": "cvs/fake.pdf",
        "original_filename": "cv.pdf",
        "status": "analyzed",
    })
    candidate_id = str(candidate.inserted_id)

    job_matches = {"matches": [{
        "job_title": "Backend Engineer",
        "match_score": 91,
        "reasoning": "Strong FastAPI background",
        "apply_links": ["https://www.linkedin.com/jobs/search/?keywords=Backend+Engineer&location="],
        "skill_gaps": [],
    }]}
    await mock_db["analyses"].insert_one({
        "candidate_id": candidate_id,
        "extracted_profile": {},
        "improvements": {},
        "job_matches": job_matches,
    })

    response = client.post(
        "/jobs/recommendations",
        headers=api_key_headers,
        json={"candidate_id": candidate_id},
    )

    assert response.status_code == 200
    assert response.json() == job_matches


def test_job_recommendations_404_when_no_analysis(client, api_key_headers):
    response = client.post(
        "/jobs/recommendations",
        headers=api_key_headers,
        json={"candidate_id": "000000000000000000000000"},
    )
    assert response.status_code == 404
