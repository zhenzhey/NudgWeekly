// TypeScript types mirroring the Pydantic schemas

export type VerificationType =
  | "deployed_url"
  | "code_repo"
  | "document"
  | "dataset"
  | "design_file"
  | "demo_video"
  | "written_reflection"
  | "referee_approval";

export type DeliverableStage = "plan" | "build" | "ship" | "scale";

export type QuestStatus = "draft" | "active" | "paused" | "completed";

export interface AcceptanceCriterion {
  statement: string;
  evidence_type: string;
}

export interface MicroTask {
  id: string;
  deliverable_id: string;
  trigger: string;
  action: string;
  est_minutes: number;
  artifact_expected: string;
  is_completed: boolean;
  completed_at: string | null;
  position: number;
}

export interface Resource {
  id: string;
  deliverable_id: string;
  title: string;
  url: string;
  source_domain: string;
  snippet: string;
  relevance_score: number;
  kind: string;
  source_type: string;
}

export interface Deliverable {
  id: string;
  quest_id: string;
  title: string;
  description: string;
  stage: DeliverableStage;
  est_hours: number;
  week_start: number;
  week_end: number;
  verification_type: VerificationType;
  artifact_type: string;
  is_completed: boolean;
  completed_at: string | null;
  evidence_url: string | null;
  position: number;
  micro_tasks: MicroTask[];
  resources: Resource[];
}

export interface Quest {
  id: string;
  title: string;
  raw_goal: string;
  status: QuestStatus;
  capacity_hours_per_week: number;
  target_weeks: number;
  created_at: string;
  updated_at: string;
  plan_json: AgentPlan | null;
  classic_json: CLASSicReport | null;
  thread_id: string | null;
  deliverables: Deliverable[];
}

export interface QuestSummary {
  id: string;
  title: string;
  raw_goal: string;
  status: QuestStatus;
  capacity_hours_per_week: number;
  target_weeks: number;
  created_at: string;
  updated_at: string;
  deliverables: Deliverable[];
}

// Agent types (from the Python agent)
export interface AgentMicroTask {
  id: string;
  deliverable_id: string;
  trigger: string;
  action: string;
  est_minutes: number;
  artifact_expected: string;
  depends_on: string[];
}

export interface AgentResource {
  title: string;
  url: string;
  source_domain: string;
  snippet: string;
  relevance_score: number;
  verified_200: boolean;
  kind: string;
}

export interface AgentAcceptanceCriterion {
  statement: string;
  evidence_type: string;
}

export interface AgentDeliverable {
  id: string;
  title: string;
  description: string;
  stage: DeliverableStage;
  est_hours: number;
  week_start: number;
  week_end: number;
  verification_type: VerificationType;
  acceptance_criteria: AgentAcceptanceCriterion[];
  artifact_type: string;
  micro_tasks: AgentMicroTask[];
  resources: AgentResource[];
  depends_on: string[];
}

export interface AgentPlan {
  goal: string;
  user_capacity_hours_per_week: number;
  target_weeks: number;
  deliverables: AgentDeliverable[];
  overall_thesis: string;
}

export interface CLASSicReport {
  cost_usd: number;
  latency_seconds: number;
  latency_per_node: Record<string, number>;
  accuracy_subgoal_coverage: number;
  security_injection_flagged: boolean;
  security_urls_verified: number;
  security_urls_rejected: number;
  stability_note: string;
}

export interface AgentResponse {
  plan: AgentPlan | null;
  classic: CLASSicReport | null;
  clarification_needed: string | null;
  thread_id: string | null;
  uncertainty_log: string[];
  error: string | null;
}

// Frontend-only types
export interface EditableDeliverable {
  id: string;
  title: string;
  description: string;
  verification_type: VerificationType;
  stage: DeliverableStage;
  est_hours: number;
  week_start: number;
  week_end: number;
  artifact_type: string;
}

export const VERIFICATION_LABELS: Record<VerificationType, string> = {
  deployed_url: "Deployed URL",
  code_repo: "GitHub Commit",
  document: "Google Doc Edit",
  dataset: "Dataset Upload",
  design_file: "Design File",
  demo_video: "Demo Video",
  written_reflection: "Written Reflection",
  referee_approval: "Referee Approval",
};

export const STAGE_COLORS: Record<DeliverableStage, string> = {
  plan: "#3B82F6",
  build: "#F59E0B",
  ship: "#10B981",
  scale: "#8B5CF6",
};

export const STAGE_LABELS: Record<DeliverableStage, string> = {
  plan: "Plan",
  build: "Build",
  ship: "Ship",
  scale: "Scale",
};
