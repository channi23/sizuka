from typing import TypedDict, Optional


class PipelineState(TypedDict):
    job_id: str
    company_name: str
    jd_raw: str
    jd_parsed: Optional[dict]
    candidate_count: int
    top_candidate_ids: list[str]
    error: Optional[str]
