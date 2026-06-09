"use client";

import { useMemo, useState } from "react";
import { CheckCircle, ScrollText, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ComingSoon } from "@/components/crm/ComingSoon";
import { RelativeDate } from "@/components/crm/RelativeDate";
import { LogDecisionSheet } from "@/components/crm/LogDecisionSheet";
import type { Tables } from "@/lib/supabase/database.types";

type DecisionLog = Tables<"decisions_log">;
type Communication = Pick<Tables<"communications">, "id" | "logged_at" | "decisions_made" | "subject">;

type UnifiedDecision = {
  id: string;
  decision: string;
  rationale: string | null;
  made_by: string | null;
  date: string | null;
  source: "log" | "communication";
  sourceLabel?: string;
};

export function ClientDecisionsTab({
  clientId,
  decisions,
  communications,
  systems,
}: {
  clientId: string;
  decisions: DecisionLog[];
  communications: Communication[];
  systems: { id: string; name: string }[];
}) {
  const [logOpen, setLogOpen] = useState(false);
  const [search, setSearch] = useState("");

  const unified = useMemo(() => {
    const items: UnifiedDecision[] = [];

    decisions.forEach((d) => {
      items.push({
        id: d.id,
        decision: d.decision,
        rationale: d.rationale,
        made_by: d.made_by,
        date: d.logged_at ?? d.created_at,
        source: "log",
      });
    });

    communications.forEach((c) => {
      if (!c.decisions_made || c.decisions_made.length === 0) return;
      c.decisions_made.forEach((dec, i) => {
        items.push({
          id: `${c.id}-${i}`,
          decision: dec,
          rationale: null,
          made_by: null,
          date: c.logged_at,
          source: "communication",
          sourceLabel: c.subject || "Communication",
        });
      });
    });

    items.sort((a, b) => (b.date ?? "").localeCompare(a.date ?? ""));
    return items;
  }, [decisions, communications]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return unified;
    return unified.filter(
      (d) =>
        d.decision.toLowerCase().includes(q) ||
        (d.rationale?.toLowerCase().includes(q) ?? false) ||
        (d.made_by?.toLowerCase().includes(q) ?? false)
    );
  }, [unified, search]);

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3">
        <div className="relative flex-1">
          <Search className="pointer-events-none absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-text-muted" />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search decisions..."
            className="pl-8"
          />
        </div>
        <Button onClick={() => setLogOpen(true)}>
          <CheckCircle className="h-4 w-4" />
          Log decision
        </Button>
      </div>

      {unified.length === 0 ? (
        <ComingSoon
          icon={ScrollText}
          title="No decisions logged yet"
          description="Log key architectural, billing, or scope decisions so nothing gets re-litigated later."
        />
      ) : filtered.length === 0 ? (
        <ComingSoon
          icon={Search}
          title="No decisions match your search"
          description="Try different keywords."
        />
      ) : (
        <div className="space-y-3">
          {filtered.map((d) => (
            <DecisionCard key={d.id} decision={d} />
          ))}
        </div>
      )}

      <LogDecisionSheet
        clientId={clientId}
        systems={systems}
        open={logOpen}
        onOpenChange={setLogOpen}
      />
    </div>
  );
}

function DecisionCard({ decision }: { decision: UnifiedDecision }) {
  return (
    <div className="rounded-xl border border-border bg-card p-4">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <p className="font-medium text-foreground">{decision.decision}</p>
          {decision.rationale && (
            <p className="mt-1 text-sm text-text-secondary">{decision.rationale}</p>
          )}
          <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-text-muted">
            {decision.made_by && (
              <span>By: <span className="text-text-secondary">{decision.made_by}</span></span>
            )}
            {decision.source === "communication" && decision.sourceLabel && (
              <span>From: <span className="text-text-secondary">{decision.sourceLabel}</span></span>
            )}
            {decision.source === "log" && (
              <span className="rounded border border-border bg-muted px-1.5 py-0.5 font-medium">
                explicit
              </span>
            )}
          </div>
        </div>
        <div className="shrink-0 text-xs text-text-muted">
          <RelativeDate date={decision.date} />
        </div>
      </div>
    </div>
  );
}
