import asyncio
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from app.pipeline.graph import pipeline
from app.db.session import AsyncSessionLocal
from app.db.models import Job

router = APIRouter()


class RunRequest(BaseModel):
    job_id: str


@router.post("/pipeline/run", status_code=202)
async def run_pipeline(req: RunRequest):
    async with AsyncSessionLocal() as session:
        job = await session.get(Job, req.job_id)
        if not job:
            raise HTTPException(status_code=404, detail="Job not found")
        initial_state = {
            "job_id": job.id,
            "company_name": job.company_name,
            "jd_raw": job.jd_raw,
            "jd_parsed": None,
            "candidate_count": 0,
            "top_candidate_ids": [],
            "error": None,
        }

    asyncio.create_task(pipeline.ainvoke(initial_state))
    return {"status": "accepted", "job_id": req.job_id}
