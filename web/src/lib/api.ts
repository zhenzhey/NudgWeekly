import {
  AgentResponse,
  Deliverable,
  Quest,
  QuestSummary,
  Resource,
} from "./types";

// Re-export types that callers need
export type { AgentResponse, Quest, QuestSummary, Deliverable, Resource };

type DeliverablePatch = {
  is_completed?: boolean;
  title?: string;
  description?: string;
  verification_type?: string;
  position?: number;
  evidence_url?: string;
};

type MicroTaskPatch = {
  is_completed?: boolean;
};

type QuestCreateBody = {
  title: string;
  raw_goal: string;
  capacity_hours_per_week?: number;
  target_weeks?: number;
  plan_json?: object | null;
  classic_json?: object | null;
  ics_content?: string | null;
  thread_id?: string | null;
  deliverables?: Array<{
    title: string;
    description?: string;
    verification_type?: string;
    stage?: string;
    est_hours?: number;
    week_start?: number;
    week_end?: number;
    artifact_type?: string;
  }>;
};

const BASE = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000";

async function req<T>(
  method: string,
  path: string,
  body?: unknown
): Promise<T> {
  const res = await fetch(`${BASE}${path}`, {
    method,
    headers: body ? { "Content-Type": "application/json" } : {},
    body: body ? JSON.stringify(body) : undefined,
  });
  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(`${method} ${path} → ${res.status}: ${text}`);
  }
  if (res.status === 204) return undefined as T;
  return res.json() as Promise<T>;
}

// ── Agent ──────────────────────────────────────────────────────────────────

export async function decompose(params: {
  goal: string;
  capacity_hours_per_week?: number;
  target_weeks?: number;
  timezone?: string;
}): Promise<AgentResponse> {
  return req("POST", "/api/agent/decompose", params);
}

export async function resume(params: {
  thread_id: string;
  answer: string;
}): Promise<AgentResponse> {
  return req("POST", "/api/agent/resume", params);
}

export async function findResources(params: {
  deliverable_title: string;
  deliverable_description: string;
  quest_id?: string;
}): Promise<{ resources: Resource[] }> {
  return req("POST", "/api/agent/resources", params);
}

// ── Quests ─────────────────────────────────────────────────────────────────

export async function listQuests(): Promise<QuestSummary[]> {
  return req("GET", "/api/quests");
}

export async function createQuest(body: QuestCreateBody): Promise<Quest> {
  return req("POST", "/api/quests", body);
}

export async function getQuest(id: string): Promise<Quest> {
  return req("GET", `/api/quests/${id}`);
}

export async function updateQuest(
  id: string,
  body: { title?: string; status?: string }
): Promise<Quest> {
  return req("PUT", `/api/quests/${id}`, body);
}

export async function deleteQuest(id: string): Promise<void> {
  return req("DELETE", `/api/quests/${id}`);
}

// ── Deliverables ───────────────────────────────────────────────────────────

export async function patchDeliverable(
  questId: string,
  delId: string,
  body: DeliverablePatch
): Promise<Deliverable> {
  return req("PATCH", `/api/quests/${questId}/deliverables/${delId}`, body);
}

export async function addDeliverable(
  questId: string,
  body: {
    title: string;
    description?: string;
    verification_type?: string;
    stage?: string;
  }
): Promise<Deliverable> {
  return req("POST", `/api/quests/${questId}/deliverables`, body);
}

export async function deleteDeliverable(
  questId: string,
  delId: string
): Promise<void> {
  return req("DELETE", `/api/quests/${questId}/deliverables/${delId}`);
}

// ── MicroTasks ─────────────────────────────────────────────────────────────

export async function patchTask(
  questId: string,
  delId: string,
  taskId: string,
  body: MicroTaskPatch
): Promise<{ id: string; is_completed: boolean }> {
  return req(
    "PATCH",
    `/api/quests/${questId}/deliverables/${delId}/tasks/${taskId}`,
    body
  );
}
