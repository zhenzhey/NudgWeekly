# Cell 10: run_decomposer + resume_decomposer
from __future__ import annotations

import time
import uuid
from typing import Any, Dict, Optional

from agent.graph import graph  # type: ignore
from agent.nodes import PENDING_THREADS, sanitize_goal  # type: ignore
from agent.schemas import Clarification, DecomposerState  # type: ignore
from agent.tools import classic_evaluate_state, DEFAULT_TIMEZONE  # type: ignore


def initial_state(
    goal: str,
    capacity_hours_per_week: float,
    target_weeks: int,
    timezone_name: str,
    thread_id: Optional[str],
) -> DecomposerState:
    return DecomposerState(
        raw_goal=goal,
        sanitized_goal=sanitize_goal(goal),
        spotlight_token=uuid.uuid4().hex[:10],
        user_capacity_hours_per_week=capacity_hours_per_week,
        target_weeks=target_weeks,
        timezone=timezone_name,
        thread_id=thread_id or uuid.uuid4().hex,
        candidate_paths=[],
        selected_path=None,
        critic_issues=[],
        iteration_count=0,
        node_latencies={},
        token_usage={},
        uncertainty_log=[],
        started_at=time.time(),
        security_injection_flagged=False,
        error=None,
    )


def run_decomposer(
    goal: str,
    capacity_hours_per_week: float = 10.0,
    target_weeks: int = 12,
    timezone: str = DEFAULT_TIMEZONE,
    thread_id: Optional[str] = None,
) -> Dict[str, Any]:
    if not isinstance(goal, str) or not goal.strip():
        raise ValueError("goal must be a non-empty string")
    state = initial_state(goal, capacity_hours_per_week, target_weeks, timezone, thread_id)
    config = {"configurable": {"thread_id": state["thread_id"]}}
    try:
        final_state = graph.invoke(state, config=config)
    except Exception as exc:
        final_state = dict(state)
        final_state["error"] = f"Graceful decomposer error: {exc.__class__.__name__}: {exc}"
        final_state["classic"] = classic_evaluate_state(final_state)  # type: ignore[arg-type]
    if final_state.get("clarification_needed") and not final_state.get("plan"):
        PENDING_THREADS[final_state["thread_id"]] = final_state
        return {
            "plan": None,
            "ics_path": None,
            "classic": final_state.get("classic"),
            "clarification_needed": final_state.get("clarification_needed"),
            "thread_id": final_state["thread_id"],
            "uncertainty_log": final_state.get("uncertainty_log", []),
            "error": final_state.get("error"),
        }
    return {
        "plan": final_state.get("plan"),
        "ics_path": final_state.get("ics_path"),
        "ics_text": final_state.get("ics_text"),
        "classic": final_state.get("classic"),
        "clarification_needed": None,
        "thread_id": final_state.get("thread_id"),
        "judge_confidence": final_state.get("judge_confidence"),
        "critic_issues": final_state.get("critic_issues", []),
        "uncertainty_log": final_state.get("uncertainty_log", []),
        "error": final_state.get("error"),
    }


def resume_decomposer(thread_id: str, answer: str) -> Dict[str, Any]:
    pending = PENDING_THREADS.get(thread_id)
    if not pending:
        raise ValueError(f"No pending decomposer thread found for {thread_id}")
    clarification = pending.get("clarification")
    question = clarification.question if clarification else "Clarification"
    resumed_goal = f"{pending['raw_goal']}\n\nClarification question: {question}\nClarification answer: {answer}"
    PENDING_THREADS.pop(thread_id, None)
    return run_decomposer(
        resumed_goal,
        capacity_hours_per_week=pending.get("user_capacity_hours_per_week", 10.0),
        target_weeks=pending.get("target_weeks", 12),
        timezone=pending.get("timezone", DEFAULT_TIMEZONE),
        thread_id=thread_id,
    )
