from __future__ import annotations

from datetime import datetime
from typing import Any, Dict, List, Optional

from pydantic import BaseModel, Field


# ── Resource ──────────────────────────────────────────────────────────────────

class ResourceOut(BaseModel):
    id: str
    deliverable_id: str
    title: str
    url: str
    source_domain: str
    snippet: str
    relevance_score: float
    kind: str
    source_type: str

    model_config = {"from_attributes": True}


# ── MicroTask ─────────────────────────────────────────────────────────────────

class MicroTaskOut(BaseModel):
    id: str
    deliverable_id: str
    trigger: str
    action: str
    est_minutes: int
    artifact_expected: str
    is_completed: bool
    completed_at: Optional[datetime]
    position: int

    model_config = {"from_attributes": True}


class MicroTaskPatch(BaseModel):
    is_completed: Optional[bool] = None


# ── Deliverable ───────────────────────────────────────────────────────────────

class DeliverableOut(BaseModel):
    id: str
    quest_id: str
    title: str
    description: str
    stage: str
    est_hours: float
    week_start: int
    week_end: int
    verification_type: str
    artifact_type: str
    is_completed: bool
    completed_at: Optional[datetime]
    evidence_url: Optional[str]
    position: int
    micro_tasks: List[MicroTaskOut] = []
    resources: List[ResourceOut] = []

    model_config = {"from_attributes": True}


class DeliverablePatch(BaseModel):
    is_completed: Optional[bool] = None
    title: Optional[str] = None
    description: Optional[str] = None
    verification_type: Optional[str] = None
    position: Optional[int] = None
    evidence_url: Optional[str] = None


class DeliverableCreate(BaseModel):
    title: str
    description: str = ""
    verification_type: str = "document"
    stage: str = "plan"
    est_hours: float = 5.0
    week_start: int = 1
    week_end: int = 2
    artifact_type: str = "document"


# ── Quest ─────────────────────────────────────────────────────────────────────

class QuestOut(BaseModel):
    id: str
    title: str
    raw_goal: str
    status: str
    capacity_hours_per_week: float
    target_weeks: int
    created_at: datetime
    updated_at: datetime
    plan_json: Optional[Dict[str, Any]]
    classic_json: Optional[Dict[str, Any]]
    thread_id: Optional[str]
    deliverables: List[DeliverableOut] = []

    model_config = {"from_attributes": True}


class QuestSummary(BaseModel):
    id: str
    title: str
    raw_goal: str
    status: str
    capacity_hours_per_week: float
    target_weeks: int
    created_at: datetime
    updated_at: datetime
    deliverables: List[DeliverableOut] = []

    model_config = {"from_attributes": True}


class QuestCreate(BaseModel):
    title: str
    raw_goal: str
    capacity_hours_per_week: float = 10.0
    target_weeks: int = 12
    plan_json: Optional[Dict[str, Any]] = None
    classic_json: Optional[Dict[str, Any]] = None
    ics_content: Optional[str] = None
    thread_id: Optional[str] = None
    deliverables: List[DeliverableCreate] = []


class QuestUpdate(BaseModel):
    title: Optional[str] = None
    status: Optional[str] = None
    capacity_hours_per_week: Optional[float] = None
    target_weeks: Optional[int] = None


# ── Agent API ─────────────────────────────────────────────────────────────────

class DecomposeRequest(BaseModel):
    goal: str
    capacity_hours_per_week: float = Field(default=10.0, ge=1.0, le=60.0)
    target_weeks: int = Field(default=12, ge=4, le=24)
    timezone: str = "America/New_York"


class ResumeRequest(BaseModel):
    thread_id: str
    answer: str


class ResourcesRequest(BaseModel):
    deliverable_title: str
    deliverable_description: str
    quest_id: Optional[str] = None


class AgentResponse(BaseModel):
    plan: Optional[Dict[str, Any]]
    classic: Optional[Dict[str, Any]]
    clarification_needed: Optional[str]
    thread_id: Optional[str]
    uncertainty_log: List[str] = []
    error: Optional[str]


class ResourcesResponse(BaseModel):
    resources: List[Dict[str, Any]]
