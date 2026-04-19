"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  ChevronDown,
  ChevronRight,
  ExternalLink,
  Clock,
  Calendar,
} from "lucide-react";
import { Deliverable, MicroTask, STAGE_LABELS } from "@/lib/types";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import * as api from "@/lib/api";

interface DeliverableChecklistProps {
  questId: string;
  deliverables: Deliverable[];
  onUpdate: (updated: Deliverable) => void;
}

const STAGE_VARIANT: Record<string, "plan" | "build" | "ship" | "scale"> = {
  plan: "plan",
  build: "build",
  ship: "ship",
  scale: "scale",
};

function TaskRow({
  task,
  questId,
  delId,
  onUpdate,
}: {
  task: MicroTask;
  questId: string;
  delId: string;
  onUpdate: (taskId: string, completed: boolean) => void;
}) {
  const [busy, setBusy] = useState(false);

  async function toggle() {
    setBusy(true);
    try {
      await api.patchTask(questId, delId, task.id, {
        is_completed: !task.is_completed,
      });
      onUpdate(task.id, !task.is_completed);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div
      className={`flex items-start gap-3 py-2 px-3 rounded-lg transition-all ${
        task.is_completed ? "opacity-50" : ""
      }`}
    >
      <Checkbox
        checked={task.is_completed}
        onCheckedChange={toggle}
        disabled={busy}
        className="mt-0.5"
      />
      <div className="flex-1 min-w-0">
        <p
          className={`text-xs leading-relaxed ${
            task.is_completed
              ? "line-through text-gray-500"
              : "text-gray-300"
          }`}
        >
          <span className="text-gray-500">When </span>
          {task.trigger}
          <span className="text-gray-500">, </span>
          {task.action}
        </p>
        <div className="flex items-center gap-3 mt-1">
          <span className="flex items-center gap-1 text-xs text-gray-600">
            <Clock className="h-2.5 w-2.5" />
            {task.est_minutes}m
          </span>
          <span className="text-xs text-gray-600 truncate">
            → {task.artifact_expected}
          </span>
        </div>
      </div>
    </div>
  );
}

function DeliverableRow({
  deliverable,
  questId,
  onUpdate,
}: {
  deliverable: Deliverable;
  questId: string;
  onUpdate: (updated: Deliverable) => void;
}) {
  const [expanded, setExpanded] = useState(false);
  const [busy, setBusy] = useState(false);
  const [localDel, setLocalDel] = useState(deliverable);

  async function toggleComplete() {
    setBusy(true);
    try {
      const updated = await api.patchDeliverable(questId, deliverable.id, {
        is_completed: !localDel.is_completed,
      });
      setLocalDel(updated);
      onUpdate(updated);
    } finally {
      setBusy(false);
    }
  }

  function handleTaskUpdate(taskId: string, completed: boolean) {
    setLocalDel((prev) => ({
      ...prev,
      micro_tasks: prev.micro_tasks.map((t) =>
        t.id === taskId ? { ...t, is_completed: completed } : t
      ),
    }));
  }

  const completedTasks = localDel.micro_tasks.filter((t) => t.is_completed).length;
  const totalTasks = localDel.micro_tasks.length;

  return (
    <motion.div
      layout
      className={`rounded-xl border transition-all duration-300 ${
        localDel.is_completed
          ? "border-emerald-600/20 bg-emerald-950/10"
          : "border-[#1E1E2E] bg-[#13131A]"
      }`}
    >
      <div className="flex items-start gap-3 p-4">
        {/* Completion checkbox */}
        <div className="mt-0.5">
          <motion.div
            animate={
              localDel.is_completed
                ? { scale: [1, 1.3, 1] }
                : { scale: 1 }
            }
            transition={{ duration: 0.3 }}
          >
            <Checkbox
              checked={localDel.is_completed}
              onCheckedChange={toggleComplete}
              disabled={busy}
            />
          </motion.div>
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2">
            <div>
              <p
                className={`font-medium leading-snug ${
                  localDel.is_completed
                    ? "line-through text-gray-500"
                    : "text-white"
                }`}
              >
                {localDel.title}
              </p>
              {localDel.description && (
                <p className="text-sm text-gray-500 mt-0.5 line-clamp-2">
                  {localDel.description}
                </p>
              )}
            </div>
            <div className="flex items-center gap-2 shrink-0">
              <Badge variant={STAGE_VARIANT[localDel.stage]}>
                {STAGE_LABELS[localDel.stage]}
              </Badge>
            </div>
          </div>

          {/* Meta row */}
          <div className="flex items-center gap-4 mt-2 text-xs text-gray-500">
            <span className="flex items-center gap-1">
              <Calendar className="h-3 w-3" />
              Wk {localDel.week_start}–{localDel.week_end}
            </span>
            <span className="flex items-center gap-1">
              <Clock className="h-3 w-3" />
              ~{localDel.est_hours}h
            </span>
            {localDel.evidence_url && (
              <a
                href={localDel.evidence_url}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-1 text-violet-400 hover:text-violet-300"
                onClick={(e) => e.stopPropagation()}
              >
                <ExternalLink className="h-3 w-3" />
                Evidence
              </a>
            )}
            {totalTasks > 0 && (
              <button
                onClick={() => setExpanded((v) => !v)}
                className="flex items-center gap-1 ml-auto text-gray-400 hover:text-white transition-colors"
              >
                {completedTasks}/{totalTasks} tasks
                {expanded ? (
                  <ChevronDown className="h-3 w-3" />
                ) : (
                  <ChevronRight className="h-3 w-3" />
                )}
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Micro-tasks expansion */}
      <AnimatePresence>
        {expanded && totalTasks > 0 && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden"
          >
            <div className="border-t border-[#1E1E2E] px-4 py-2 space-y-0.5">
              {localDel.micro_tasks.map((task) => (
                <TaskRow
                  key={task.id}
                  task={task}
                  questId={questId}
                  delId={localDel.id}
                  onUpdate={handleTaskUpdate}
                />
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

export function DeliverableChecklist({
  questId,
  deliverables,
  onUpdate,
}: DeliverableChecklistProps) {
  return (
    <div className="space-y-2">
      <AnimatePresence>
        {deliverables.map((d) => (
          <DeliverableRow
            key={d.id}
            deliverable={d}
            questId={questId}
            onUpdate={onUpdate}
          />
        ))}
      </AnimatePresence>
      {deliverables.length === 0 && (
        <div className="text-center py-8 text-gray-500 text-sm">
          No deliverables yet.
        </div>
      )}
    </div>
  );
}
