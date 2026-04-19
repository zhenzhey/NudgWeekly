from __future__ import annotations

import logging

from fastapi import APIRouter, HTTPException

from agent.runner import run_decomposer, resume_decomposer  # type: ignore
from agent.tools import resource_candidates_for  # type: ignore
from agent.schemas import Deliverable as AgentDeliverable, VerificationType  # type: ignore
from schemas import (  # type: ignore
    AgentResponse,
    DecomposeRequest,
    ResumeRequest,
    ResourcesRequest,
    ResourcesResponse,
)

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/api/agent", tags=["agent"])


@router.post("/decompose", response_model=AgentResponse)
async def decompose(body: DecomposeRequest):
    try:
        result = run_decomposer(
            goal=body.goal,
            capacity_hours_per_week=body.capacity_hours_per_week,
            target_weeks=body.target_weeks,
            timezone=body.timezone,
        )
        plan = result.get("plan")
        classic = result.get("classic")
        return AgentResponse(
            plan=plan.model_dump() if plan else None,
            classic=classic.model_dump() if classic else None,
            clarification_needed=result.get("clarification_needed"),
            thread_id=result.get("thread_id"),
            uncertainty_log=result.get("uncertainty_log", []),
            error=result.get("error"),
        )
    except Exception as exc:
        logger.exception("decompose failed")
        raise HTTPException(status_code=500, detail=str(exc))


@router.post("/resume", response_model=AgentResponse)
async def resume(body: ResumeRequest):
    try:
        result = resume_decomposer(thread_id=body.thread_id, answer=body.answer)
        plan = result.get("plan")
        classic = result.get("classic")
        return AgentResponse(
            plan=plan.model_dump() if plan else None,
            classic=classic.model_dump() if classic else None,
            clarification_needed=result.get("clarification_needed"),
            thread_id=result.get("thread_id"),
            uncertainty_log=result.get("uncertainty_log", []),
            error=result.get("error"),
        )
    except ValueError as exc:
        raise HTTPException(status_code=404, detail=str(exc))
    except Exception as exc:
        logger.exception("resume failed")
        raise HTTPException(status_code=500, detail=str(exc))


@router.post("/resources", response_model=ResourcesResponse)
async def find_resources(body: ResourcesRequest):
    try:
        fake_del = AgentDeliverable(
            id="temp-1-resource-search",
            title=body.deliverable_title[:80],
            description=(body.deliverable_description or "Resource search")[:500],
            stage="build",
            est_hours=5.0,
            week_start=1,
            week_end=2,
            verification_type=VerificationType.DOCUMENT,
            acceptance_criteria=[
                {"statement": "The artifact exists and is reachable by a reviewer without private context.", "evidence_type": "document link"},
                {"statement": "The artifact explicitly addresses the deliverable title.", "evidence_type": "document link"},
                {"statement": "The artifact includes enough detail for a third party to approve or reject completion.", "evidence_type": "document link"},
            ],
            artifact_type="document",
            micro_tasks=[
                {
                    "id": "task-1-define-checklist",
                    "deliverable_id": "temp-1-resource-search",
                    "trigger": "Monday morning at my desk",
                    "action": f"Define the evidence checklist for {body.deliverable_title[:60]}",
                    "est_minutes": 45,
                    "artifact_expected": f"Checklist for {body.deliverable_title[:60]}",
                    "depends_on": [],
                },
                {
                    "id": "task-2-create-draft",
                    "deliverable_id": "temp-1-resource-search",
                    "trigger": "Wednesday evening after work",
                    "action": f"Create the first concrete draft of {body.deliverable_title[:60]}",
                    "est_minutes": 90,
                    "artifact_expected": "Draft document",
                    "depends_on": ["task-1-define-checklist"],
                },
                {
                    "id": "task-3-review-artifact",
                    "deliverable_id": "temp-1-resource-search",
                    "trigger": "Friday afternoon in a focused block",
                    "action": f"Review {body.deliverable_title[:60]} against acceptance criteria",
                    "est_minutes": 75,
                    "artifact_expected": "Reviewed document",
                    "depends_on": ["task-2-create-draft"],
                },
            ],
            resources=[],
            depends_on=[],
        )
        resources = resource_candidates_for(fake_del, body.deliverable_title)
        return ResourcesResponse(resources=[r.model_dump() for r in resources])
    except Exception as exc:
        logger.exception("find_resources failed")
        raise HTTPException(status_code=500, detail=str(exc))
