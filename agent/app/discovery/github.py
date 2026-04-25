import httpx
from app.config import settings

GITHUB_API = "https://api.github.com"


def _headers() -> dict:
    h = {"Accept": "application/vnd.github+json", "X-GitHub-Api-Version": "2022-11-28"}
    if settings.github_token:
        h["Authorization"] = f"Bearer {settings.github_token}"
    return h


async def search_github_candidates(skills: list[str], max_results: int = 30) -> list[dict]:
    candidates = []
    seen = set()

    async with httpx.AsyncClient(timeout=30) as client:
        # Search by each top skill separately to get more results
        for skill in skills[:4]:
            if len(candidates) >= max_results:
                break
            query = f"{skill} in:bio language:{_infer_language(skills)}"
            resp = await client.get(
                f"{GITHUB_API}/search/users",
                params={"q": query, "per_page": 15, "sort": "followers"},
                headers=_headers(),
            )
            if resp.status_code == 403:
                break
            if resp.status_code != 200:
                continue

            for user in resp.json().get("items", []):
                login = user["login"]
                if login in seen:
                    continue
                seen.add(login)
                profile = await _fetch_profile(client, login)
                if profile:
                    candidates.append(profile)
                if len(candidates) >= max_results:
                    break

    return candidates


async def _fetch_profile(client: httpx.AsyncClient, login: str) -> dict | None:
    resp = await client.get(f"{GITHUB_API}/users/{login}", headers=_headers())
    if resp.status_code != 200:
        return None
    data = resp.json()
    # Fetch top repos to extract languages as skills
    repos_resp = await client.get(
        f"{GITHUB_API}/users/{login}/repos",
        params={"sort": "stars", "per_page": 5},
        headers=_headers(),
    )
    languages = []
    if repos_resp.status_code == 200:
        repos = repos_resp.json()
        languages = list({r["language"] for r in repos if r.get("language")})

    bio = data.get("bio") or ""
    return {
        "name": data.get("name") or login,
        "email": data.get("email"),
        "source": "github",
        "profile_url": data.get("html_url"),
        "bio": f"{bio} | repos: {data.get('public_repos', 0)} | followers: {data.get('followers', 0)}",
        "skills_raw": languages,
    }


def _infer_language(skills: list[str]) -> str:
    lang_map = {
        "python": "Python", "javascript": "JavaScript", "typescript": "TypeScript",
        "go": "Go", "rust": "Rust", "java": "Java", "ruby": "Ruby",
        "kotlin": "Kotlin", "swift": "Swift", "c++": "C++", "c#": "C#",
    }
    for s in skills:
        if s.lower() in lang_map:
            return lang_map[s.lower()]
    return "Python"
