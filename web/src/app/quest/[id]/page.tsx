"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { motion } from "framer-motion";
import {
  ArrowLeft,
  Loader2,
  BarChart3,
  CheckSquare,
  BookOpen,
  TrendingUp,
  ChevronDown,
  ChevronRight,
} from "lucide-react";
import { ProgressRing } from "@/components/ProgressRing";
import { DeliverableChecklist } from "@/components/DeliverableChecklist";
import { ResourceFinder } from "@/components/ResourceFinder";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Quest,
  Deliverable,
  DeliverableStage,
  STAGE_LABELS,
  STAGE_COLORS,
} from "@/lib/types";
import * as api from "@/lib/api";

const STAGE_ORDER: DeliverableStage[] = ["plan", "build", "ship", "scale"];

function CLASSicPanel({ classic }: { classic: any }) {
  const [open, setOpen] = useState(false);
  if (!classic) return null;

  return (
    <div className="rounded-xl border border-[#1E1E2E] overflow-hidden">
      <button
        onClick={() => setOpen((v) => !v)}
        className="w-full flex items-center justify-between px-4 py-3 text-sm text-gray-400 hover:bg-[#1E1E2E]/50 transition-colors"
      >
        <span className="flex items-center gap-2">
          <BarChart3 className="h-4 w-4 text-violet-400" />
          CLASSic Metrics
        </span>
        {open ? (
          <ChevronDown className="h-4 w-4" />
        ) : (
          <ChevronRight className="h-4 w-4" />
        )}
      </button>
      {open && (
        <div className="px-4 pb-4 space-y-2 text-xs text-gray-400 border-t border-[#1E1E2E]">
          <div className="grid grid-cols-2 gap-3 pt-3">
            <div>
              <span className="text-gray-600">Cost</span>
              <p className="text-white font-mono">${classic.cost_usd?.toFixed(4)}</p>
            </div>
            <div>
              <span className="text-gray-600">Latency</span>
              <p className="text-white font-mono">{classic.latency_seconds?.toFixed(2)}s</p>
            </div>
            <div>
              <span className="text-gray-600">Coverage</span>
              <p className="text-white font-mono">
                {(classic.accuracy_subgoal_coverage * 100)?.toFixed(0)}%
              </p>
            </div>
            <div>
              <span className="text-gray-600">URLs verified</span>
              <p className="text-white font-mono">
                {classic.security_urls_verified}
              </p>
            </div>
            <div className="col-span-2">
              <span className="text-gray-600">Security</span>
              <p className="text-white">
                Injection flagged:{" "}
                {classic.security_injection_flagged ? "Yes ⚠️" : "No ✓"}
              </p>
            </div>
            <div className="col-span-2">
              <span className="text-gray-600">Stability</span>
              <p className="text-gray-300">{classic.stability_note}</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default function QuestDetailPage() {
  const { id } = useParams<{ id: string }>();
  const [quest, setQuest] = useState<Quest | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!id) return;
    api
      .getQuest(id)
      .then(setQuest)
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, [id]);

  const handleDeliverableUpdate = useCallback((updated: Deliverable) => {
    setQuest((prev) => {
      if (!prev) return prev;
      return {
        ...prev,
        deliverables: prev.deliverables.map((d) =>
          d.id === updated.id ? updated : d
        ),
      };
    });
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="h-8 w-8 animate-spin text-violet-400" />
      </div>
    );
  }

  if (error || !quest) {
    return (
      <div className="max-w-3xl mx-auto px-4 py-10">
        <div className="p-4 rounded-xl bg-red-900/20 border border-red-600/30 text-red-400">
          {error || "Quest not found"}
        </div>
      </div>
    );
  }

  const total = quest.deliverables.length;
  const completed = quest.deliverables.filter((d) => d.is_completed).length;
  const percent = total > 0 ? Math.round((completed / total) * 100) : 0;

  // Stage breakdown
  const stageBreakdown = STAGE_ORDER.map((stage) => {
    const stageDels = quest.deliverables.filter((d) => d.stage === stage);
    const stageDone = stageDels.filter((d) => d.is_completed).length;
    return { stage, total: stageDels.length, done: stageDone };
  }).filter((s) => s.total > 0);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Back */}
      <Link
        href="/"
        className="inline-flex items-center gap-2 text-sm text-gray-400 hover:text-white transition-colors mb-6"
      >
        <ArrowLeft className="h-4 w-4" />
        All Quests
      </Link>

      {/* Hero section */}
      <div className="mb-8 p-6 rounded-2xl border border-[#1E1E2E] bg-[#13131A] overflow-hidden relative">
        {/* Background gradient */}
        <div className="absolute inset-0 bg-gradient-to-br from-violet-600/5 to-cyan-400/5 pointer-events-none" />

        <div className="relative flex items-start gap-8">
          {/* Large Progress Ring */}
          <div className="shrink-0">
            <ProgressRing percent={percent} size={160} strokeWidth={14} />
          </div>

          {/* Quest info */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-3 mb-2">
              <Badge
                variant={
                  quest.status === "completed"
                    ? "ship"
                    : quest.status === "active"
                    ? "build"
                    : "outline"
                }
              >
                {quest.status}
              </Badge>
              <span className="text-xs text-gray-500">
                {quest.target_weeks} weeks · {quest.capacity_hours_per_week}h/wk
              </span>
            </div>

            <h1 className="text-2xl font-bold text-white mb-1 leading-tight">
              {quest.title}
            </h1>
            <p className="text-gray-400 text-sm mb-4 line-clamp-2">
              {quest.raw_goal}
            </p>

            {/* Progress bar */}
            <div className="space-y-1.5 mb-4">
              <Progress value={percent} className="h-2" />
              <div className="flex justify-between text-xs text-gray-500">
                <span>{completed} of {total} deliverables complete</span>
                <span>{percent}%</span>
              </div>
            </div>

            {/* Stage breakdown */}
            <div className="flex flex-wrap gap-3">
              {stageBreakdown.map(({ stage, total: t, done }) => (
                <div key={stage} className="flex items-center gap-2">
                  <div
                    className="h-2 w-2 rounded-full"
                    style={{ backgroundColor: STAGE_COLORS[stage] }}
                  />
                  <span className="text-xs text-gray-400">
                    {STAGE_LABELS[stage]}:{" "}
                    <span className="text-white">{done}/{t}</span>
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Three main sections */}
      <div className="grid gap-6 lg:grid-cols-3">
        {/* Deliverable checklist — takes 2/3 on desktop */}
        <div className="lg:col-span-2 space-y-4">
          <div className="flex items-center gap-2">
            <CheckSquare className="h-4 w-4 text-violet-400" />
            <h2 className="font-semibold text-white">Deliverables</h2>
            <span className="text-xs text-gray-500 ml-1">
              ({completed}/{total})
            </span>
          </div>
          <DeliverableChecklist
            questId={quest.id}
            deliverables={quest.deliverables}
            onUpdate={handleDeliverableUpdate}
          />

          {/* CLASSic metrics collapsible */}
          {quest.classic_json && (
            <CLASSicPanel classic={quest.classic_json} />
          )}
        </div>

        {/* Right column */}
        <div className="space-y-4">
          {/* Resource Finder */}
          <div>
            <div className="flex items-center gap-2 mb-3">
              <BookOpen className="h-4 w-4 text-violet-400" />
              <h2 className="font-semibold text-white">Resources</h2>
            </div>
            {quest.deliverables.length > 0 ? (
              <ResourceFinder
                questId={quest.id}
                deliverables={quest.deliverables}
              />
            ) : (
              <div className="text-sm text-gray-500 py-4 text-center">
                No deliverables yet.
              </div>
            )}
          </div>

          {/* Plan thesis */}
          {quest.plan_json?.overall_thesis && (
            <div className="p-4 rounded-xl border border-violet-600/20 bg-violet-600/5">
              <div className="flex items-center gap-2 mb-2">
                <TrendingUp className="h-4 w-4 text-violet-400" />
                <span className="text-xs font-medium text-violet-400">
                  AI Strategy
                </span>
              </div>
              <p className="text-sm text-gray-300 leading-relaxed">
                {quest.plan_json.overall_thesis}
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
