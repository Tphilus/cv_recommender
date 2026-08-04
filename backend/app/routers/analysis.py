from fastapi import APIRouter, Depends, HTTPException, status
from motor.motor_asyncio import AsyncIOMotorDatabase

from app.auth.api_key import require_api_key
from app.core.deps import get_db
from app.services import mongo_service

router = APIRouter(prefix="/cv", tags=["analysis"])


@router.get("/{candidate_id}/analysis", dependencies=[Depends(require_api_key)])
async def get_analysis(candidate_id: str, db: AsyncIOMotorDatabase = Depends(get_db)):
    candidate = await mongo_service.get_candidate(db, candidate_id)
    if candidate is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Candidate not found")

    analysis = await mongo_service.get_analysis(db, candidate_id)
    if analysis is None:
        return {"candidate_id": candidate_id, "status": candidate["status"]}

    analysis["_id"] = str(analysis["_id"])
    return {
        "candidate_id": candidate_id,
        "status": candidate["status"],
        "extracted_profile": analysis["extracted_profile"],
        "improvements": analysis["improvements"],
        # Return the complete persisted snapshot. The frontend can restore a
        # recent analysis with this single database read; no LLM work is
        # started by this endpoint.
        "job_matches": analysis["job_matches"],
    }
