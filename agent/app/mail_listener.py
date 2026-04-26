"""
Polls Gmail inbox via IMAP for replies to outreach emails.
Matches [Demo → CandidateName] subject prefix → triggers conversational agent.
Runs as a background asyncio task.

Reply detection strategy:
- On startup, all existing matching emails are pre-loaded into _seen_uids
  without being processed — only emails arriving after the listener starts
  will trigger agent replies. This prevents reprocessing old threads on restart.
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

POLL_INTERVAL = 30        # seconds between inbox checks
LOOKBACK_HOURS = 24       # how far back to search on first poll
DATE_FMT = "%d-%b-%Y"

DEMO_SUBJECT_RE = re.compile(r"\[Demo\s*[→>]\s*(.+?)\]", re.IGNORECASE)

# UIDs already processed (or pre-seeded at startup) — prevents double-triggering
_seen_uids: set[bytes] = set()


def _imap_connect() -> imaplib.IMAP4_SSL:
    mail = imaplib.IMAP4_SSL("imap.gmail.com")
    mail.login(settings.gmail_user, settings.gmail_app_password)
    mail.select("inbox")
    return mail


def _search_uids(mail: imaplib.IMAP4_SSL, since_date: str) -> list[bytes]:
    """Return all UIDs matching the Demo subject since since_date."""
    _, data = mail.search(None, f'(SINCE "{since_date}" SUBJECT "Demo")')
    return data[0].split()


def _seed_seen_uids(since_date: str) -> None:
    """Pre-populate _seen_uids with every existing matching email.

    Called once at startup so old emails are never reprocessed after a restart.
    """
    mail = None
    try:
        mail = _imap_connect()
        ids = _search_uids(mail, since_date)
        for uid in ids:
            _seen_uids.add(uid)
        log.info(f"Seeded {len(ids)} existing email(s) as already-seen — only new replies will trigger responses")
    except Exception as e:
        log.warning(f"Failed to seed seen UIDs: {e}")
    finally:
        if mail is not None:
            try:
                mail.logout()
            except Exception:
                pass


def _fetch_new_replies(since_date: str) -> list[dict]:
    """Fetch only emails not yet in _seen_uids.

    Opens a fresh connection each poll and guarantees logout via finally
    so connections never pile up against Gmail's simultaneous-connection limit.
    """
    msgs = []
    mail = None
    try:
        mail = _imap_connect()
        ids = _search_uids(mail, since_date)
        new_ids = [uid for uid in ids if uid not in _seen_uids]
        log.info(f"IMAP: {len(ids)} total, {len(new_ids)} new")

        for uid in new_ids:
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

            # Strip the quoted original message that email clients append
            body = body.split("\nOn ")[0].split("\r\nOn ")[0].strip()
            msgs.append({"subject": subject, "body": body, "uid": uid})

    except Exception as e:
        log.warning(f"IMAP fetch failed: {e}")
    finally:
        if mail is not None:
            try:
                mail.logout()
            except Exception:
                pass
    return msgs


async def _find_candidate_by_name(name: str) -> str | None:
    """Look up a candidate ID by name — exact match first, then first-name prefix."""
    name_clean = name.strip()
    async with AsyncSessionLocal() as session:
        result = await session.execute(
            select(Candidate).where(Candidate.name == name_clean).limit(1)
        )
        candidate = result.scalar_one_or_none()
        if candidate:
            return str(candidate.id)
        first = name_clean.split()[0]
        result = await session.execute(
            select(Candidate).where(Candidate.name.ilike(f"{first}%")).limit(1)
        )
        candidate = result.scalar_one_or_none()
        return str(candidate.id) if candidate else None


async def _trigger_reply(candidate_id: str, reply_text: str):
    """POST the candidate's reply to NestJS which forwards it to the agent."""
    try:
        async with httpx.AsyncClient(timeout=10) as client:
            await client.post(
                f"{settings.nestjs_internal_url}/webhook/demo-reply",
                json={"candidate_id": candidate_id, "reply_text": reply_text},
            )
            log.info(f"Triggered conversation for candidate {candidate_id}")
    except Exception as e:
        log.error(f"Failed to trigger reply: {e}")


async def poll_loop():
    if not settings.gmail_user or not settings.gmail_app_password:
        log.info("Gmail credentials not set — mail listener disabled")
        return

    since = (datetime.now() - timedelta(hours=LOOKBACK_HOURS)).strftime(DATE_FMT)

    # Mark all pre-existing emails as seen before entering the poll loop
    await asyncio.to_thread(_seed_seen_uids, since)

    log.info(f"Mail listener started — polling {settings.gmail_user} every {POLL_INTERVAL}s")

    while True:
        try:
            msgs = await asyncio.to_thread(_fetch_new_replies, since)
            for msg in msgs:
                match = DEMO_SUBJECT_RE.search(msg["subject"])
                if not match:
                    log.info(f"Subject did not match Demo regex: {msg['subject']!r}")
                    continue
                candidate_name = match.group(1).strip()
                log.info(f"New reply from candidate: {candidate_name}")
                candidate_id = await _find_candidate_by_name(candidate_name)
                if candidate_id:
                    await _trigger_reply(candidate_id, msg["body"])
                else:
                    log.warning(f"No candidate found for name: {candidate_name}")
        except Exception as e:
            log.error(f"Poll loop error: {e}")

        await asyncio.sleep(POLL_INTERVAL)
