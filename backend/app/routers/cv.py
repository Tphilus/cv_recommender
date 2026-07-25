import logging

from fastapi import APIRouter, BackgroundTasks, Depends, File, HTTPException, UploadFile, status
from motor.motor_asyncio import AsyncIOMotorDatabase

from app.auth.api_key import require_api_key
from app.core.deps import get_db
from app.services import llm_service, mongo_service, s3_service
from app.utils.file_parsing import DOCX_MIME_TYPES, extract_docx_text, to_image_bytes

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/cv", tags=["cv"])


@router.post("/upload", dependencies=[Depends(require_api_key)])
async def upload_cv(
    background_tasks: BackgroundTasks,
    file: UploadFile = File(...),
    db: AsyncIOMotorDatabase = Depends(get_db),
):
    raw = await file.read()
    s3_key = s3_service.upload_file(raw, file.filename)
    candidate = await mongo_service.create_candidate(db, file.filename, s3_key)
    candidate_id = str(candidate["_id"])

    background_tasks.add_task(run_analysis_pipeline, candidate_id, raw, file.content_type, db)
    return {"candidate_id": candidate_id, "status": "processing"}


@router.get("/{candidate_id}", dependencies=[Depends(require_api_key)])
async def get_candidate(candidate_id: str, db: AsyncIOMotorDatabase = Depends(get_db)):
    candidate = await mongo_service.get_candidate(db, candidate_id)
    if candidate is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Candidate not found")
    candidate["_id"] = str(candidate["_id"])
    return candidate


async def run_analysis_pipeline(candidate_id: str, raw_bytes: bytes, mime_type: str, db: AsyncIOMotorDatabase):
    try:
        if mime_type in DOCX_MIME_TYPES:
            text = extract_docx_text(raw_bytes)
            cv = llm_service.extract_cv_from_text(text)
        else:
            image_bytes, image_mime = to_image_bytes(raw_bytes, mime_type)
            cv = llm_service.extract_cv_from_file(image_bytes, image_mime)

        improvements = llm_service.generate_improvements(cv)
        jobs = llm_service.match_jobs(cv)
        await mongo_service.save_analysis(db, candidate_id, cv, improvements, jobs)
    except Exception:
        logger.exception("Analysis pipeline failed for candidate %s", candidate_id)
        await mongo_service.update_candidate_status(db, candidate_id, "failed")
