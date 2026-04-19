# Cell 4: Pydantic schemas + LangGraph state
# Assumption: models forbid unknown fields so structured outputs cannot smuggle extra instructions.
# Assumption: Resource.url is a string, not HttpUrl, to keep JSON schema provider-compatible.
from __future__ import annotations

from enum import Enum
from typing import Any, Dict, List, Literal, Optional, TypedDict

from pydantic import BaseModel, ConfigDict, Field, field_validator, model_validator


class StrictModel(BaseModel):
    model_config = ConfigDict(
        extra="forbid",
        validate_assignment=True,
        populate_by_name=True,
        use_enum_values=True,
    )


class VerificationType(str, Enum):
    DEPLOYED_URL = "deployed_url"
    CODE_REPO = "code_repo"
    DOCUMENT = "document"
    DATASET = "dataset"
    DESIGN_FILE = "design_file"
    DEMO_VIDEO = "demo_video"
    WRITTEN_REFLECTION = "written_reflection"
    REFEREE_APPROVAL = "referee_approval"


class DeliverableStage(str, Enum):
    PLAN = "plan"
    BUILD = "build"
    SHIP = "ship"
    SCALE = "scale"


class Clarification(StrictModel):
    question: Optional[str] = Field(default=None, min_length=10, max_length=240)
    answer: Optional[str] = Field(default=None, max_length=1000)


class MicroTask(StrictModel):
    id: str = Field(min_length=6, max_length=80)
    deliverable_id: str = Field(min_length=6, max_length=80)
    trigger: str = Field(min_length=8, max_length=180)
    action: str = Field(min_length=8, max_length=240)
    est_minutes: int = Field(ge=15, le=240)
    artifact_expected: str = Field(min_length=8, max_length=240)
    depends_on: List[str] = Field(default_factory=list)


class Resource(StrictModel):
    title: str = Field(min_length=3, max_length=140)
    url: str = Field(min_length=8, max_length=500)
    source_domain: str = Field(min_length=3, max_length=120)
    snippet: str = Field(min_length=10, max_length=500)
    relevance_score: float = Field(ge=0.0, le=1.0)
    verified_200: bool
    kind: Literal["playbook", "tool", "grant", "community", "reference", "template"]

    @field_validator("url")
    @classmethod
    def url_must_look_http(cls, value: str) -> str:
        if not value.startswith(("http://", "https://")):
            raise ValueError("url must start with http:// or https://")
        return value


class AcceptanceCriterion(StrictModel):
    statement: str = Field(min_length=20, max_length=300)
    evidence_type: str = Field(min_length=3, max_length=80)


class Deliverable(StrictModel):
    id: str = Field(min_length=6, max_length=80)
    title: str = Field(min_length=4, max_length=80)
    description: str = Field(min_length=20, max_length=500)
    stage: DeliverableStage
    est_hours: float = Field(ge=2.0, le=80.0)
    week_start: int = Field(ge=1, le=12)
    week_end: int = Field(ge=1, le=12)
    verification_type: VerificationType
    acceptance_criteria: List[AcceptanceCriterion] = Field(min_length=3, max_length=5)
    artifact_type: str = Field(min_length=3, max_length=80)
    micro_tasks: List[MicroTask] = Field(min_length=3, max_length=7)
    resources: List[Resource] = Field(default_factory=list, max_length=3)
    depends_on: List[str] = Field(default_factory=list)

    @model_validator(mode="after")
    def validate_weeks_and_children(self) -> "Deliverable":
        if self.week_end < self.week_start:
            raise ValueError("week_end must be >= week_start")
        for task in self.micro_tasks:
            if task.deliverable_id != self.id:
                raise ValueError("every micro_task.deliverable_id must match deliverable.id")
        return self


class CandidatePath(StrictModel):
    name: str = Field(min_length=3, max_length=80)
    one_line_thesis: str = Field(min_length=10, max_length=220)
    first_three_weeks_sketch: str = Field(min_length=20, max_length=600)
    tradeoffs: str = Field(min_length=20, max_length=600)


class CandidatePathsResult(StrictModel):
    paths: List[CandidatePath] = Field(min_length=2, max_length=3)


class PathSelectionResult(StrictModel):
    selected_path_name: str = Field(min_length=3, max_length=80)
    rationale: str = Field(min_length=10, max_length=500)


class PlanConfidence(StrictModel):
    specificity: float = Field(ge=0.0, le=1.0)
    coverage: float = Field(ge=0.0, le=1.0)
    verifiability: float = Field(ge=0.0, le=1.0)
    resource_quality: float = Field(ge=0.0, le=1.0)
    schedule_realism: float = Field(ge=0.0, le=1.0)
    adversarial_robustness: float = Field(ge=0.0, le=1.0)
    schema_validity: float = Field(ge=0.0, le=1.0)

    @property
    def aggregate(self) -> float:
        scores = [
            self.specificity, self.coverage, self.verifiability,
            self.resource_quality, self.schedule_realism,
            self.adversarial_robustness, self.schema_validity,
        ]
        return sum(scores) / len(scores)


class CriticIssue(StrictModel):
    severity: Literal["high", "medium", "low"]
    category: Literal[
        "scope_gap", "unverifiable", "sandbagging", "schedule",
        "dependency", "resource_mismatch", "injection_residue", "other",
    ]
    description: str = Field(min_length=10, max_length=600)
    suggested_fix: str = Field(min_length=10, max_length=600)


class CriticResult(StrictModel):
    issues: List[CriticIssue] = Field(default_factory=list, max_length=20)


class Plan(StrictModel):
    goal: str = Field(min_length=3, max_length=2000)
    user_capacity_hours_per_week: float = Field(default=10.0, ge=1.0, le=60.0)
    target_weeks: int = Field(default=12, ge=4, le=24)
    deliverables: List[Deliverable] = Field(min_length=3, max_length=10)
    overall_thesis: str = Field(min_length=20, max_length=800)

    @model_validator(mode="after")
    def validate_capacity_and_dependencies(self) -> "Plan":
        total_est_hours = sum(d.est_hours for d in self.deliverables)
        total_capacity = self.user_capacity_hours_per_week * self.target_weeks
        if total_est_hours > total_capacity:
            raise ValueError("sum of deliverable est_hours cannot exceed total user capacity")
        ids = {d.id for d in self.deliverables}
        by_id = {d.id: d for d in self.deliverables}
        for d in self.deliverables:
            for dep in d.depends_on:
                if dep not in ids:
                    raise ValueError(f"deliverable {d.id} has missing dependency {dep}")
                if d.week_start < by_id[dep].week_end:
                    raise ValueError(f"deliverable {d.id} starts before dependency {dep} ends")
        return self


class CLASSicReport(StrictModel):
    cost_usd: float = Field(ge=0.0)
    latency_seconds: float = Field(ge=0.0)
    latency_per_node: Dict[str, float] = Field(default_factory=dict)
    accuracy_subgoal_coverage: float = Field(ge=0.0, le=1.0)
    security_injection_flagged: bool
    security_urls_verified: int = Field(ge=0)
    security_urls_rejected: int = Field(ge=0)
    stability_note: str = Field(min_length=3, max_length=300)


class IntakeResult(StrictModel):
    specificity_score: float = Field(ge=0.0, le=1.0)
    question: Optional[str] = Field(default=None, max_length=240)
    rationale: str = Field(min_length=10, max_length=400)


class DecomposerState(TypedDict, total=False):
    raw_goal: str
    sanitized_goal: str
    spotlight_token: str
    user_capacity_hours_per_week: float
    target_weeks: int
    timezone: str
    thread_id: str
    specificity_score: Optional[float]
    clarification: Optional[Clarification]
    clarification_needed: Optional[str]
    candidate_paths: List[CandidatePath]
    selected_path: Optional[CandidatePath]
    plan: Optional[Plan]
    critic_issues: List[CriticIssue]
    judge_confidence: Optional[PlanConfidence]
    iteration_count: int
    ics_text: Optional[str]
    ics_path: Optional[str]
    classic: Optional[CLASSicReport]
    node_latencies: Dict[str, float]
    token_usage: Dict[str, Dict[str, Any]]
    uncertainty_log: List[str]
    started_at: float
    security_injection_flagged: bool
    error: Optional[str]
