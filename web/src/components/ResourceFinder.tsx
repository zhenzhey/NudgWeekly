"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ExternalLink, Loader2, Search, Users, GraduationCap } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Deliverable } from "@/lib/types";
import * as api from "@/lib/api";

interface ResourceFinderProps {
  questId: string;
  deliverables: Deliverable[];
}

interface ResourceItem {
  title: string;
  url: string;
  source_domain: string;
  snippet: string;
  relevance_score: number;
  kind: string;
}

function ResourceCard({ resource }: { resource: ResourceItem }) {
  return (
    <motion.a
      href={resource.url}
      target="_blank"
      rel="noopener noreferrer"
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      className="block p-4 rounded-xl border border-[#1E1E2E] bg-[#0A0A0F] hover:border-violet-600/30 hover:bg-violet-600/5 transition-all group"
    >
      <div className="flex items-start justify-between gap-2 mb-2">
        <h4 className="text-sm font-medium text-white group-hover:text-violet-300 transition-colors line-clamp-1">
          {resource.title}
        </h4>
        <ExternalLink className="h-3.5 w-3.5 text-gray-500 group-hover:text-violet-400 shrink-0 mt-0.5 transition-colors" />
      </div>
      <p className="text-xs text-gray-500 line-clamp-2 mb-2">{resource.snippet}</p>
      <div className="flex items-center justify-between">
        <span className="text-xs text-gray-600">{resource.source_domain}</span>
        <span className="text-xs px-2 py-0.5 rounded-full bg-[#1E1E2E] text-gray-400">
          {resource.kind}
        </span>
      </div>
    </motion.a>
  );
}

export function ResourceFinder({ questId, deliverables }: ResourceFinderProps) {
  const [selectedDelId, setSelectedDelId] = useState<string>(
    deliverables[0]?.id ?? ""
  );
  const [resources, setResources] = useState<ResourceItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const selectedDel = deliverables.find((d) => d.id === selectedDelId);

  async function handleSearch() {
    if (!selectedDel) return;
    setLoading(true);
    setError(null);
    try {
      const res = await api.findResources({
        deliverable_title: selectedDel.title,
        deliverable_description: selectedDel.description,
        quest_id: questId,
      });
      setResources(res.resources as ResourceItem[]);
      setSearched(true);
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-4">
      {/* Deliverable selector */}
      <div className="flex gap-3">
        <Select value={selectedDelId} onValueChange={setSelectedDelId}>
          <SelectTrigger className="flex-1">
            <SelectValue placeholder="Select a deliverable…" />
          </SelectTrigger>
          <SelectContent>
            {deliverables.map((d) => (
              <SelectItem key={d.id} value={d.id}>
                {d.title}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <Tabs defaultValue="agent">
        <TabsList className="w-full">
          <TabsTrigger value="agent" className="flex-1 gap-1.5">
            <Search className="h-3.5 w-3.5" />
            Agent Search
          </TabsTrigger>
          <TabsTrigger value="community" className="flex-1 gap-1.5">
            <Users className="h-3.5 w-3.5" />
            Community
          </TabsTrigger>
          <TabsTrigger value="coach" className="flex-1 gap-1.5">
            <GraduationCap className="h-3.5 w-3.5" />
            Coach
          </TabsTrigger>
        </TabsList>

        <TabsContent value="agent" className="space-y-3 mt-4">
          <Button
            onClick={handleSearch}
            disabled={!selectedDel || loading}
            variant="outline"
            className="w-full gap-2"
          >
            {loading ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Searching…
              </>
            ) : (
              <>
                <Search className="h-4 w-4" />
                Find Resources for "{selectedDel?.title ?? "…"}"
              </>
            )}
          </Button>

          {error && (
            <div className="p-3 rounded-xl bg-red-900/20 border border-red-600/30 text-red-400 text-sm">
              {error}
            </div>
          )}

          <AnimatePresence>
            {resources.length > 0 && (
              <div className="space-y-2">
                {resources.map((r, i) => (
                  <ResourceCard key={i} resource={r} />
                ))}
              </div>
            )}
          </AnimatePresence>

          {searched && resources.length === 0 && !loading && (
            <div className="text-center py-8 text-gray-500 text-sm">
              No resources found. Try a different deliverable.
            </div>
          )}

          {!searched && !loading && (
            <div className="text-center py-8 text-gray-600 text-sm">
              Click "Find Resources" to search for curated materials related to this deliverable.
            </div>
          )}
        </TabsContent>

        <TabsContent value="community" className="mt-4">
          <div className="flex flex-col items-center justify-center py-12 gap-3 text-center">
            <Users className="h-10 w-10 text-gray-600" />
            <h3 className="text-gray-400 font-medium">Community Scouting</h3>
            <p className="text-sm text-gray-600 max-w-xs">
              Find peers, accountability partners, and communities working on similar goals. Coming soon.
            </p>
            <span className="text-xs px-3 py-1 rounded-full bg-amber-600/20 text-amber-400 border border-amber-600/30">
              Coming Soon
            </span>
          </div>
        </TabsContent>

        <TabsContent value="coach" className="mt-4">
          <div className="flex flex-col items-center justify-center py-12 gap-3 text-center">
            <GraduationCap className="h-10 w-10 text-gray-600" />
            <h3 className="text-gray-400 font-medium">Coach Consulting</h3>
            <p className="text-sm text-gray-600 max-w-xs">
              Get matched with expert coaches who specialize in your goal domain. Coming soon.
            </p>
            <span className="text-xs px-3 py-1 rounded-full bg-violet-600/20 text-violet-400 border border-violet-600/30">
              Coming Soon
            </span>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
