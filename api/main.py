from __future__ import annotations

import logging
import os

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from database import init_db  # type: ignore
from routers.agent import router as agent_router  # type: ignore
from routers.quests import router as quests_router  # type: ignore

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

app = FastAPI(
    title="NUDG API",
    description="Goal-tracking platform powered by a LangGraph decomposer agent",
    version="1.0.0",
)

# ── CORS ──────────────────────────────────────────────────────────────────────
cors_origins_raw = os.environ.get("CORS_ORIGINS", "*")
cors_origins = [o.strip() for o in cors_origins_raw.split(",")]

app.add_middleware(
    CORSMiddleware,
    allow_origins=cors_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ── Routers ───────────────────────────────────────────────────────────────────
app.include_router(agent_router)
app.include_router(quests_router)


# ── Startup ───────────────────────────────────────────────────────────────────
@app.on_event("startup")
def on_startup():
    init_db()
    logger.info("NUDG API ready")


@app.get("/healthz")
def health():
    return {"status": "ok"}
