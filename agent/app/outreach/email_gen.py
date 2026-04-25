import json
from groq import AsyncGroq
from app.config import settings

_client = AsyncGroq(api_key=settings.groq_api_key)

SYSTEM_PROMPT = """You are a recruiter writing a personalized outreach email to a software engineer.
Write a concise, genuine email (3-4 short paragraphs). Mention specific skills from their profile.
Do not sound like a template. Return JSON: {"subject": "...", "body": "..."}"""


async def generate_outreach_email(
    candidate_name: str,
    candidate_bio: str,
    skills_matched: list[str],
    role_title: str,
    company_name: str,
) -> tuple[str, str]:
    user_msg = (
        f"Candidate: {candidate_name}\n"
        f"Bio: {candidate_bio[:300]}\n"
        f"Matched skills: {', '.join(skills_matched)}\n"
        f"Role: {role_title} at {company_name}"
    )
    response = await _client.chat.completions.create(
        model="llama-3.3-70b-versatile",
        messages=[
            {"role": "system", "content": SYSTEM_PROMPT},
            {"role": "user", "content": user_msg},
        ],
        response_format={"type": "json_object"},
        temperature=0.7,
    )
    data = json.loads(response.choices[0].message.content)
    return data.get("subject", f"Exciting {role_title} opportunity"), data.get("body", "")
