import logging
import httpx
from app.config import settings

log = logging.getLogger(__name__)

TIMEOUT_SECONDS = 10


async def post_event(job_id: str, stage: str, message: str, metadata: dict | None = None):
    """POST a pipeline stage event to the NestJS internal endpoint.

    NestJS persists the event and pushes it to the SSE stream for the frontend.
    Failures are logged but never raised — pipeline continues regardless.
    """
    payload = {"job_id": job_id, "stage": stage, "message": message, "metadata": metadata or {}}
    headers = {"x-internal-secret": settings.internal_api_secret}
    async with httpx.AsyncClient(timeout=TIMEOUT_SECONDS) as client:
        try:
            await client.post(
                f"{settings.nestjs_internal_url}/internal/pipeline-event",
                json=payload,
                headers=headers,
            )
        except Exception as e:
            log.warning("Failed to post pipeline event (stage=%s job=%s): %s", stage, job_id, e)
