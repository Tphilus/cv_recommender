from typing import Optional

from bson import ObjectId
from bson.errors import InvalidId
from motor.motor_asyncio import AsyncIOMotorDatabase

from app.models.analysis import Analysis
from app.models.candidate import Candidate
from app.schemas.cv_schema import ExtractedCV
from app.schemas.improvement_schema import ImprovementReport
from app.schemas.job_match_schema import JobMatchReport

CANDIDATES = "candidates"
ANALYSES = "analyses"


def _to_object_id(candidate_id: str) -> Optional[ObjectId]:
    try:
        return ObjectId(candidate_id)
    except (InvalidId, TypeError):
        return None


async def create_candidate(db: AsyncIOMotorDatabase, original_filename: str, s3_key: str) -> dict:
    candidate = Candidate(cv_s3_key=s3_key, original_filename=original_filename)
    doc = candidate.model_dump(by_alias=True, exclude={"id"})
    result = await db[CANDIDATES].insert_one(doc)
    doc["_id"] = result.inserted_id
    return doc


async def get_candidate(db: AsyncIOMotorDatabase, candidate_id: str) -> Optional[dict]:
    oid = _to_object_id(candidate_id)
    if oid is None:
        return None
    return await db[CANDIDATES].find_one({"_id": oid})


async def update_candidate_status(
    db: AsyncIOMotorDatabase, candidate_id: str, status: str, error_detail: Optional[str] = None
) -> None:
    oid = _to_object_id(candidate_id)
    if oid is None:
        return
    await db[CANDIDATES].update_one({"_id": oid}, {"$set": {"status": status, "error_detail": error_detail}})


async def save_analysis(
    db: AsyncIOMotorDatabase,
    candidate_id: str,
    cv: ExtractedCV,
    improvements: ImprovementReport,
    jobs: JobMatchReport,
) -> dict:
    analysis = Analysis(
        candidate_id=candidate_id,
        extracted_profile=cv.model_dump(),
        improvements=improvements.model_dump(),
        job_matches=jobs.model_dump(),
    )
    doc = analysis.model_dump(by_alias=True, exclude={"id"})
    result = await db[ANALYSES].insert_one(doc)
    doc["_id"] = result.inserted_id

    oid = _to_object_id(candidate_id)
    if oid is not None:
        await db[CANDIDATES].update_one(
            {"_id": oid},
            {"$set": {"status": "analyzed", "full_name": cv.full_name, "email": cv.email}},
        )
    return doc


async def get_analysis(db: AsyncIOMotorDatabase, candidate_id: str) -> Optional[dict]:
    return await db[ANALYSES].find_one({"candidate_id": candidate_id}, sort=[("created_at", -1)])


async def delete_candidate(db: AsyncIOMotorDatabase, candidate_id: str) -> bool:
    """Deletes the candidate document and every analysis tied to it. Returns
    whether a candidate document was actually found and deleted."""
    oid = _to_object_id(candidate_id)
    if oid is None:
        return False
    await db[ANALYSES].delete_many({"candidate_id": candidate_id})
    result = await db[CANDIDATES].delete_one({"_id": oid})
    return result.deleted_count > 0
