from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse

from app.core.deps import lifespan
from app.routers import analysis, cv, jobs

app = FastAPI(title="CV Recommender API", lifespan=lifespan)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(cv.router)
app.include_router(analysis.router)
app.include_router(jobs.router)


@app.get("/health")
async def health():
    return {"status": "ok"}


@app.get("/health/db")
async def health_db():
    """Manual MongoDB reachability check"""
    try:
        await app.state.mongodb_client.admin.command("ping")
        return {"ok": True, "message": "MongoDB is Connected"}
    except Exception as e:
        return JSONResponse(status_code=500, content={"ok": False, "error": str(e)})
