import logging

from fastapi import APIRouter, BackgroundTasks, Depends, File, HTTPException, UploadFile, status
from fastapi.responses import Response
from motor.motor_asyncio import AsyncIOMotorDatabase

from app.auth.api_key import require_api_key
from app.core.deps import get_db
from app.services import llm_service, mongo_service, s3_service
from app.utils.file_parsing import (
    DOCX_MIME_TYPES,
    IMAGE_MIME_TYPES,
    PDF_MIME_TYPES,
    TEXT_MIME_TYPES,
    extract_docx_text,
    extract_pdf_text,
    extract_plain_text,
    pdf_to_image_bytes,
    to_image_bytes,
)

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/cv", tags=["cv"])

ALLOWED_MIME_TYPES = DOCX_MIME_TYPES | IMAGE_MIME_TYPES | PDF_MIME_TYPES | TEXT_MIME_TYPES

_EXTENSION_TO_MIME: dict[str, str] = {
    ".pdf": next(iter(PDF_MIME_TYPES)),
    ".docx": next(iter(DOCX_MIME_TYPES)),
    ".txt": next(iter(TEXT_MIME_TYPES)),
    ".png": "image/png",
    ".jpg": "image/jpeg",
    ".jpeg": "image/jpeg",
    ".webp": "image/webp",
}


def _mime_from_filename(filename: str) -> str:
    """Maps a filename's extension to its mime type. Falls back to
    application/octet-stream for unknown extensions so the browser will offer a
    download instead of trying to render something it can't preview."""
    lower = filename.lower()
    for ext, mime in _EXTENSION_TO_MIME.items():
        if lower.endswith(ext):
            return mime
    return "application/octet-stream"


@router.post("/upload", dependencies=[Depends(require_api_key)])
async def upload_cv(
    background_tasks: BackgroundTasks,
    file: UploadFile = File(...),
    db: AsyncIOMotorDatabase = Depends(get_db),
):
    if file.content_type not in ALLOWED_MIME_TYPES:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Unsupported file type. Please upload a PDF, DOCX, TXT, or image (PNG/JPG) file.",
        )

    raw = await file.read()
    try:
        storage_key = s3_service.upload_file(raw, file.filename)
    except Exception as exc:
        logger.exception("Failed to store uploaded file")
        raise HTTPException(status_code=status.HTTP_502_BAD_GATEWAY, detail=f"Could not store the uploaded file: {exc}") from exc
    candidate = await mongo_service.create_candidate(db, file.filename, storage_key)
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


@router.get("/{candidate_id}/preview-file", dependencies=[Depends(require_api_key)])
async def get_cv_preview_file(candidate_id: str, db: AsyncIOMotorDatabase = Depends(get_db)):
    candidate = await mongo_service.get_candidate(db, candidate_id)
    if candidate is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Candidate not found")
    # Stream the file through our own API instead of handing the browser a raw S3
    # URL: S3 buckets have no CORS policy configured (and the IAM user scoped for
    # this app can't grant itself s3:PutBucketCORS to fix that), so a direct
    # browser fetch() against S3 fails. Proxying through our own already-CORS-
    # enabled backend sidesteps the problem entirely — and keeps auth consistent,
    # since this route stays behind the same x-api-key dependency as everything else.
    try:
        file_bytes = s3_service.download_file(candidate["cv_s3_key"])
    except Exception as exc:
        logger.exception("Failed to fetch stored file for preview")
        raise HTTPException(status_code=status.HTTP_502_BAD_GATEWAY, detail=f"Could not load the file for preview: {exc}") from exc
    mime_type = _mime_from_filename(candidate["original_filename"])
    return Response(content=file_bytes, media_type=mime_type)


async def run_analysis_pipeline(candidate_id: str, raw_bytes: bytes, mime_type: str, db: AsyncIOMotorDatabase):
    try:
        if mime_type in DOCX_MIME_TYPES:
            text = extract_docx_text(raw_bytes)
            cv = llm_service.extract_cv_from_text(text)
        elif mime_type in PDF_MIME_TYPES:
            text = extract_pdf_text(raw_bytes)
            if text.strip():
                # Normal PDF with an embedded text layer — fast text path
                cv = llm_service.extract_cv_from_text(text)
            else:
                # Scanned / image-only PDF — render page 1 to PNG and use multimodal path
                logger.info("PDF has no text layer for candidate %s — falling back to image extraction", candidate_id)
                image_bytes, image_mime = pdf_to_image_bytes(raw_bytes)
                cv = llm_service.extract_cv_from_file(image_bytes, image_mime)
        elif mime_type in TEXT_MIME_TYPES:
            text = extract_plain_text(raw_bytes)
            cv = llm_service.extract_cv_from_text(text)
        else:
            image_bytes, image_mime = to_image_bytes(raw_bytes, mime_type)
            cv = llm_service.extract_cv_from_file(image_bytes, image_mime)

        improvements = llm_service.generate_improvements(cv)
        jobs = llm_service.match_jobs(cv)
        await mongo_service.save_analysis(db, candidate_id, cv, improvements, jobs)
    except Exception as exc:
        logger.exception("Analysis pipeline failed for candidate %s", candidate_id)
        await mongo_service.update_candidate_status(db, candidate_id, "failed", error_detail=str(exc))
