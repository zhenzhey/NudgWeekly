"use client";

import { useState, useCallback } from "react";
import { DragDropContext, Droppable, Draggable, DropResult } from "@hello-pangea/dnd";
import { GripVertical, Trash2, Plus } from "lucide-react";
import {
  EditableDeliverable,
  VerificationType,
  VERIFICATION_LABELS,
} from "@/lib/types";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface DeliverableBuilderProps {
  deliverables: EditableDeliverable[];
  onChange: (deliverables: EditableDeliverable[]) => void;
}

const VERIFICATION_OPTIONS: VerificationType[] = [
  "deployed_url",
  "code_repo",
  "document",
  "dataset",
  "design_file",
  "demo_video",
  "written_reflection",
  "referee_approval",
];

function newDeliverable(index: number): EditableDeliverable {
  return {
    id: `new-del-${Date.now()}-${index}`,
    title: "",
    description: "",
    verification_type: "document",
    stage: "build",
    est_hours: 5,
    week_start: 1,
    week_end: 2,
    artifact_type: "document",
  };
}

export function DeliverableBuilder({
  deliverables,
  onChange,
}: DeliverableBuilderProps) {
  const update = useCallback(
    (index: number, field: keyof EditableDeliverable, value: string) => {
      const next = deliverables.map((d, i) =>
        i === index ? { ...d, [field]: value } : d
      );
      onChange(next);
    },
    [deliverables, onChange]
  );

  const remove = useCallback(
    (index: number) => {
      if (deliverables.length <= 1) return;
      onChange(deliverables.filter((_, i) => i !== index));
    },
    [deliverables, onChange]
  );

  const add = useCallback(() => {
    if (deliverables.length >= 10) return;
    onChange([...deliverables, newDeliverable(deliverables.length)]);
  }, [deliverables, onChange]);

  const onDragEnd = useCallback(
    (result: DropResult) => {
      if (!result.destination) return;
      const items = Array.from(deliverables);
      const [moved] = items.splice(result.source.index, 1);
      items.splice(result.destination.index, 0, moved);
      onChange(items);
    },
    [deliverables, onChange]
  );

  return (
    <div className="space-y-3">
      <DragDropContext onDragEnd={onDragEnd}>
        <Droppable droppableId="deliverables">
          {(provided) => (
            <div
              {...provided.droppableProps}
              ref={provided.innerRef}
              className="space-y-2"
            >
              {deliverables.map((d, index) => (
                <Draggable key={d.id} draggableId={d.id} index={index}>
                  {(provided, snapshot) => (
                    <div
                      ref={provided.innerRef}
                      {...provided.draggableProps}
                      className={`flex items-center gap-2 p-3 rounded-xl border transition-all ${
                        snapshot.isDragging
                          ? "border-violet-500/50 bg-[#1a1a2e] shadow-xl shadow-violet-900/20"
                          : "border-[#1E1E2E] bg-[#13131A]"
                      }`}
                    >
                      {/* Drag handle */}
                      <div
                        {...provided.dragHandleProps}
                        className="shrink-0 cursor-grab active:cursor-grabbing text-gray-600 hover:text-gray-400 transition-colors"
                      >
                        <GripVertical className="h-4 w-4" />
                      </div>

                      {/* Row number */}
                      <span className="shrink-0 w-5 text-xs text-gray-600 font-mono">
                        {index + 1}
                      </span>

                      {/* Title input */}
                      <Input
                        value={d.title}
                        onChange={(e) => update(index, "title", e.target.value)}
                        placeholder={`Deliverable ${index + 1} description…`}
                        className="flex-1 h-9 text-sm"
                      />

                      {/* Verification type dropdown */}
                      <div className="shrink-0 w-48">
                        <Select
                          value={d.verification_type}
                          onValueChange={(v) =>
                            update(index, "verification_type", v)
                          }
                        >
                          <SelectTrigger className="h-9 text-xs">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {VERIFICATION_OPTIONS.map((opt) => (
                              <SelectItem key={opt} value={opt} className="text-xs">
                                {VERIFICATION_LABELS[opt]}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>

                      {/* Delete button */}
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => remove(index)}
                        disabled={deliverables.length <= 1}
                        className="shrink-0 h-8 w-8 text-gray-600 hover:text-red-400 hover:bg-red-900/20"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  )}
                </Draggable>
              ))}
              {provided.placeholder}
            </div>
          )}
        </Droppable>
      </DragDropContext>

      {/* Add deliverable button */}
      <Button
        variant="outline"
        onClick={add}
        disabled={deliverables.length >= 10}
        className="w-full border-dashed gap-2 text-gray-400 hover:text-white"
      >
        <Plus className="h-4 w-4" />
        Add Deliverable
        <span className="ml-auto text-xs text-gray-600">
          {deliverables.length}/10
        </span>
      </Button>
    </div>
  );
}
