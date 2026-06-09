"use client";

import type { LucideIcon } from "lucide-react";
import { Bell, Mail, MessageSquare, MessagesSquare, Phone, StickyNote, Users, Video } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ComingSoon } from "@/components/crm/ComingSoon";
import { RelativeDate } from "@/components/crm/RelativeDate";
import { formatAbsoluteDate } from "@/lib/dates";
import { formatLabel } from "@/lib/format";
import { cn } from "@/lib/utils";
import type { Tables } from "@/lib/supabase/database.types";

type Communication = Tables<"communications">;

const TYPE_ICONS: Record<string, LucideIcon> = {
  call: Phone,
  email: Mail,
  message: MessageSquare,
  meeting: Users,
  loom: Video,
  note: StickyNote,
};

const DIRECTION_LABELS: Record<string, string> = {
  inbound: "Inbound",
  outbound: "Outbound",
  internal: "Internal",
};

function isOverdue(date: string | null) {
  if (!date) return false;
  const startOfToday = new Date();
  startOfToday.setHours(0, 0, 0, 0);
  return new Date(date) < startOfToday;
}

export function ClientCommunicationsTab({
  communications,
  onLogCommunication,
}: {
  communications: Communication[];
  onLogCommunication: () => void;
}) {
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-sm text-text-secondary">
          {communications.length} logged communication{communications.length === 1 ? "" : "s"}
        </p>
        <Button onClick={onLogCommunication}>
          <MessagesSquare className="h-4 w-4" />
          Log communication
        </Button>
      </div>

      {communications.length === 0 ? (
        <ComingSoon
          icon={MessagesSquare}
          title="No communications logged yet"
          description="Capture every call, email, and message here — what was discussed, decisions made, and what needs follow-up."
        />
      ) : (
        <ul className="space-y-3">
          {communications.map((comm) => {
            const Icon = TYPE_ICONS[comm.type] ?? StickyNote;
            const overdue = comm.follow_up_required && isOverdue(comm.follow_up_date);

            return (
              <li key={comm.id} className="rounded-xl border border-border bg-card p-4">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex min-w-0 items-start gap-3">
                    <span className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-muted text-text-secondary">
                      <Icon className="h-4 w-4" />
                    </span>
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <p className="font-medium text-foreground">{comm.subject || formatLabel(comm.type)}</p>
                        <span className="rounded-full border border-border bg-muted px-1.5 py-0.5 text-[11px] uppercase tracking-wide text-text-muted">
                          {DIRECTION_LABELS[comm.direction ?? "outbound"] ?? formatLabel(comm.direction ?? "outbound")}
                        </span>
                      </div>
                      <p className="mt-1 text-sm text-text-secondary">{comm.summary}</p>

                      {comm.decisions_made && comm.decisions_made.length > 0 && (
                        <ul className="mt-2 space-y-1">
                          {comm.decisions_made.map((decision, i) => (
                            <li key={i} className="flex items-start gap-1.5 text-sm text-text-secondary">
                              <span className="mt-1.5 h-1 w-1 shrink-0 rounded-full bg-text-muted" />
                              {decision}
                            </li>
                          ))}
                        </ul>
                      )}

                      {comm.follow_up_required && (
                        <div
                          className={cn(
                            "mt-2 inline-flex items-center gap-1.5 rounded-full border px-2 py-0.5 text-xs",
                            overdue
                              ? "border-danger/30 bg-danger/10 text-danger"
                              : "border-warning/30 bg-warning/10 text-warning"
                          )}
                        >
                          <Bell className="h-3 w-3" />
                          Follow up{comm.follow_up_date ? ` — ${formatAbsoluteDate(comm.follow_up_date)}` : ""}
                          {comm.follow_up_note ? `: ${comm.follow_up_note}` : ""}
                        </div>
                      )}
                    </div>
                  </div>

                  <span className="shrink-0 whitespace-nowrap text-xs text-text-muted">
                    <RelativeDate date={comm.logged_at} />
                  </span>
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
