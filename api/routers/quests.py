from __future__ import annotations

import uuid
from datetime import datetime
from typing import List

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from database import get_db  # type: ignore
from models import Deliverable, MicroTask, Quest, Resource  # type: ignore
from schemas import (  # type: ignore
    DeliverableCreate,
    DeliverableOut,
    DeliverablePatch,
    MicroTaskPatch,
    QuestCreate,
    QuestOut,
    QuestSummary,
    QuestUpdate,
)

router = APIRouter(prefix="/api/quests", tags=["quests"])


def _quest_or_404(db: Session, quest_id: str) -> Quest:
    q = db.get(Quest, quest_id)
    if not q:
        raise HTTPException(status_code=404, detail="Quest not found")
    return q


def _deliverable_or_404(db: Session, quest_id: str, del_id: str) -> Deliverable:
    d = db.get(Deliverable, del_id)
    if not d or d.quest_id != quest_id:
        raise HTTPException(status_code=404, detail="Deliverable not found")
    return d


def _task_or_404(db: Session, del_id: str, task_id: str) -> MicroTask:
    t = db.get(MicroTask, task_id)
    if not t or t.deliverable_id != del_id:
        raise HTTPException(status_code=404, detail="Task not found")
    return t


# ── Quest CRUD ─────────────────────────────────────────────────────────────────

@router.get("", response_model=List[QuestSummary])
def list_quests(db: Session = Depends(get_db)):
    return db.query(Quest).order_by(Quest.created_at.desc()).all()


@router.post("", response_model=QuestOut, status_code=201)
def create_quest(body: QuestCreate, db: Session = Depends(get_db)):
    quest = Quest(
        id=str(uuid.uuid4()),
        title=body.title,
        raw_goal=body.raw_goal,
        status="active",
        capacity_hours_per_week=body.capacity_hours_per_week,
        target_weeks=body.target_weeks,
        plan_json=body.plan_json,
        classic_json=body.classic_json,
        ics_content=body.ics_content,
        thread_id=body.thread_id,
    )
    db.add(quest)
    db.flush()

    for idx, d in enumerate(body.deliverables):
        slug = d.title[:30].lower().replace(" ", "-")
        del_id = f"del-{idx+1}-{slug}-{quest.id[:8]}"
        deliverable = Deliverable(
            id=del_id,
            quest_id=quest.id,
            title=d.title,
            description=d.description,
            stage=d.stage,
            est_hours=d.est_hours,
            week_start=d.week_start,
            week_end=d.week_end,
            verification_type=d.verification_type,
            artifact_type=d.artifact_type,
            position=idx,
        )
        db.add(deliverable)

    db.commit()
    db.refresh(quest)
    return quest


@router.get("/{quest_id}", response_model=QuestOut)
def get_quest(quest_id: str, db: Session = Depends(get_db)):
    return _quest_or_404(db, quest_id)


@router.put("/{quest_id}", response_model=QuestOut)
def update_quest(quest_id: str, body: QuestUpdate, db: Session = Depends(get_db)):
    quest = _quest_or_404(db, quest_id)
    if body.title is not None:
        quest.title = body.title
    if body.status is not None:
        quest.status = body.status
    if body.capacity_hours_per_week is not None:
        quest.capacity_hours_per_week = body.capacity_hours_per_week
    if body.target_weeks is not None:
        quest.target_weeks = body.target_weeks
    quest.updated_at = datetime.utcnow()
    db.commit()
    db.refresh(quest)
    return quest


@router.delete("/{quest_id}", status_code=204)
def delete_quest(quest_id: str, db: Session = Depends(get_db)):
    quest = _quest_or_404(db, quest_id)
    db.delete(quest)
    db.commit()


# ── Deliverable endpoints ──────────────────────────────────────────────────────

@router.post("/{quest_id}/deliverables", response_model=DeliverableOut, status_code=201)
def add_deliverable(quest_id: str, body: DeliverableCreate, db: Session = Depends(get_db)):
    quest = _quest_or_404(db, quest_id)
    existing = len(quest.deliverables)
    slug = body.title[:30].lower().replace(" ", "-")
    del_id = f"del-{existing+1}-{slug}-{quest_id[:8]}"
    deliverable = Deliverable(
        id=del_id,
        quest_id=quest_id,
        title=body.title,
        description=body.description,
        stage=body.stage,
        est_hours=body.est_hours,
        week_start=body.week_start,
        week_end=body.week_end,
        verification_type=body.verification_type,
        artifact_type=body.artifact_type,
        position=existing,
    )
    db.add(deliverable)
    db.commit()
    db.refresh(deliverable)
    return deliverable


@router.patch("/{quest_id}/deliverables/{del_id}", response_model=DeliverableOut)
def patch_deliverable(quest_id: str, del_id: str, body: DeliverablePatch, db: Session = Depends(get_db)):
    d = _deliverable_or_404(db, quest_id, del_id)
    if body.is_completed is not None:
        d.is_completed = body.is_completed
        d.completed_at = datetime.utcnow() if body.is_completed else None
    if body.title is not None:
        d.title = body.title
    if body.description is not None:
        d.description = body.description
    if body.verification_type is not None:
        d.verification_type = body.verification_type
    if body.position is not None:
        d.position = body.position
    if body.evidence_url is not None:
        d.evidence_url = body.evidence_url
    db.commit()
    db.refresh(d)
    return d


@router.delete("/{quest_id}/deliverables/{del_id}", status_code=204)
def delete_deliverable(quest_id: str, del_id: str, db: Session = Depends(get_db)):
    d = _deliverable_or_404(db, quest_id, del_id)
    db.delete(d)
    db.commit()


# ── MicroTask endpoints ────────────────────────────────────────────────────────

@router.patch("/{quest_id}/deliverables/{del_id}/tasks/{task_id}", response_model=dict)
def patch_task(quest_id: str, del_id: str, task_id: str, body: MicroTaskPatch, db: Session = Depends(get_db)):
    _deliverable_or_404(db, quest_id, del_id)
    task = _task_or_404(db, del_id, task_id)
    if body.is_completed is not None:
        task.is_completed = body.is_completed
        task.completed_at = datetime.utcnow() if body.is_completed else None
    db.commit()
    db.refresh(task)
    return {
        "id": task.id,
        "deliverable_id": task.deliverable_id,
        "is_completed": task.is_completed,
        "completed_at": task.completed_at,
    }
