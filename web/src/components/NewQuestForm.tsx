"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { Sparkles, Loader2, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { DeliverableBuilder } from "@/components/DeliverableBuilder";
import {
  AgentDeliverable,
  AgentPlan,
  EditableDeliverable,
  VerificationType,
} from "@/lib/types";
import * as api from "@/lib/api";

function agentDeliverableToEditable(d: AgentDeliverable): EditableDeliverable {
  return {
    id: d.id,
    title: d.title,
    description: d.description,
    verification_type: d.verification_type as VerificationType,
    stage: d.stage,
    est_hours: d.est_hours,
    week_start: d.week_start,
    week_end: d.week_end,
    artifact_type: d.artifact_type,
  };
}

type Step = "input" | "clarify" | "edit";

export function NewQuestForm() {
  const router = useRouter();
  const [step, setStep] = useState<Step>("input");
  const [goal, setGoal] = useState("");
  const [capacity, setCapacity] = useState(10);
  const [weeks, setWeeks] = useState(12);
  const [questTitle, setQuestTitle] = useState("");
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Clarification state
  const [clarifyQuestion, setClarifyQuestion] = useState("");
  const [clarifyAnswer, setClarifyAnswer] = useState("");
  const [pendingThreadId, setPendingThreadId] = useState<string | null>(null);

  // Plan state
  const [plan, setPlan] = useState<AgentPlan | null>(null);
  const [classic, setClassic] = useState<any>(null);
  const [deliverables, setDeliverables] = useState<EditableDeliverable[]>([]);

  async function handleBreakdown() {
    if (!goal.trim()) return;
    setLoading(true);
    setError(null);
    try {
      const res = await api.decompose({
        goal: goal.trim(),
        capacity_hours_per_week: capacity,
        target_weeks: weeks,
      });
      if (res.error && !res.plan) {
        setError(res.error);
        return;
      }
      if (res.clarification_needed) {
        setClarifyQuestion(res.clarification_needed);
        setPendingThreadId(res.thread_id ?? null);
        setStep("clarify");
        return;
      }
      if (res.plan) {
        setPlan(res.plan);
        setClassic(res.classic);
        const editableDels = res.plan.deliverables.map(agentDeliverableToEditable);
        setDeliverables(editableDels);
        setQuestTitle(
          res.plan.goal.slice(0, 80) ||
            goal.slice(0, 80)
        );
        setStep("edit");
      }
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }

  async function handleClarify() {
    if (!clarifyAnswer.trim() || !pendingThreadId) return;
    setLoading(true);
    setError(null);
    try {
      const res = await api.resume({
        thread_id: pendingThreadId,
        answer: clarifyAnswer.trim(),
      });
      if (res.plan) {
        setPlan(res.plan);
        setClassic(res.classic);
        const editableDels = res.plan.deliverables.map(agentDeliverableToEditable);
        setDeliverables(editableDels);
        setQuestTitle(res.plan.goal.slice(0, 80) || goal.slice(0, 80));
        setStep("edit");
      } else {
        setError(res.error || "Could not resume decomposer.");
      }
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }

  async function handleSave() {
    if (!questTitle.trim() || deliverables.length < 1) return;
    setSaving(true);
    setError(null);
    try {
      const quest = await api.createQuest({
        title: questTitle.trim(),
        raw_goal: goal.trim(),
        capacity_hours_per_week: capacity,
        target_weeks: weeks,
        plan_json: plan ?? undefined,
        classic_json: classic ?? undefined,
        deliverables: deliverables.map((d) => ({
          title: d.title,
          description: d.description,
          verification_type: d.verification_type,
          stage: d.stage,
          est_hours: d.est_hours,
          week_start: d.week_start,
          week_end: d.week_end,
          artifact_type: d.artifact_type,
        })),
      });
      router.push(`/quest/${quest.id}`);
    } catch (e: any) {
      setError(e.message);
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <AnimatePresence mode="wait">
        {step === "input" && (
          <motion.div
            key="input"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="space-y-6"
          >
            {/* Goal input */}
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-300">
                What do you want to achieve?
              </label>
              <Textarea
                value={goal}
                onChange={(e) => setGoal(e.target.value)}
                placeholder="I want to launch a SaaS side project while working full-time as an accountant. My goal is to get 10 paying users in 12 weeks."
                rows={4}
                className="text-base resize-none"
              />
            </div>

            {/* Capacity + Weeks */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-300">
                  Hours per week
                </label>
                <Input
                  type="number"
                  value={capacity}
                  onChange={(e) => setCapacity(Number(e.target.value))}
                  min={1}
                  max={60}
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-300">
                  Target weeks
                </label>
                <Input
                  type="number"
                  value={weeks}
                  onChange={(e) => setWeeks(Number(e.target.value))}
                  min={4}
                  max={24}
                />
              </div>
            </div>

            {error && (
              <div className="p-3 rounded-xl bg-red-900/20 border border-red-600/30 text-red-400 text-sm">
                {error}
              </div>
            )}

            <Button
              onClick={handleBreakdown}
              disabled={!goal.trim() || loading}
              className="w-full h-12 text-base gap-3"
            >
              {loading ? (
                <>
                  <Loader2 className="h-5 w-5 animate-spin" />
                  Thinking…
                </>
              ) : (
                <>
                  <Sparkles className="h-5 w-5" />
                  Break it down with AI
                </>
              )}
            </Button>
          </motion.div>
        )}

        {step === "clarify" && (
          <motion.div
            key="clarify"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="space-y-6"
          >
            <div className="p-5 rounded-2xl border border-violet-600/30 bg-violet-600/5">
              <div className="flex items-start gap-3">
                <Sparkles className="h-5 w-5 text-violet-400 mt-0.5 shrink-0" />
                <div>
                  <p className="text-sm font-medium text-violet-300 mb-1">
                    One quick question to make your plan sharper:
                  </p>
                  <p className="text-white">{clarifyQuestion}</p>
                </div>
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-300">
                Your answer
              </label>
              <Textarea
                value={clarifyAnswer}
                onChange={(e) => setClarifyAnswer(e.target.value)}
                placeholder="Type your answer here…"
                rows={3}
                autoFocus
              />
            </div>

            {error && (
              <div className="p-3 rounded-xl bg-red-900/20 border border-red-600/30 text-red-400 text-sm">
                {error}
              </div>
            )}

            <div className="flex gap-3">
              <Button
                variant="outline"
                onClick={() => setStep("input")}
                className="flex-1"
              >
                Back
              </Button>
              <Button
                onClick={handleClarify}
                disabled={!clarifyAnswer.trim() || loading}
                className="flex-1 gap-2"
              >
                {loading ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <ChevronRight className="h-4 w-4" />
                )}
                Continue
              </Button>
            </div>
          </motion.div>
        )}

        {step === "edit" && (
          <motion.div
            key="edit"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="space-y-6"
          >
            {/* Quest title */}
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-300">
                Quest name
              </label>
              <Input
                value={questTitle}
                onChange={(e) => setQuestTitle(e.target.value)}
                placeholder="Your quest name…"
                className="text-base"
              />
            </div>

            {/* Plan thesis */}
            {plan?.overall_thesis && (
              <div className="p-4 rounded-xl border border-violet-600/20 bg-violet-600/5">
                <p className="text-xs font-medium text-violet-400 mb-1">
                  AI Strategy
                </p>
                <p className="text-sm text-gray-300">{plan.overall_thesis}</p>
              </div>
            )}

            {/* Deliverable builder */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <label className="text-sm font-medium text-gray-300">
                  Deliverables
                </label>
                <span className="text-xs text-gray-500">
                  Drag to reorder, edit to customize
                </span>
              </div>
              <DeliverableBuilder
                deliverables={deliverables}
                onChange={setDeliverables}
              />
            </div>

            {/* Validation hint */}
            {deliverables.some((d) => !d.title.trim()) && (
              <div className="p-3 rounded-xl bg-amber-900/20 border border-amber-600/30 text-amber-400 text-sm">
                All deliverables need a title before saving.
              </div>
            )}

            {error && (
              <div className="p-3 rounded-xl bg-red-900/20 border border-red-600/30 text-red-400 text-sm">
                {error}
              </div>
            )}

            <div className="flex gap-3">
              <Button
                variant="outline"
                onClick={() => setStep("input")}
                className="flex-shrink-0"
              >
                Start over
              </Button>
              <Button
                onClick={handleSave}
                disabled={
                  saving ||
                  !questTitle.trim() ||
                  deliverables.length < 1 ||
                  deliverables.some((d) => !d.title.trim())
                }
                className="flex-1 h-12 text-base gap-2"
              >
                {saving ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Saving…
                  </>
                ) : (
                  "Save & Start Quest"
                )}
              </Button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
