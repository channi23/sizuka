import asyncio
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from sqlalchemy import update, select
from app.db.session import AsyncSessionLocal
from app.db.models import Candidate, Job
from app.conversation.responder import generate_reply, build_turn, MAX_TURNS
from app.outreach.sender import send_email
from app.scoring.interest import score_reply
from app.config import settings

router = APIRouter()


class RespondRequest(BaseModel):
    candidate_id: str
    reply_text: str
    reply_subject: str = ""


@router.post("/conversation/respond", status_code=202)
async def respond(req: RespondRequest):
    """Accept a candidate reply and schedule the AI response as a background task."""
    async with AsyncSessionLocal() as session:
        candidate = await session.get(Candidate, req.candidate_id)
        if not candidate:
            raise HTTPException(status_code=404, detail="Candidate not found")
        job = await session.get(Job, candidate.job_id)

    asyncio.create_task(_handle_reply(req.candidate_id, req.reply_text, job))
    return {"status": "accepted"}


async def _handle_reply(candidate_id: str, reply_text: str, job: Job):
    """Process a candidate reply: score interest, generate AI response, update DB.

    Conversation history is stored as a list of {role, content, timestamp} dicts.
    Replies stop after MAX_TURNS recruiter messages to prevent runaway threads.
    All outgoing emails are routed to settings.demo_recipient (Resend free-tier limit).
    """
    async with AsyncSessionLocal() as session:
        candidate = await session.get(Candidate, candidate_id)
        if not candidate:
            return

        history: list[dict] = candidate.conversation_history or []
        turns: int = candidate.conversation_turns or 0

        # Seed history with the original outreach on the first reply
        if not history and candidate.outreach_body:
            history.append(build_turn("recruiter", candidate.outreach_body))

        history.append(build_turn("candidate", reply_text))
        interest_score, interest_explanation = await score_reply(reply_text)

        if turns >= MAX_TURNS:
            # Conversation cap reached — update scores only, no further reply
            await session.execute(
                update(Candidate).where(Candidate.id == candidate_id).values(
                    reply_text=reply_text,
                    email_status="replied",
                    interest_score=interest_score,
                    interest_explanation=interest_explanation,
                    conversation_history=history,
                    conversation_turns=turns + 1,
                )
            )
            await session.commit()
            return

        role_title = (job.jd_parsed or {}).get("role_title", "Engineer") if job else "Engineer"
        company_name = job.company_name if job else "Our Company"

        subject, body = await generate_reply(
            candidate_name=candidate.name or "there",
            company_name=company_name,
            role_title=role_title,
            conversation_history=history,
            latest_reply=reply_text,
        )

        await send_email(settings.demo_recipient, subject, body)
        history.append(build_turn("recruiter", body))

        await session.execute(
            update(Candidate).where(Candidate.id == candidate_id).values(
                reply_text=reply_text,
                email_status="replied",
                interest_score=interest_score,
                interest_explanation=interest_explanation,
                conversation_history=history,
                conversation_turns=turns + 1,
            )
        )
        await session.commit()
