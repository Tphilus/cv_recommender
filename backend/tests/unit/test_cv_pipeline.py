from unittest.mock import AsyncMock, patch

import pytest

from app.routers.cv import run_analysis_pipeline


@pytest.mark.parametrize("mime_type", ["application/vnd.openxmlformats-officedocument.wordprocessingml.document"])
@patch("app.routers.cv.mongo_service.save_analysis", new_callable=AsyncMock)
@patch("app.routers.cv.llm_service.match_jobs")
@patch("app.routers.cv.llm_service.generate_improvements")
@patch("app.routers.cv.llm_service.extract_cv_from_text")
@patch("app.routers.cv.extract_docx_text", return_value="Ama Owusu\nBackend Engineer")
async def test_pipeline_uses_text_extraction_for_docx(
    mock_extract_text, mock_llm_text, mock_improve, mock_match, mock_save, mime_type
):
    await run_analysis_pipeline("candidate-1", b"docx-bytes", mime_type, db=object())

    mock_extract_text.assert_called_once_with(b"docx-bytes")
    mock_llm_text.assert_called_once_with("Ama Owusu\nBackend Engineer")
    mock_save.assert_called_once()


@patch("app.routers.cv.mongo_service.update_candidate_status", new_callable=AsyncMock)
@patch("app.routers.cv.llm_service.extract_cv_from_file", side_effect=RuntimeError("LLM unavailable"))
async def test_pipeline_marks_candidate_failed_on_exception(mock_extract, mock_update_status):
    fake_db = object()

    await run_analysis_pipeline("candidate-1", b"png-bytes", "image/png", db=fake_db)

    mock_update_status.assert_called_once_with(fake_db, "candidate-1", "failed")
