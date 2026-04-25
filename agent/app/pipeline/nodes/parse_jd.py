import json
from groq import AsyncGroq
from sqlalchemy import update
from app.config import settings
from app.db.session import AsyncSessionLocal
from app.db.models import Job
from app.services.event_poster import post_event
from app.pipeline.state import PipelineState

_client = AsyncGroq(api_key=settings.groq_api_key)

SYSTEM_PROMPT = """Extract structured data from this job description. Return JSON with:
{
  "role_title": "string",
  "domain": "string (e.g. backend, frontend, ml, devops)",
  "required_skills": ["skill1", "skill2"],
  "nice_to_have_skills": ["skill1"],
  "min_experience_years": number,
  "responsibilities": ["responsibility1"],
  "keywords": ["keyword1"]
}"""


async def parse_jd_node(state: PipelineState) -> dict:
    job_id = state["job_id"]
    try:
        response = await _client.chat.completions.create(
            model="llama-3.3-70b-versatile",
            messages=[
                {"role": "system", "content": SYSTEM_PROMPT},
                {"role": "user", "content": state["jd_raw"]},
            ],
            response_format={"type": "json_object"},
            temperature=0.1,
        )
        jd_parsed = json.loads(response.choices[0].message.content)

        async with AsyncSessionLocal() as session:
            await session.execute(
                update(Job).where(Job.id == job_id).values(jd_parsed=jd_parsed, status="discovering")
            )
            await session.commit()

        await post_event(job_id, "parsing", "JD parsed successfully", {"role": jd_parsed.get("role_title")})
        return {"jd_parsed": jd_parsed}
    except Exception as e:
        await post_event(job_id, "failed", f"JD parsing failed: {str(e)}")
        return {"error": str(e), "jd_parsed": {}}
