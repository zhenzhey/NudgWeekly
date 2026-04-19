"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { ArrowRight, Calendar, Clock } from "lucide-react";
import { QuestSummary, STAGE_COLORS, STAGE_LABELS, DeliverableStage } from "@/lib/types";
import { ProgressRing } from "./ProgressRing";
import { Badge } from "./ui/badge";

interface QuestCardProps {
  quest: QuestSummary;
}

export function QuestCard({ quest }: QuestCardProps) {
  const total = quest.deliverables.length;
  const completed = quest.deliverables.filter((d) => d.is_completed).length;
  const percent = total > 0 ? Math.round((completed / total) * 100) : 0;

  // Count deliverables per stage
  const stageCounts = quest.deliverables.reduce(
    (acc, d) => {
      acc[d.stage] = (acc[d.stage] || 0) + 1;
      return acc;
    },
    {} as Record<string, number>
  );

  const statusColors: Record<string, string> = {
    draft: "text-gray-400",
    active: "text-emerald-400",
    paused: "text-amber-400",
    completed: "text-violet-400",
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ y: -4 }}
      transition={{ duration: 0.3 }}
    >
      <Link href={`/quest/${quest.id}`}>
        <div className="group relative overflow-hidden rounded-2xl border border-[#1E1E2E] bg-[#13131A] p-6 hover:border-violet-600/40 transition-all duration-300 cursor-pointer">
          {/* Gradient glow on hover */}
          <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none">
            <div className="absolute inset-0 bg-gradient-to-br from-violet-600/5 to-cyan-400/5 rounded-2xl" />
          </div>

          <div className="relative flex items-start gap-5">
            {/* Progress Ring */}
            <div className="shrink-0">
              <ProgressRing percent={percent} size={100} strokeWidth={8} />
            </div>

            {/* Content */}
            <div className="flex-1 min-w-0">
              <div className="flex items-start justify-between gap-2 mb-1">
                <h3 className="text-base font-semibold text-white leading-snug line-clamp-2 group-hover:text-violet-300 transition-colors">
                  {quest.title}
                </h3>
                <span className={`text-xs font-medium capitalize shrink-0 ${statusColors[quest.status]}`}>
                  {quest.status}
                </span>
              </div>

              <p className="text-sm text-gray-500 line-clamp-2 mb-3">
                {quest.raw_goal}
              </p>

              {/* Stage badges */}
              <div className="flex flex-wrap gap-1.5 mb-3">
                {(Object.entries(stageCounts) as [DeliverableStage, number][]).map(
                  ([stage, count]) => (
                    <Badge key={stage} variant={stage as any}>
                      {STAGE_LABELS[stage]} ·{count}
                    </Badge>
                  )
                )}
              </div>

              {/* Meta */}
              <div className="flex items-center gap-4 text-xs text-gray-500">
                <span className="flex items-center gap-1">
                  <Calendar className="h-3 w-3" />
                  {quest.target_weeks}w
                </span>
                <span className="flex items-center gap-1">
                  <Clock className="h-3 w-3" />
                  {quest.capacity_hours_per_week}h/wk
                </span>
                <span className="ml-auto flex items-center gap-1 text-violet-400 group-hover:gap-2 transition-all">
                  Open
                  <ArrowRight className="h-3 w-3" />
                </span>
              </div>
            </div>
          </div>

          {/* Bottom progress bar */}
          <div className="relative mt-5 h-1 rounded-full overflow-hidden bg-[#1E1E2E]">
            <motion.div
              className="absolute inset-y-0 left-0 rounded-full"
              style={{
                background: "linear-gradient(90deg, #7C3AED, #22D3EE)",
              }}
              initial={{ width: 0 }}
              animate={{ width: `${percent}%` }}
              transition={{ duration: 1, ease: "easeOut", delay: 0.2 }}
            />
          </div>
          <div className="flex justify-between mt-1.5 text-xs text-gray-600">
            <span>{completed} of {total} deliverables</span>
            <span>{percent}%</span>
          </div>
        </div>
      </Link>
    </motion.div>
  );
}
