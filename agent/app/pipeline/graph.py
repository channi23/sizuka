from langgraph.graph import StateGraph, END
from app.pipeline.state import PipelineState
from app.pipeline.nodes.parse_jd import parse_jd_node
from app.pipeline.nodes.discover import discover_node
from app.pipeline.nodes.match import match_node
from app.pipeline.nodes.outreach import outreach_node
from app.pipeline.nodes.score_interest import score_interest_node
from app.pipeline.nodes.finalize import finalize_node


def build_pipeline():
    graph = StateGraph(PipelineState)

    graph.add_node("parse_jd", parse_jd_node)
    graph.add_node("discover", discover_node)
    graph.add_node("match", match_node)
    graph.add_node("outreach", outreach_node)
    graph.add_node("score_interest", score_interest_node)
    graph.add_node("finalize", finalize_node)

    graph.set_entry_point("parse_jd")
    graph.add_edge("parse_jd", "discover")
    graph.add_edge("discover", "match")
    graph.add_edge("match", "outreach")
    graph.add_edge("outreach", "score_interest")
    graph.add_edge("score_interest", "finalize")
    graph.add_edge("finalize", END)

    return graph.compile()


pipeline = build_pipeline()
