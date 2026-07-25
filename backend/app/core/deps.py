from contextlib import asynccontextmanager
from typing import AsyncIterator

from fastapi import FastAPI, Request
from motor.motor_asyncio import AsyncIOMotorClient, AsyncIOMotorDatabase

from app.auth.api_key import require_api_key  # noqa: F401  (re-exported for routers)
from app.core.config import settings


@asynccontextmanager
async def lifespan(app: FastAPI) -> AsyncIterator[None]:
    app.state.mongodb_client = AsyncIOMotorClient(settings.MONGODB_URI)
    try:
        yield
    finally:
        app.state.mongodb_client.close()


def get_db(request: Request) -> AsyncIOMotorDatabase:
    return request.app.state.mongodb_client[settings.MONGODB_DB_NAME]
