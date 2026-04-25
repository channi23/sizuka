import httpx
import re

HN_ALGOLIA = "https://hn.algolia.com/api/v1/search"
# HN "Who is hiring?" thread IDs (recent ones — update periodically)
HN_WHO_IS_HIRING_TAG = "ask_hn"


async def search_hn_candidates(skills: list[str], max_results: int = 20) -> list[dict]:
    candidates = []
    seen_authors: set[str] = set()

    async with httpx.AsyncClient(timeout=30) as client:
        # Search 1: "who wants to be hired" threads
        for query in _build_queries(skills):
            if len(candidates) >= max_results:
                break
            resp = await client.get(
                HN_ALGOLIA,
                params={"query": query, "tags": "comment", "hitsPerPage": 30},
            )
            if resp.status_code != 200:
                continue

            for hit in resp.json().get("hits", []):
                author = hit.get("author")
                if not author or author in seen_authors:
                    continue
                seen_authors.add(author)

                text = hit.get("comment_text") or ""
                email = _extract_email(text)
                matched_skills = _extract_skills(text, skills)

                candidates.append({
                    "name": author,
                    "email": email,
                    "source": "hackernews",
                    "profile_url": f"https://news.ycombinator.com/user?id={author}",
                    "bio": text[:600] if text else "",
                    "skills_raw": matched_skills,
                })
                if len(candidates) >= max_results:
                    break

    return candidates


def _build_queries(skills: list[str]) -> list[str]:
    top = skills[:3]
    return [
        f"who wants to be hired {' '.join(top)}",
        f"seeking {' '.join(top[:2])}",
        " ".join(top),
    ]


def _extract_email(text: str) -> str | None:
    m = re.search(r"[\w.+-]+@[\w-]+\.[a-zA-Z]{2,}", text)
    return m.group(0) if m else None


def _extract_skills(text: str, target_skills: list[str]) -> list[str]:
    text_lower = text.lower()
    return [s for s in target_skills if s.lower() in text_lower]
