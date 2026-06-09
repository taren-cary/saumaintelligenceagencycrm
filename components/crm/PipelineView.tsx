"use client";

import { useCallback, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { toast } from "sonner";
import { Calendar, DollarSign, GitBranch, Loader2, Plus, Target } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { RelativeDate } from "@/components/crm/RelativeDate";
import { AddProspectSheet } from "@/components/crm/AddProspectSheet";
import { ConvertToClientDialog } from "@/components/crm/ConvertToClientDialog";
import { formatCurrency } from "@/lib/format";
import { cn } from "@/lib/utils";
import type { Tables } from "@/lib/supabase/database.types";

export type Prospect = Tables<"pipeline">;

const STAGES = ["lead", "contacted", "discovery", "proposal", "negotiation", "won", "lost"] as const;
type Stage = (typeof STAGES)[number];

const STAGE_LABELS: Record<Stage, string> = {
  lead: "Lead",
  contacted: "Contacted",
  discovery: "Discovery",
  proposal: "Proposal",
  negotiation: "Negotiation",
  won: "Won",
  lost: "Lost",
};

const STAGE_COLORS: Record<Stage, string> = {
  lead: "border-t-text-muted/40",
  contacted: "border-t-primary/50",
  discovery: "border-t-primary/70",
  proposal: "border-t-warning/60",
  negotiation: "border-t-warning/80",
  won: "border-t-success",
  lost: "border-t-danger/40",
};

export function PipelineView({ prospects }: { prospects: Prospect[] }) {
  const router = useRouter();
  const [addOpen, setAddOpen] = useState(false);
  const [convertProspect, setConvertProspect] = useState<Prospect | null>(null);
  const [draggingId, setDraggingId] = useState<string | null>(null);
  const [dragOverStage, setDragOverStage] = useState<Stage | null>(null);
  const dragCounterRef = useRef<Record<Stage, number>>({} as Record<Stage, number>);

  const byStage = useMemo(() => {
    const map = new Map<Stage, Prospect[]>();
    STAGES.forEach((s) => map.set(s, []));
    prospects.forEach((p) => {
      const stage = (p.stage ?? "lead") as Stage;
      map.get(stage)?.push(p);
    });
    return map;
  }, [prospects]);

  const activeProspects = useMemo(() =>
    prospects.filter((p) => p.stage !== "won" && p.stage !== "lost"),
    [prospects]
  );
  const totalValue = useMemo(() =>
    activeProspects.reduce((s, p) => s + (p.estimated_value ?? 0), 0),
    [activeProspects]
  );
  const weightedValue = useMemo(() =>
    activeProspects.reduce((s, p) => s + (p.estimated_value ?? 0) * ((p.probability ?? 50) / 100), 0),
    [activeProspects]
  );

  async function moveToStage(prospectId: string, newStage: Stage) {
    const supabase = createClient();
    const { error } = await supabase
      .from("pipeline")
      .update({ stage: newStage })
      .eq("id", prospectId);
    if (error) {
      toast.error("Failed to update stage", { description: error.message });
      return;
    }
    if (newStage === "won") {
      const p = prospects.find((x) => x.id === prospectId);
      if (p) setConvertProspect(p);
    }
    router.refresh();
  }

  // DnD handlers
  function handleDragStart(e: React.DragEvent, id: string) {
    setDraggingId(id);
    e.dataTransfer.effectAllowed = "move";
    e.dataTransfer.setData("text/plain", id);
  }

  function handleDragEnd() {
    setDraggingId(null);
    setDragOverStage(null);
    dragCounterRef.current = {} as Record<Stage, number>;
  }

  const handleDragEnter = useCallback((e: React.DragEvent, stage: Stage) => {
    e.preventDefault();
    dragCounterRef.current[stage] = (dragCounterRef.current[stage] ?? 0) + 1;
    setDragOverStage(stage);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent, stage: Stage) => {
    dragCounterRef.current[stage] = (dragCounterRef.current[stage] ?? 1) - 1;
    if (dragCounterRef.current[stage] <= 0) {
      setDragOverStage((s) => (s === stage ? null : s));
    }
  }, []);

  function handleDrop(e: React.DragEvent, stage: Stage) {
    e.preventDefault();
    const id = e.dataTransfer.getData("text/plain");
    setDragOverStage(null);
    dragCounterRef.current = {} as Record<Stage, number>;
    if (id && id !== "") {
      const current = prospects.find((p) => p.id === id);
      if (current?.stage !== stage) moveToStage(id, stage);
    }
    setDraggingId(null);
  }

  return (
    <div className="space-y-4">
      {/* Summary bar */}
      <div className="flex flex-wrap items-center gap-4 rounded-xl border border-border bg-card px-4 py-3 text-sm">
        <div className="flex items-center gap-2">
          <DollarSign className="h-4 w-4 text-text-muted" />
          <span className="text-text-muted">Total:</span>
          <span className="font-semibold tabular-nums text-foreground">{formatCurrency(totalValue) ?? "$0"}</span>
        </div>
        <div className="flex items-center gap-2">
          <Target className="h-4 w-4 text-text-muted" />
          <span className="text-text-muted">Weighted:</span>
          <span className="font-semibold tabular-nums text-foreground">{formatCurrency(weightedValue) ?? "$0"}</span>
        </div>
        <div className="flex items-center gap-2">
          <GitBranch className="h-4 w-4 text-text-muted" />
          <span className="text-text-muted">Active:</span>
          <span className="font-semibold tabular-nums text-foreground">{activeProspects.length}</span>
        </div>
        <div className="ml-auto">
          <Button size="sm" onClick={() => setAddOpen(true)}>
            <Plus className="h-4 w-4" />
            Add prospect
          </Button>
        </div>
      </div>

      {/* Kanban board */}
      <div className="flex gap-3 overflow-x-auto pb-4">
        {STAGES.map((stage) => {
          const cards = byStage.get(stage) ?? [];
          const isOver = dragOverStage === stage;
          return (
            <div
              key={stage}
              className="flex w-64 shrink-0 flex-col gap-2"
              onDragOver={(e) => e.preventDefault()}
              onDragEnter={(e) => handleDragEnter(e, stage)}
              onDragLeave={(e) => handleDragLeave(e, stage)}
              onDrop={(e) => handleDrop(e, stage)}
            >
              {/* Column header */}
              <div className={cn(
                "rounded-t-lg border-t-2 bg-muted/40 px-3 py-2",
                STAGE_COLORS[stage]
              )}>
                <div className="flex items-center justify-between">
                  <span className="text-sm font-semibold text-foreground">{STAGE_LABELS[stage]}</span>
                  <span className="rounded-full bg-muted px-1.5 py-0.5 text-xs text-text-muted">
                    {cards.length}
                  </span>
                </div>
                {cards.length > 0 && (
                  <p className="text-xs text-text-muted">
                    {formatCurrency(cards.reduce((s, c) => s + (c.estimated_value ?? 0), 0)) ?? "$0"}
                  </p>
                )}
              </div>

              {/* Drop zone */}
              <div className={cn(
                "flex flex-1 flex-col gap-2 rounded-b-lg p-1 transition-colors",
                isOver && "bg-primary/5 ring-1 ring-primary/30"
              )}>
                {cards.map((prospect) => (
                  <ProspectCard
                    key={prospect.id}
                    prospect={prospect}
                    isDragging={draggingId === prospect.id}
                    onDragStart={handleDragStart}
                    onDragEnd={handleDragEnd}
                    onStageChange={moveToStage}
                    onConvert={() => setConvertProspect(prospect)}
                  />
                ))}
                {cards.length === 0 && (
                  <div className={cn(
                    "flex h-16 items-center justify-center rounded-lg border-2 border-dashed text-xs text-text-muted transition-colors",
                    isOver ? "border-primary/40" : "border-border/40"
                  )}>
                    Drop here
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      <AddProspectSheet open={addOpen} onOpenChange={setAddOpen} />
      {convertProspect && (
        <ConvertToClientDialog
          prospect={convertProspect}
          open={!!convertProspect}
          onOpenChange={(open) => { if (!open) setConvertProspect(null); }}
        />
      )}
    </div>
  );
}

function ProspectCard({
  prospect,
  isDragging,
  onDragStart,
  onDragEnd,
  onStageChange,
  onConvert,
}: {
  prospect: Prospect;
  isDragging: boolean;
  onDragStart: (e: React.DragEvent, id: string) => void;
  onDragEnd: () => void;
  onStageChange: (id: string, stage: Stage) => void;
  onConvert: () => void;
}) {
  const [moving, setMoving] = useState(false);

  async function handleQuickMove(newStage: Stage) {
    setMoving(true);
    await onStageChange(prospect.id, newStage);
    setMoving(false);
    if (newStage === "won") onConvert();
  }

  return (
    <div
      draggable
      onDragStart={(e) => onDragStart(e, prospect.id)}
      onDragEnd={onDragEnd}
      className={cn(
        "group cursor-grab rounded-lg border border-border bg-card p-3 transition-all active:cursor-grabbing",
        isDragging && "opacity-40 ring-1 ring-primary/40"
      )}
    >
      <div className="space-y-2">
        <div>
          <p className="font-medium text-foreground leading-tight">{prospect.name}</p>
          {prospect.company && (
            <p className="text-xs text-text-muted">{prospect.company}</p>
          )}
        </div>

        {prospect.estimated_value !== null && prospect.estimated_value !== undefined && (
          <div className="flex items-center gap-1 text-sm">
            <span className="font-semibold tabular-nums text-foreground">
              {formatCurrency(prospect.estimated_value)}
            </span>
            {prospect.probability !== null && prospect.probability !== undefined && (
              <span className="text-text-muted">· {prospect.probability}%</span>
            )}
          </div>
        )}

        {prospect.platform_notes && (
          <p className="line-clamp-2 text-xs text-text-secondary">{prospect.platform_notes}</p>
        )}

        {prospect.next_action && (
          <div className="rounded bg-muted px-2 py-1 text-xs text-text-secondary">
            <span className="text-text-muted">Next: </span>
            {prospect.next_action}
            {prospect.next_action_date && (
              <span className="ml-1 text-text-muted">
                (<RelativeDate date={prospect.next_action_date} />)
              </span>
            )}
          </div>
        )}

        {prospect.expected_close && (
          <div className="flex items-center gap-1 text-xs text-text-muted">
            <Calendar className="h-3 w-3" />
            Close <RelativeDate date={prospect.expected_close} className="text-text-secondary" />
          </div>
        )}
      </div>

      {/* Quick actions (show on hover) */}
      <div className="mt-2 hidden gap-1 group-hover:flex">
        {prospect.stage !== "won" && prospect.stage !== "lost" && (
          <>
            <button
              type="button"
              onClick={() => handleQuickMove("won")}
              disabled={moving}
              className="flex-1 rounded border border-success/30 bg-success/10 px-1.5 py-0.5 text-xs text-success transition-colors hover:bg-success/20 disabled:opacity-50"
            >
              Won
            </button>
            <button
              type="button"
              onClick={() => handleQuickMove("lost")}
              disabled={moving}
              className="flex-1 rounded border border-danger/30 bg-danger/10 px-1.5 py-0.5 text-xs text-danger transition-colors hover:bg-danger/20 disabled:opacity-50"
            >
              Lost
            </button>
          </>
        )}
        {moving && <Loader2 className="h-3 w-3 animate-spin text-text-muted" />}
      </div>
    </div>
  );
}
