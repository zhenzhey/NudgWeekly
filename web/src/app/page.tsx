"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { Plus, Target, Loader2 } from "lucide-react";
import { QuestCard } from "@/components/QuestCard";
import { Button } from "@/components/ui/button";
import { QuestSummary } from "@/lib/types";
import * as api from "@/lib/api";

export default function DashboardPage() {
  const [quests, setQuests] = useState<QuestSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    api
      .listQuests()
      .then(setQuests)
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold text-white">
            Your{" "}
            <span className="gradient-text">Quests</span>
          </h1>
          <p className="text-gray-400 mt-1">
            Long-term goals broken into verifiable steps
          </p>
        </div>
        <Link href="/quest/new">
          <Button className="gap-2 shadow-lg shadow-violet-900/30">
            <Plus className="h-4 w-4" />
            New Quest
          </Button>
        </Link>
      </div>

      {/* Loading */}
      {loading && (
        <div className="flex items-center justify-center py-24">
          <Loader2 className="h-8 w-8 animate-spin text-violet-400" />
        </div>
      )}

      {/* Error */}
      {error && (
        <div className="p-4 rounded-xl bg-red-900/20 border border-red-600/30 text-red-400 text-sm">
          Failed to load quests: {error}
        </div>
      )}

      {/* Quest grid */}
      {!loading && !error && quests.length > 0 && (
        <motion.div
          className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3"
          initial="hidden"
          animate="visible"
          variants={{
            visible: { transition: { staggerChildren: 0.08 } },
            hidden: {},
          }}
        >
          {quests.map((q) => (
            <QuestCard key={q.id} quest={q} />
          ))}
        </motion.div>
      )}

      {/* Empty state */}
      {!loading && !error && quests.length === 0 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex flex-col items-center justify-center py-24 gap-6"
        >
          {/* Illustration */}
          <div className="relative">
            <div className="h-28 w-28 rounded-3xl bg-gradient-to-br from-violet-600/20 to-cyan-400/20 border border-violet-600/20 flex items-center justify-center">
              <Target className="h-14 w-14 text-violet-400" />
            </div>
            <div className="absolute -top-2 -right-2 h-6 w-6 rounded-full bg-gradient-to-br from-violet-600 to-cyan-400 flex items-center justify-center">
              <Plus className="h-3.5 w-3.5 text-white" />
            </div>
          </div>

          <div className="text-center max-w-sm">
            <h2 className="text-xl font-semibold text-white mb-2">
              Start your first Quest
            </h2>
            <p className="text-gray-400 text-sm leading-relaxed">
              Enter any long-term goal in plain English. Our AI will break it into a
              verifiable 3–12 week plan with weekly deliverables.
            </p>
          </div>

          <Link href="/quest/new">
            <Button size="lg" className="gap-2 shadow-xl shadow-violet-900/30">
              <Plus className="h-5 w-5" />
              New Quest
            </Button>
          </Link>

          {/* Feature hints */}
          <div className="grid grid-cols-3 gap-4 mt-4 max-w-lg w-full">
            {[
              { emoji: "🎯", label: "AI Breakdown" },
              { emoji: "📊", label: "Progress Ring" },
              { emoji: "🔍", label: "Resources" },
            ].map(({ emoji, label }) => (
              <div
                key={label}
                className="flex flex-col items-center gap-2 p-3 rounded-xl border border-[#1E1E2E] bg-[#13131A]"
              >
                <span className="text-2xl">{emoji}</span>
                <span className="text-xs text-gray-500">{label}</span>
              </div>
            ))}
          </div>
        </motion.div>
      )}
    </div>
  );
}
