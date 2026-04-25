import asyncio
import logging
import resend
from app.config import settings

resend.api_key = settings.resend_api_key
log = logging.getLogger(__name__)


async def send_email(to: str, subject: str, body: str) -> str | None:
    """Send a plain-text email via Resend and return the email ID, or None on failure.

    reply_to is set to gmail_user so candidate replies route through Gmail
    for IMAP pickup by the mail listener.
    """
    reply_to = [settings.gmail_user] if settings.gmail_user else []
    try:
        result = await asyncio.to_thread(
            resend.Emails.send,
            {
                "from": settings.sender_email,
                "to": [to],
                "subject": subject,
                "text": body,
                "reply_to": reply_to,
            },
        )
        return result.id if hasattr(result, "id") else result.get("id")
    except Exception as e:
        log.error("Resend failed (to=%s subject=%r): %s", to, subject, e)
        return None
