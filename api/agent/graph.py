# Cell 9: LangGraph construction + compile
from __future__ import annotations

import os

from langgraph.checkpoint.memory import InMemorySaver
from langgraph.graph import END, START, StateGraph

from agent.schemas import DecomposerState  # type: ignore
from agent.nodes import (  # type: ignore
    intake_clarify_node,
    multi_path_plan_node,
    path_select_node,
    decompose_deliverables_node,
    generate_microtasks_node,
    scout_resources_node,
    architect_schedule_node,
    design_verification_node,
    critic_node,
    refine_node,
    judge_node,
    synthesize_calendar_node,
    classic_evaluate_node,
)

JUDGE_PASS_THRESHOLD = float(os.environ.get("NUDG_JUDGE_PASS_THRESHOLD", "0.80"))
MAX_JUDGE_RETRIES = int(os.environ.get("NUDG_MAX_JUDGE_RETRIES", "2"))


def route_after_intake(state: DecomposerState) -> str:
    if state.get("error"):
        return "classic_eval"
    if state.get("clarification_needed"):
        return "classic_eval"
    return "multi_path_plan"


def route_after_judge(state: DecomposerState) -> str:
    confidence = state.get("judge_confidence")
    if confidence and confidence.aggregate >= JUDGE_PASS_THRESHOLD:
        return "synthesize_ics"
    if int(state.get("iteration_count", 0)) >= MAX_JUDGE_RETRIES:
        state.setdefault("uncertainty_log", []).append(
            "Judge threshold not met after max retries; returning best available plan."
        )
        return "synthesize_ics"
    return "critic"


def build_graph():
    builder = StateGraph(DecomposerState)
    builder.add_node("intake_clarify", intake_clarify_node)
    builder.add_node("multi_path_plan", multi_path_plan_node)
    builder.add_node("path_select", path_select_node)
    builder.add_node("decompose", decompose_deliverables_node)
    builder.add_node("microtasks", generate_microtasks_node)
    builder.add_node("scout", scout_resources_node)
    builder.add_node("schedule", architect_schedule_node)
    builder.add_node("verify_criteria", design_verification_node)
    builder.add_node("critic", critic_node)
    builder.add_node("refine", refine_node)
    builder.add_node("judge", judge_node)
    builder.add_node("synthesize_ics", synthesize_calendar_node)
    builder.add_node("classic_eval", classic_evaluate_node)

    builder.add_edge(START, "intake_clarify")
    builder.add_conditional_edges(
        "intake_clarify",
        route_after_intake,
        {"multi_path_plan": "multi_path_plan", "classic_eval": "classic_eval"},
    )
    builder.add_edge("multi_path_plan", "path_select")
    builder.add_edge("path_select", "decompose")
    builder.add_edge("decompose", "microtasks")
    builder.add_edge("microtasks", "scout")
    builder.add_edge("scout", "schedule")
    builder.add_edge("schedule", "verify_criteria")
    builder.add_edge("verify_criteria", "critic")
    builder.add_edge("critic", "refine")
    builder.add_edge("refine", "judge")
    builder.add_conditional_edges(
        "judge",
        route_after_judge,
        {"synthesize_ics": "synthesize_ics", "critic": "critic"},
    )
    builder.add_edge("synthesize_ics", "classic_eval")
    builder.add_edge("classic_eval", END)

    return builder.compile(checkpointer=InMemorySaver())


# Singleton compiled graph
graph = build_graph()
