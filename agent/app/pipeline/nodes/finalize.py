from sqlalchemy import select, update
from app.db.session import AsyncSessionLocal
from app.db.models import Candidate, Job
from app.services.event_poster import post_event
from app.pipeline.state import PipelineState

# Final score formula weights (must sum to 1.0; mirrors frontend default sliders)
W_MATCH = 0.6
W_INTEREST = 0.4

# Default interest score for candidates with no signal at all
DEFAULT_INTEREST_SCORE = 0.1


async def finalize_node(state: PipelineState) -> dict:
    """Compute final_score for every candidate and mark the job complete.

    final_score = W_MATCH × match_score + W_INTEREST × interest_score
    Candidates without an interest score (no reply, no open) fall back
    to DEFAULT_INTEREST_SCORE.
    """
    job_id = state["job_id"]
    if state.get("error"):
        await post_event(job_id, "failed", state["error"])
        return {}

    try:
        async with AsyncSessionLocal() as session:
            result = await session.execute(
                select(Candidate).where(Candidate.job_id == job_id)
            )
            candidates = result.scalars().all()

            for candidate in candidates:
                match_score = candidate.match_score or 0.0
                interest_score = candidate.interest_score or DEFAULT_INTEREST_SCORE
                final_score = W_MATCH * match_score + W_INTEREST * interest_score
                await session.execute(
                    update(Candidate).where(Candidate.id == candidate.id).values(final_score=final_score)
                )

            await session.execute(
                update(Job).where(Job.id == job_id).values(status="complete")
            )
            await session.commit()

        await post_event(job_id, "complete", "Shortlist ready", {"total": len(candidates)})
        return {}
    except Exception as e:
        await post_event(job_id, "failed", f"Finalization failed: {str(e)}")
        return {"error": str(e)}
