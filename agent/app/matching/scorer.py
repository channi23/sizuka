import re
import numpy as np

# Match score formula weights (must sum to 1.0)
W_SEMANTIC = 0.45
W_SKILLS = 0.40
W_EXPERIENCE = 0.15

# Experience scoring fallbacks
EXP_NO_MENTION = 0.3   # bio has no year mentions
EXP_UNKNOWN = 0.5      # bio absent or min_years unspecified
EXP_UNDER_RATIO = 0.8  # scale factor when candidate has fewer years than required


def cosine_similarity(a: np.ndarray, b: np.ndarray) -> float:
    """Dot product similarity between two normalized embedding vectors."""
    if a.ndim == 1:
        a = a.reshape(1, -1)
    if b.ndim == 1:
        b = b.reshape(1, -1)
    return float(np.dot(a, b.T)[0][0])


def skills_overlap_ratio(candidate_skills: list[str], required_skills: list[str]) -> float:
    """Fraction of required skills present in candidate's skill set (case-insensitive)."""
    if not required_skills:
        return 0.0
    candidate_lower = {s.lower() for s in candidate_skills}
    matched = sum(1 for s in required_skills if s.lower() in candidate_lower)
    return matched / len(required_skills)


def experience_fit_score(bio: str, min_years: int) -> float:
    """Estimate experience fit by extracting year mentions from bio text.

    Returns a score in [0, 1]. Falls back gracefully when bio is empty
    or no year mentions are found.
    """
    if not bio or min_years == 0:
        return EXP_UNKNOWN
    numbers = re.findall(r"\b(\d+)\s*(?:\+\s*)?years?\b", bio.lower())
    if not numbers:
        return EXP_NO_MENTION
    max_years = max(int(n) for n in numbers)
    if max_years >= min_years:
        return min(1.0, max_years / (min_years + 2))
    return max_years / min_years * EXP_UNDER_RATIO


def compute_match_score(semantic: float, skills_overlap: float, experience: float) -> float:
    """Weighted combination of the three match signals, clipped to [0, 1]."""
    return min(1.0, W_SEMANTIC * semantic + W_SKILLS * skills_overlap + W_EXPERIENCE * experience)


def get_matched_missing(
    candidate_skills: list[str],
    required: list[str],
    nice_to_have: list[str],
) -> tuple[list[str], list[str]]:
    """Partition required and nice-to-have skills into matched vs missing lists."""
    candidate_lower = {s.lower() for s in candidate_skills}
    matched = [s for s in required if s.lower() in candidate_lower]
    matched += [s for s in nice_to_have if s.lower() in candidate_lower]
    missing = [s for s in required if s.lower() not in candidate_lower]
    return matched, missing
