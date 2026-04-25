from sqlalchemy import select, update
from app.db.session import AsyncSessionLocal
from app.db.models import Candidate
from app.matching.embedder import embed
from app.matching.scorer import (
    cosine_similarity,
    skills_overlap_ratio,
    experience_fit_score,
    compute_match_score,
    get_matched_missing,
)
from app.services.event_poster import post_event
from app.pipeline.state import PipelineState


async def match_node(state: PipelineState) -> dict:
    job_id = state["job_id"]
    jd_parsed = state.get("jd_parsed") or {}
    if state.get("error"):
        return {}

    required_skills = jd_parsed.get("required_skills", [])
    nice_to_have = jd_parsed.get("nice_to_have_skills", [])
    min_years = jd_parsed.get("min_experience_years", 0)

    jd_text = _build_jd_text(jd_parsed)

    try:
        async with AsyncSessionLocal() as session:
            result = await session.execute(select(Candidate).where(Candidate.job_id == job_id))
            candidates = result.scalars().all()

        if not candidates:
            await post_event(job_id, "matching", "No candidates to score")
            return {}

        candidate_texts = [_build_candidate_text(c) for c in candidates]
        all_texts = [jd_text] + candidate_texts
        embeddings = await embed(all_texts)
        jd_emb = embeddings[0]

        async with AsyncSessionLocal() as session:
            for i, candidate in enumerate(candidates):
                c_emb = embeddings[i + 1]
                semantic = cosine_similarity(jd_emb, c_emb)
                c_skills = candidate.skills_raw or []
                overlap = skills_overlap_ratio(c_skills, required_skills)
                exp = experience_fit_score(candidate.bio or "", min_years)
                score = compute_match_score(semantic, overlap, exp)
                matched, missing = get_matched_missing(c_skills, required_skills, nice_to_have)

                explanation = (
                    f"Semantic similarity: {semantic:.2f}. "
                    f"Skills overlap: {overlap:.2f} ({len(matched)}/{len(required_skills)} required). "
                    f"Experience fit: {exp:.2f}."
                )
                await session.execute(
                    update(Candidate).where(Candidate.id == candidate.id).values(
                        match_score=score,
                        match_explanation=explanation,
                        skills_matched=matched,
                        skills_missing=missing,
                    )
                )
            await session.commit()

        await post_event(job_id, "matching", "Candidates scored and ranked", {"count": len(candidates)})
        return {}
    except Exception as e:
        await post_event(job_id, "failed", f"Matching failed: {str(e)}")
        return {"error": str(e)}


def _build_jd_text(jd_parsed: dict) -> str:
    parts = [
        jd_parsed.get("role_title", ""),
        " ".join(jd_parsed.get("required_skills", [])),
        " ".join(jd_parsed.get("responsibilities", [])),
        jd_parsed.get("domain", ""),
    ]
    return " ".join(filter(None, parts))


def _build_candidate_text(candidate) -> str:
    skills = " ".join(candidate.skills_raw or [])
    return f"{candidate.name or ''} {candidate.bio or ''} {skills}".strip()
