"""
Polls Gmail inbox via IMAP for replies to outreach emails.
Matches [Demo → CandidateName] subject prefix → triggers conversational agent.
Runs as a background asyncio task.
"""
import asyncio
import email
import imaplib
import re
import logging
from datetime import datetime, timedelta

import httpx
from sqlalchemy import select

from app.config import settings
from app.db.session import AsyncSessionLocal
from app.db.models import Candidate

log = logging.getLogger("mail_listener")
POLL_INTERVAL = 30  # seconds
DEMO_SUBJECT_RE = re.compile(r"\[Demo\s*[→>]\s*(.+?)\]", re.IGNORECASE)
_seen_uids: set[bytes] = set()


def _fetch_unseen_replies(since_date: str) -> list[dict]:
    """Blocking IMAP fetch — runs in thread."""
    msgs = []
    try:
        mail = imaplib.IMAP4_SSL("imap.gmail.com")
        mail.login(settings.gmail_user, settings.gmail_app_password)
        mail.select("inbox")
        _, data = mail.search(None, f'(SINCE "{since_date}" SUBJECT "Demo")')
        ids = data[0].split()
        log.info(f"IMAP search returned {len(ids)} message(s)")
        for uid in ids:
            if uid in _seen_uids:
                continue
            _seen_uids.add(uid)
            _, raw = mail.fetch(uid, "(RFC822)")
            msg = email.message_from_bytes(raw[0][1])
            raw_subject = msg.get("Subject", "")
            subject = str(email.header.make_header(email.header.decode_header(raw_subject)))
            body = ""
            if msg.is_multipart():
                for part in msg.walk():
                    if part.get_content_type() == "text/plain":
                        body = part.get_payload(decode=True).decode(errors="ignore")
                        break
            else:
                body = msg.get_payload(decode=True).decode(errors="ignore")
            # Strip quoted original message
            body = body.split("\nOn ")[0].split("\r\nOn ")[0].strip()
            log.info(f"Found email subject: {subject!r}")
            msgs.append({"subject": subject, "body": body, "uid": uid})
        mail.logout()
    except Exception as e:
        log.warning(f"IMAP fetch failed: {e}")
    return msgs


async def _find_candidate_by_name(name: str) -> str | None:
    name_clean = name.strip()
    async with AsyncSessionLocal() as session:
        # Try exact name match first
        result = await session.execute(
            select(Candidate).where(Candidate.name == name_clean).limit(1)
        )
        candidate = result.scalar_one_or_none()
        if candidate:
            return str(candidate.id)
        # Try partial match (first name)
        first = name_clean.split()[0]
        result = await session.execute(
            select(Candidate).where(Candidate.name.ilike(f"{first}%")).limit(1)
        )
        candidate = result.scalar_one_or_none()
        return str(candidate.id) if candidate else None


async def _trigger_reply(candidate_id: str, reply_text: str):
    nestjs_url = settings.nestjs_internal_url
    try:
        async with httpx.AsyncClient(timeout=10) as client:
            await client.post(
                f"{nestjs_url}/webhook/demo-reply",
                json={"candidate_id": candidate_id, "reply_text": reply_text},
            )
            log.info(f"Triggered conversation for candidate {candidate_id}")
    except Exception as e:
        log.error(f"Failed to trigger reply: {e}")


async def poll_loop():
    if not settings.gmail_user or not settings.gmail_app_password:
        log.info("Gmail credentials not set — mail listener disabled")
        return

    log.info(f"Mail listener started — polling {settings.gmail_user} every {POLL_INTERVAL}s")
    # Only look at emails from the last 24 hours
    since = (datetime.now() - timedelta(hours=24)).strftime("%d-%b-%Y")

    while True:
        try:
            msgs = await asyncio.to_thread(_fetch_unseen_replies, since)
            for msg in msgs:
                match = DEMO_SUBJECT_RE.search(msg["subject"])
                if not match:
                    log.info(f"Subject did not match Demo regex: {msg['subject']!r}")
                    continue
                candidate_name = match.group(1).strip()
                log.info(f"Reply detected for candidate: {candidate_name}")
                candidate_id = await _find_candidate_by_name(candidate_name)
                if candidate_id:
                    await _trigger_reply(candidate_id, msg["body"])
                else:
                    log.warning(f"No candidate found for name: {candidate_name}")
        except Exception as e:
            log.error(f"Poll loop error: {e}")

        await asyncio.sleep(POLL_INTERVAL)
