import json
from datetime import datetime, timezone
from groq import AsyncGroq
from app.config import settings

_client = AsyncGroq(api_key=settings.groq_api_key)

MAX_TURNS = 3

SYSTEM_PROMPT = """You are a recruiter having an email conversation with a software engineering candidate.
Your goal is to build genuine rapport, answer their questions honestly, and move towards scheduling a call or next step.

Rules:
- Keep replies concise (3-5 sentences max)
- Reference specific things they said
- If they ask about salary/benefits, say details will be discussed in the call
- If they show strong interest, suggest scheduling a 20-min intro call
- If they seem hesitant, address their concern and leave the door open
- Never be pushy or salesy
- Sign off as the recruiter from the company

Return JSON: {"subject": "Re: ...", "body": "email body text"}"""


async def generate_reply(
    candidate_name: str,
    company_name: str,
    role_title: str,
    conversation_history: list[dict],
    latest_reply: str,
) -> tuple[str, str]:
    messages = [{"role": "system", "content": SYSTEM_PROMPT}]

    context = (
        f"Candidate: {candidate_name}\n"
        f"Role: {role_title} at {company_name}\n\n"
        f"Conversation so far:\n"
    )
    for turn in conversation_history:
        role_label = "Recruiter" if turn["role"] == "recruiter" else "Candidate"
        context += f"{role_label}: {turn['content'][:400]}\n\n"

    context += f"Candidate's latest reply:\n{latest_reply[:800]}"

    messages.append({"role": "user", "content": context})

    response = await _client.chat.completions.create(
        model="llama-3.3-70b-versatile",
        messages=messages,
        response_format={"type": "json_object"},
        temperature=0.7,
    )
    data = json.loads(response.choices[0].message.content)
    return data.get("subject", f"Re: {role_title} opportunity"), data.get("body", "")


def build_turn(role: str, content: str) -> dict:
    return {"role": role, "content": content, "timestamp": datetime.now(timezone.utc).isoformat()}
