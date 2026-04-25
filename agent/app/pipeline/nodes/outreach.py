from sqlalchemy import select, update
from app.db.session import AsyncSessionLocal
from app.db.models import Candidate
from app.outreach.email_gen import generate_outreach_email
from app.outreach.sender import send_email
from app.services.event_poster import post_event
from app.pipeline.state import PipelineState
from app.config import settings


async def outreach_node(state: PipelineState) -> dict:
    """Send personalised outreach emails to the top-N matched candidates.

    In demo mode all emails are routed to settings.demo_recipient because
    Resend's free tier only delivers to the account owner's address.
    The subject is prefixed with [Demo → CandidateName] so the Gmail IMAP
    listener can correlate replies back to the correct candidate.
    """
    job_id = state["job_id"]
    jd_parsed = state.get("jd_parsed") or {}
    if state.get("error"):
        return {}

    role_title = jd_parsed.get("role_title", "Software Engineer")
    company_name = state.get("company_name", "Our Company")

    try:
        async with AsyncSessionLocal() as session:
            result = await session.execute(
                select(Candidate)
                .where(Candidate.job_id == job_id)
                .order_by(Candidate.match_score.desc())
                .limit(settings.outreach_top_n)
            )
            top_candidates = result.scalars().all()

        sent_count = 0
        for candidate in top_candidates:
            subject, body = await generate_outreach_email(
                candidate_name=candidate.name or "there",
                candidate_bio=candidate.bio or "",
                skills_matched=candidate.skills_matched or [],
                role_title=role_title,
                company_name=company_name,
            )
            demo_subject = f"[Demo → {candidate.name}] {subject}"
            email_id = await send_email(settings.demo_recipient, demo_subject, body)

            async with AsyncSessionLocal() as session:
                await session.execute(
                    update(Candidate).where(Candidate.id == candidate.id).values(
                        outreach_subject=subject,
                        outreach_body=body,
                        resend_email_id=email_id,
                        email_status="sent" if email_id else "failed",
                    )
                )
                await session.commit()

            if email_id:
                sent_count += 1

        top_ids = [c.id for c in top_candidates]
        await post_event(job_id, "outreach", f"Outreach sent to {sent_count} candidates", {"sent": sent_count})
        return {"top_candidate_ids": top_ids}
    except Exception as e:
        await post_event(job_id, "failed", f"Outreach failed: {str(e)}")
        return {"error": str(e)}
