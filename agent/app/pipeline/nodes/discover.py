import uuid
from sqlalchemy import update
from app.db.session import AsyncSessionLocal
from app.db.models import Candidate, Job
from app.discovery.github import search_github_candidates
from app.discovery.hn import search_hn_candidates
from app.services.event_poster import post_event
from app.pipeline.state import PipelineState


async def discover_node(state: PipelineState) -> dict:
    job_id = state["job_id"]
    jd_parsed = state.get("jd_parsed") or {}
    required_skills = jd_parsed.get("required_skills", [])

    if state.get("error"):
        return {}

    try:
        github_candidates, hn_candidates = await _gather(required_skills)
        all_candidates = github_candidates + hn_candidates

        async with AsyncSessionLocal() as session:
            for raw in all_candidates:
                session.add(Candidate(
                    id=str(uuid.uuid4()),
                    job_id=job_id,
                    name=raw.get("name"),
                    email=raw.get("email"),
                    source=raw.get("source"),
                    profile_url=raw.get("profile_url"),
                    bio=raw.get("bio"),
                    skills_raw=raw.get("skills_raw", []),
                    email_status="pending" if raw.get("email") else "no_email",
                ))
            await session.execute(update(Job).where(Job.id == job_id).values(status="matching"))
            await session.commit()

        count = len(all_candidates)
        await post_event(job_id, "discovery", f"Found {count} candidates", {"count": count})
        return {"candidate_count": count}
    except Exception as e:
        await post_event(job_id, "failed", f"Discovery failed: {str(e)}")
        return {"error": str(e)}


async def _gather(skills):
    import asyncio
    return await asyncio.gather(
        search_github_candidates(skills, 25),
        search_hn_candidates(skills, 15),
    )
