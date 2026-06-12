"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Clock, Plus, Trash2 } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { ComingSoon } from "@/components/crm/ComingSoon";
import { RelativeDate } from "@/components/crm/RelativeDate";
import { LogTimeSheet } from "@/components/crm/LogTimeSheet";
import { cn } from "@/lib/utils";
import type { ClientTimeLog, ProjectWithTasks } from "@/components/crm/ClientDetailView";

function sumHours(logs: ClientTimeLog[]): number {
  return logs.reduce((sum, l) => sum + (l.hours ?? 0), 0);
}

function isThisMonth(dateStr: string | null): boolean {
  if (!dateStr) return false;
  const d = new Date(dateStr);
  const now = new Date();
  return d.getFullYear() === now.getFullYear() && d.getMonth() === now.getMonth();
}

function fmt(hours: number): string {
  return `${hours % 1 === 0 ? hours : hours.toFixed(1)}h`;
}

export function ClientTimeTab({
  clientId,
  clientName,
  projects,
  timeLogs,
}: {
  clientId: string;
  clientName: string;
  projects: ProjectWithTasks[];
  timeLogs: ClientTimeLog[];
}) {
  const router = useRouter();
  const [logOpen, setLogOpen] = useState(false);

  async function deleteLog(id: string) {
    const supabase = createClient();
    const { error } = await supabase.from("time_logs").delete().eq("id", id);
    if (error) { toast.error("Failed to delete", { description: error.message }); return; }
    router.refresh();
  }

  const totalHours = sumHours(timeLogs);
  const thisMonthLogs = timeLogs.filter((l) => isThisMonth(l.logged_date));
  const thisMonthHours = sumHours(thisMonthLogs);
  const billableHours = sumHours(timeLogs.filter((l) => l.billable !== false));
  const nonBillableHours = sumHours(timeLogs.filter((l) => l.billable === false));

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          <StatCard label="Total hours" value={fmt(totalHours)} />
          <StatCard label="This month" value={fmt(thisMonthHours)} />
          <StatCard label="Billable" value={fmt(billableHours)} highlight="success" />
          <StatCard label="Non-billable" value={fmt(nonBillableHours)} />
        </div>
        <Button onClick={() => setLogOpen(true)} className="ml-4 shrink-0">
          <Plus className="h-4 w-4" />
          Log time
        </Button>
      </div>

      {timeLogs.length === 0 ? (
        <ComingSoon
          icon={Clock}
          title="No time logged yet"
          description="Track hours against this client's projects and tasks to see billable vs. non-billable totals."
        />
      ) : (
        <div className="overflow-hidden rounded-lg border border-border">
          <table className="w-full text-sm">
            <thead className="bg-muted/50">
              <tr>
                <th className="px-3 py-2 text-left text-xs font-medium uppercase tracking-wide text-text-muted">Date</th>
                <th className="px-3 py-2 text-left text-xs font-medium uppercase tracking-wide text-text-muted">Project</th>
                <th className="px-3 py-2 text-left text-xs font-medium uppercase tracking-wide text-text-muted">Task</th>
                <th className="px-3 py-2 text-left text-xs font-medium uppercase tracking-wide text-text-muted">Description</th>
                <th className="px-3 py-2 text-right text-xs font-medium uppercase tracking-wide text-text-muted">Hours</th>
                <th className="px-3 py-2 text-center text-xs font-medium uppercase tracking-wide text-text-muted">Billable</th>
                <th className="w-8" />
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {timeLogs.map((log) => (
                <tr key={log.id} className="group transition-colors hover:bg-muted/30">
                  <td className="px-3 py-2 text-text-secondary">
                    <RelativeDate date={log.logged_date} />
                  </td>
                  <td className="px-3 py-2 text-text-secondary">
                    {log.projects?.name ?? <span className="text-text-muted">—</span>}
                  </td>
                  <td className="px-3 py-2 text-text-secondary">
                    {log.tasks?.title ?? <span className="text-text-muted">—</span>}
                  </td>
                  <td className="px-3 py-2 text-text-secondary">
                    {log.description || <span className="text-text-muted">—</span>}
                  </td>
                  <td className="px-3 py-2 text-right tabular-nums text-foreground">
                    {fmt(log.hours)}
                  </td>
                  <td className="px-3 py-2 text-center">
                    <span
                      className={cn(
                        "inline-block h-2 w-2 rounded-full",
                        log.billable !== false ? "bg-success" : "bg-text-muted"
                      )}
                    />
                  </td>
                  <td className="px-3 py-2 text-right">
                    <button
                      type="button"
                      onClick={() => deleteLog(log.id)}
                      className="text-text-muted opacity-0 transition-opacity hover:text-danger group-hover:opacity-100"
                      aria-label="Delete time log"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <LogTimeSheet
        clientId={clientId}
        clientName={clientName}
        projects={projects}
        open={logOpen}
        onOpenChange={setLogOpen}
      />
    </div>
  );
}

function StatCard({
  label,
  value,
  highlight,
}: {
  label: string;
  value: string;
  highlight?: "success";
}) {
  return (
    <div className="rounded-lg border border-border bg-card p-3">
      <p className="text-xs text-text-muted">{label}</p>
      <p className={cn("mt-1 text-xl font-semibold tabular-nums", highlight === "success" ? "text-success" : "text-foreground")}>
        {value}
      </p>
    </div>
  );
}
