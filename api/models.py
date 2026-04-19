from __future__ import annotations

import uuid
from datetime import datetime
from typing import Optional

from sqlalchemy import JSON, Boolean, DateTime, Float, ForeignKey, Integer, String, Text
from sqlalchemy.orm import Mapped, mapped_column, relationship

from database import Base  # type: ignore


def gen_uuid() -> str:
    return str(uuid.uuid4())


class Quest(Base):
    __tablename__ = "quests"

    id: Mapped[str] = mapped_column(String, primary_key=True, default=gen_uuid)
    title: Mapped[str] = mapped_column(String(200), nullable=False)
    raw_goal: Mapped[str] = mapped_column(Text, nullable=False)
    status: Mapped[str] = mapped_column(String(20), default="draft", nullable=False)
    capacity_hours_per_week: Mapped[float] = mapped_column(Float, default=10.0)
    target_weeks: Mapped[int] = mapped_column(Integer, default=12)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)
    updated_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    plan_json: Mapped[Optional[dict]] = mapped_column(JSON, nullable=True)
    classic_json: Mapped[Optional[dict]] = mapped_column(JSON, nullable=True)
    ics_content: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    thread_id: Mapped[Optional[str]] = mapped_column(String(100), nullable=True)

    deliverables: Mapped[list["Deliverable"]] = relationship(
        "Deliverable", back_populates="quest", cascade="all, delete-orphan", order_by="Deliverable.position"
    )


class Deliverable(Base):
    __tablename__ = "deliverables"

    id: Mapped[str] = mapped_column(String(100), primary_key=True)
    quest_id: Mapped[str] = mapped_column(String, ForeignKey("quests.id"), nullable=False)
    title: Mapped[str] = mapped_column(String(200), nullable=False)
    description: Mapped[str] = mapped_column(Text, default="")
    stage: Mapped[str] = mapped_column(String(20), default="plan")
    est_hours: Mapped[float] = mapped_column(Float, default=5.0)
    week_start: Mapped[int] = mapped_column(Integer, default=1)
    week_end: Mapped[int] = mapped_column(Integer, default=2)
    verification_type: Mapped[str] = mapped_column(String(50), default="document")
    artifact_type: Mapped[str] = mapped_column(String(100), default="document")
    is_completed: Mapped[bool] = mapped_column(Boolean, default=False)
    completed_at: Mapped[Optional[datetime]] = mapped_column(DateTime, nullable=True)
    evidence_url: Mapped[Optional[str]] = mapped_column(String(500), nullable=True)
    position: Mapped[int] = mapped_column(Integer, default=0)

    quest: Mapped["Quest"] = relationship("Quest", back_populates="deliverables")
    micro_tasks: Mapped[list["MicroTask"]] = relationship(
        "MicroTask", back_populates="deliverable", cascade="all, delete-orphan", order_by="MicroTask.position"
    )
    resources: Mapped[list["Resource"]] = relationship(
        "Resource", back_populates="deliverable", cascade="all, delete-orphan"
    )


class MicroTask(Base):
    __tablename__ = "micro_tasks"

    id: Mapped[str] = mapped_column(String(100), primary_key=True)
    deliverable_id: Mapped[str] = mapped_column(String(100), ForeignKey("deliverables.id"), nullable=False)
    trigger: Mapped[str] = mapped_column(Text, default="")
    action: Mapped[str] = mapped_column(Text, default="")
    est_minutes: Mapped[int] = mapped_column(Integer, default=45)
    artifact_expected: Mapped[str] = mapped_column(Text, default="")
    is_completed: Mapped[bool] = mapped_column(Boolean, default=False)
    completed_at: Mapped[Optional[datetime]] = mapped_column(DateTime, nullable=True)
    position: Mapped[int] = mapped_column(Integer, default=0)

    deliverable: Mapped["Deliverable"] = relationship("Deliverable", back_populates="micro_tasks")


class Resource(Base):
    __tablename__ = "resources"

    id: Mapped[str] = mapped_column(String, primary_key=True, default=gen_uuid)
    deliverable_id: Mapped[str] = mapped_column(String(100), ForeignKey("deliverables.id"), nullable=False)
    title: Mapped[str] = mapped_column(String(200), default="")
    url: Mapped[str] = mapped_column(String(500), default="")
    source_domain: Mapped[str] = mapped_column(String(150), default="")
    snippet: Mapped[str] = mapped_column(Text, default="")
    relevance_score: Mapped[float] = mapped_column(Float, default=0.5)
    kind: Mapped[str] = mapped_column(String(50), default="reference")
    source_type: Mapped[str] = mapped_column(String(50), default="agent_search")

    deliverable: Mapped["Deliverable"] = relationship("Deliverable", back_populates="resources")
