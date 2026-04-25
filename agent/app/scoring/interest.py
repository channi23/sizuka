import json
from groq import AsyncGroq
from app.config import settings

_client = AsyncGroq(api_key=settings.groq_api_key)

# Interest score formula weights
W_SENTIMENT = 0.30
W_EXPLICIT_INTEREST = 0.50
# availability_bonus and question_depth_bonus are additive (each 0..0.2 per Groq output)

# Fallback scores when no reply received
SCORE_EMAIL_OPENED = 0.3
SCORE_EMAIL_NOT_OPENED = 0.1

# Groq config
INTEREST_TEMPERATURE = 0.1
REPLY_TEXT_MAX_CHARS = 1000

SYSTEM_PROMPT = """Analyze this reply to a job outreach email and score the candidate's interest.
Return JSON:
{
  "sentiment_score": 0.0-1.0,
  "explicit_interest_score": 0.0-1.0,
  "availability_bonus": 0.0-0.2,
  "question_depth_bonus": 0.0-0.2,
  "explanation": "one sentence"
}"""


async def score_reply(reply_text: str) -> tuple[float, str]:
    """Score candidate interest from their reply using Groq LLM.

    Returns (interest_score in [0,1], one-sentence explanation).
    """
    response = await _client.chat.completions.create(
        model="llama-3.3-70b-versatile",
        messages=[
            {"role": "system", "content": SYSTEM_PROMPT},
            {"role": "user", "content": reply_text[:REPLY_TEXT_MAX_CHARS]},
        ],
        response_format={"type": "json_object"},
        temperature=INTEREST_TEMPERATURE,
    )
    data = json.loads(response.choices[0].message.content)
    score = min(1.0, max(0.0,
        W_SENTIMENT * data.get("sentiment_score", 0)
        + W_EXPLICIT_INTEREST * data.get("explicit_interest_score", 0)
        + data.get("availability_bonus", 0)
        + data.get("question_depth_bonus", 0)
    ))
    return score, data.get("explanation", "")


def score_no_reply(email_status: str) -> tuple[float, str]:
    """Deterministic fallback interest score when the candidate has not replied."""
    if email_status == "opened":
        return SCORE_EMAIL_OPENED, "Opened email but no reply"
    return SCORE_EMAIL_NOT_OPENED, "Email not opened"
