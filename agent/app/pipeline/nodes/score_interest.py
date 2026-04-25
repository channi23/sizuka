from sqlalchemy import select, update
from app.db.session import AsyncSessionLocal
from app.db.models import Candidate
from app.scoring.interest import score_reply, score_no_reply
from app.services.event_poster import post_event
from app.pipeline.state import PipelineState


async def score_interest_node(state: PipelineState) -> dict:
    job_id = state["job_id"]
    if state.get("error"):
        return {}

    try:
        async with AsyncSessionLocal() as session:
            result = await session.execute(
                select(Candidate).where(
                    Candidate.job_id == job_id,
                    Candidate.match_score.isnot(None),
                )
            )
            candidates = result.scalars().all()

        async with AsyncSessionLocal() as session:
            for candidate in candidates:
                if candidate.reply_text:
                    score, explanation = await score_reply(candidate.reply_text)
                else:
                    score, explanation = score_no_reply(candidate.email_status or "pending")

                await session.execute(
                    update(Candidate).where(Candidate.id == candidate.id).values(
                        interest_score=score,
                        interest_explanation=explanation,
                    )
                )
            await session.commit()

        await post_event(job_id, "scoring", "Interest scoring complete", {"count": len(candidates)})
        return {}
    except Exception as e:
        await post_event(job_id, "failed", f"Interest scoring failed: {str(e)}")
        return {"error": str(e)}
