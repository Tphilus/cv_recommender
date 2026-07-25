from fastapi import APIRouter, Depends, HTTPException, status
from motor.motor_asyncio import AsyncIOMotorDatabase
from pydantic import BaseModel

from app.auth.api_key import require_api_key
from app.core.deps import get_db
from app.services import mongo_service

router = APIRouter(prefix="/jobs", tags=["jobs"])


class JobRecommendationRequest(BaseModel):
    candidate_id: str


@router.post("/recommendations", dependencies=[Depends(require_api_key)])
async def get_job_recommendations(body: JobRecommendationRequest, db: AsyncIOMotorDatabase = Depends(get_db)):
    analysis = await mongo_service.get_analysis(db, body.candidate_id)
    if analysis is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="No analysis found for this candidate yet",
        )
    return analysis["job_matches"]
