"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { toast } from "sonner";
import {
  AlertTriangle,
  Bell,
  CheckSquare,
  GitBranch,
  Mail,
  MessageSquare,
  Phone,
  StickyNote,
  TrendingUp,
  Users,
  Video,
} from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { HealthBadge } from "@/components/crm/HealthBadge";
import { StatusBadge } from "@/components/crm/StatusBadge";
import { RelativeDate } from "@/components/crm/RelativeDate";
import { formatCurrency, formatLabel } from "@/lib/format";
import { daysUntil } from "@/lib/dates";
import { cn } from "@/lib/utils";
import type { Tables } from "@/lib/supabase/database.types";
import type { LucideIcon } from "lucide-react";

type ClientRow = Pick<Tables<"clients">, "id" | "name" | "status" | "health_score" | "monthly_value" | "contract_renewal">;
type PipelineRow = Pick<Tables<"clients">, "id" | "name" | "company" | "pipeline_stage" | "estimated_value" | "probability" | "next_action" | "next_action_date" | "expected_close">;

export type DashboardData = {
  clients: ClientRow[];
  openTasks: (Pick<Tables<"tasks">, "id" | "title" | "status" | "priority" | "due_date" | "client_id"> & {
    clients: { id: string; name: string } | null;
  })[];
  communications: (Pick<Tables<"communications">, "id" | "type" | "subject" | "summary" | "logged_at" | "follow_up_required" | "follow_up_date" | "follow_up_note" | "client_id"> & {
    clients: { id: string; name: string } | null;
  })[];
  pipeline: PipelineRow[];
  recentDoneTasks: (Pick<Tables<"tasks">, "id" | "title" | "completed_at" | "client_id"> & {
    clients: { id: string; name: string } | null;
  })[];
  today: string;
  weekFromNow: string;
};

const COMM_ICONS: Record<string, LucideIcon> = {
  call: Phone,
  email: Mail,
  message: MessageSquare,
  meeting: Users,
  loom: Video,
  note: StickyNote,
};

const ACTIVE_STAGES = ["lead", "contacted", "discovery", "proposal", "negotiation"];

export function DashboardView({ data }: { data: DashboardData }) {
  const { clients, openTasks, communications, pipeline, recentDoneTasks, today, weekFromNow } = data;
  const router = useRouter();

  // Derived stats
  const activeClients = useMemo(() => clients.filter((c) => c.status === "active"), [clients]);
  const mrr = useMemo(() => activeClients.reduce((s, c) => s + (c.monthly_value ?? 0), 0), [activeClients]);

  const tasksDueThisWeek = useMemo(
    () => openTasks.filter((t) => t.due_date && t.due_date >= today && t.due_date <= weekFromNow),
    [openTasks, today, weekFromNow]
  );

  const overdueFollowUps = useMemo(
    () => communications.filter((c) => c.follow_up_required && c.follow_up_date && c.follow_up_date < today),
    [communications, today]
  );

  // Last contact per client
  const lastContactMap = useMemo(() => {
    const m = new Map<string, string>();
    communications.forEach((c) => {
      if (!c.client_id || !c.logged_at) return;
      const existing = m.get(c.client_id);
      if (!existing || c.logged_at > existing) m.set(c.client_id, c.logged_at);
    });
    return m;
  }, [communications]);

  // Open task count per client
  const openTaskCountMap = useMemo(() => {
    const m = new Map<string, number>();
    openTasks.forEach((t) => {
      if (!t.client_id) return;
      m.set(t.client_id, (m.get(t.client_id) ?? 0) + 1);
    });
    return m;
  }, [openTasks]);

  // Priority queue: due today or urgent, not done
  const priorityTasks = useMemo(() => {
    const urgent = openTasks.filter((t) => t.priority === "urgent" || t.due_date === today);
    // Group by client
    const grouped = new Map<string, typeof urgent>();
    urgent.forEach((t) => {
      const key = t.clients?.id ?? "__none__";
      if (!grouped.has(key)) grouped.set(key, []);
      grouped.get(key)!.push(t);
    });
    return grouped;
  }, [openTasks, today]);

  // Prospect next actions — has a next_action set, not won/lost
  const prospectNextActions = useMemo(() =>
    pipeline
      .filter((p) => p.next_action && ACTIVE_STAGES.includes(p.pipeline_stage ?? ""))
      .sort((a, b) => {
        if (!a.next_action_date && !b.next_action_date) return 0;
        if (!a.next_action_date) return 1;
        if (!b.next_action_date) return -1;
        return a.next_action_date.localeCompare(b.next_action_date);
      }),
    [pipeline]
  );

  // Pipeline snapshot
  const pipelineActive = useMemo(() => pipeline.filter((p) => ACTIVE_STAGES.includes(p.pipeline_stage ?? "")), [pipeline]);
  const pipelineTotalValue = useMemo(() => pipelineActive.reduce((s, p) => s + (p.estimated_value ?? 0), 0), [pipelineActive]);
  const pipelineWeightedValue = useMemo(() =>
    pipelineActive.reduce((s, p) => s + (p.estimated_value ?? 0) * ((p.probability ?? 50) / 100), 0),
    [pipelineActive]
  );
  const stageCounts = useMemo(() => {
    const m: Record<string, number> = {};
    pipeline.forEach((p) => { if (p.pipeline_stage) m[p.pipeline_stage] = (m[p.pipeline_stage] ?? 0) + 1; });
    return m;
  }, [pipeline]);

  // Recent activity: merge last 10 comms + last 10 done tasks, sort, show top 10
  const recentActivity = useMemo(() => {
    const commsActivity = communications.slice(0, 10).map((c) => ({
      id: c.id,
      type: "comm" as const,
      label: c.subject || formatLabel(c.type),
      clientId: c.clients?.id,
      clientName: c.clients?.name,
      date: c.logged_at,
      icon: COMM_ICONS[c.type] ?? StickyNote,
    }));
    const tasksActivity = recentDoneTasks.map((t) => ({
      id: t.id,
      type: "task" as const,
      label: t.title,
      clientId: t.clients?.id,
      clientName: t.clients?.name,
      date: t.completed_at,
      icon: CheckSquare,
    }));
    return [...commsActivity, ...tasksActivity]
      .filter((a) => a.date)
      .sort((a, b) => (b.date ?? "").localeCompare(a.date ?? ""))
      .slice(0, 10);
  }, [communications, recentDoneTasks]);

  async function markTaskDone(taskId: string) {
    const supabase = createClient();
    const { error } = await supabase
      .from("tasks")
      .update({ status: "done", completed_at: new Date().toISOString() })
      .eq("id", taskId);
    if (error) { toast.error("Failed to update task", { description: error.message }); return; }
    router.refresh();
  }

  return (
    <div className="space-y-8">
      {/* Top metrics */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <MetricCard
          label="Active clients"
          value={activeClients.length}
          icon={Users}
          href="/clients"
        />
        <MetricCard
          label="Due this week"
          value={tasksDueThisWeek.length}
          icon={CheckSquare}
          href="/tasks"
          highlight={tasksDueThisWeek.length > 0}
        />
        <MetricCard
          label="MRR"
          value={formatCurrency(mrr) ?? "$0"}
          icon={TrendingUp}
          href="/clients"
        />
        <MetricCard
          label="Overdue follow-ups"
          value={overdueFollowUps.length}
          icon={Bell}
          highlight={overdueFollowUps.length > 0}
        />
      </div>

      <div className="grid grid-cols-1 gap-8 xl:grid-cols-3">
        <div className="space-y-8 xl:col-span-2">
          {/* Client health grid */}
          <section>
            <h2 className="mb-3 text-sm font-semibold text-foreground">
              Client health
              <span className="ml-2 font-normal text-text-muted">({activeClients.length} active)</span>
            </h2>
            {activeClients.length === 0 ? (
              <p className="text-sm text-text-muted">No active clients yet.</p>
            ) : (
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                {activeClients.map((client) => {
                  const renewalDays = daysUntil(client.contract_renewal);
                  const renewalSoon = renewalDays !== null && renewalDays >= 0 && renewalDays < 30;
                  const lastContact = lastContactMap.get(client.id);
                  const openCount = openTaskCountMap.get(client.id) ?? 0;
                  return (
                    <Link key={client.id} href={`/clients/${client.id}`}>
                      <div className="group rounded-xl border border-border bg-card p-3 transition-colors hover:border-foreground/20">
                        <div className="flex items-start justify-between gap-2">
                          <div className="min-w-0">
                            <p className="truncate font-medium text-foreground group-hover:underline">{client.name}</p>
                            <div className="mt-1 flex flex-wrap items-center gap-2">
                              <HealthBadge score={client.health_score} />
                              <StatusBadge status={client.status} />
                            </div>
                          </div>
                          {openCount > 0 && (
                            <span className="shrink-0 rounded-full bg-muted px-2 py-0.5 text-xs text-text-muted">
                              {openCount} task{openCount === 1 ? "" : "s"}
                            </span>
                          )}
                        </div>
                        <div className="mt-2 flex flex-wrap gap-x-3 gap-y-1 text-xs text-text-muted">
                          <span>Last contact: <RelativeDate date={lastContact} className="text-text-secondary" /></span>
                          {client.contract_renewal && (
                            <span className={cn(renewalSoon && "font-medium text-danger")}>
                              Renews <RelativeDate date={client.contract_renewal} className={cn(renewalSoon && "text-danger")} />
                            </span>
                          )}
                        </div>
                      </div>
                    </Link>
                  );
                })}
              </div>
            )}
          </section>

          {/* Priority queue */}
          <section>
            <h2 className="mb-3 text-sm font-semibold text-foreground">
              Priority queue
              <span className="ml-2 font-normal text-text-muted">due today or urgent</span>
            </h2>
            {priorityTasks.size === 0 ? (
              <p className="text-sm text-text-muted">Nothing urgent right now.</p>
            ) : (
              <div className="space-y-2">
                {Array.from(priorityTasks.entries()).map(([clientKey, tasks]) => {
                  const clientName = tasks[0]?.clients?.name ?? "No client";
                  const clientId = tasks[0]?.clients?.id;
                  return (
                    <div key={clientKey} className="rounded-xl border border-border bg-card p-3">
                      <p className="mb-2 text-xs font-medium text-text-secondary">
                        {clientId ? <Link href={`/clients/${clientId}`} className="hover:underline">{clientName}</Link> : clientName}
                      </p>
                      <ul className="space-y-1.5">
                        {tasks.map((task) => (
                          <li key={task.id} className="flex items-center gap-2 text-sm">
                            <button
                              type="button"
                              onClick={() => markTaskDone(task.id)}
                              className="flex h-4 w-4 shrink-0 items-center justify-center rounded border border-border transition-colors hover:border-primary/50 hover:bg-primary/10"
                              aria-label="Mark done"
                            />
                            <span className={cn("flex-1 truncate text-foreground", task.priority === "urgent" && "font-medium")}>
                              {task.title}
                            </span>
                            {task.priority === "urgent" && (
                              <span className="shrink-0 text-xs font-medium text-danger">Urgent</span>
                            )}
                            {task.due_date && task.due_date < today && (
                              <span className="shrink-0 text-xs text-danger">overdue</span>
                            )}
                          </li>
                        ))}
                      </ul>
                    </div>
                  );
                })}
              </div>
            )}
          </section>

          {/* Prospect next actions */}
          {prospectNextActions.length > 0 && (
            <section>
              <h2 className="mb-3 flex items-center gap-2 text-sm font-semibold text-foreground">
                <GitBranch className="h-4 w-4 text-text-muted" />
                Prospect next actions
                <span className="ml-1 font-normal text-text-muted">({prospectNextActions.length})</span>
              </h2>
              <div className="space-y-2">
                {prospectNextActions.map((p) => {
                  const isOverdue = p.next_action_date && p.next_action_date < today;
                  const isDueThisWeek = p.next_action_date && p.next_action_date >= today && p.next_action_date <= weekFromNow;
                  return (
                    <Link key={p.id} href={`/clients/${p.id}`}>
                      <div className={cn(
                        "group rounded-xl border bg-card p-3 transition-colors hover:border-foreground/20",
                        isOverdue ? "border-danger/20" : "border-border"
                      )}>
                        <div className="flex items-start justify-between gap-3">
                          <div className="min-w-0">
                            <p className="truncate text-sm font-medium text-foreground group-hover:underline">{p.name}</p>
                            <p className="mt-0.5 truncate text-sm text-text-secondary">{p.next_action}</p>
                          </div>
                          <div className="shrink-0 text-right">
                            {p.next_action_date ? (
                              <span className={cn(
                                "text-xs",
                                isOverdue ? "font-medium text-danger" : isDueThisWeek ? "font-medium text-warning" : "text-text-muted"
                              )}>
                                <RelativeDate date={p.next_action_date} />
                              </span>
                            ) : (
                              <span className="text-xs text-text-muted">No date</span>
                            )}
                          </div>
                        </div>
                      </div>
                    </Link>
                  );
                })}
              </div>
            </section>
          )}

          {/* Overdue follow-ups */}
          {overdueFollowUps.length > 0 && (
            <section>
              <h2 className="mb-3 text-sm font-semibold text-foreground">
                Overdue follow-ups
                <span className="ml-2 rounded-full bg-danger/20 px-1.5 py-0.5 text-xs font-medium text-danger">
                  {overdueFollowUps.length}
                </span>
              </h2>
              <ul className="space-y-2">
                {overdueFollowUps.map((comm) => {
                  const daysOver = daysUntil(comm.follow_up_date);
                  return (
                    <li key={comm.id} className="rounded-xl border border-danger/20 bg-danger/5 p-3">
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0">
                          {comm.clients && (
                            <Link href={`/clients/${comm.clients.id}?tab=communications`} className="text-sm font-medium text-foreground hover:underline">
                              {comm.clients.name}
                            </Link>
                          )}
                          {comm.follow_up_note && (
                            <p className="mt-0.5 text-sm text-text-secondary">{comm.follow_up_note}</p>
                          )}
                        </div>
                        <span className="shrink-0 text-xs text-danger">
                          {daysOver !== null ? `${Math.abs(daysOver)}d overdue` : "overdue"}
                        </span>
                      </div>
                    </li>
                  );
                })}
              </ul>
            </section>
          )}
        </div>

        {/* Sidebar */}
        <div className="space-y-8">
          {/* Pipeline snapshot */}
          <section>
            <h2 className="mb-3 flex items-center gap-2 text-sm font-semibold text-foreground">
              <GitBranch className="h-4 w-4 text-text-muted" />
              Pipeline
            </h2>
            <div className="rounded-xl border border-border bg-card p-3">
              <div className="mb-3 grid grid-cols-2 gap-2 text-sm">
                <div>
                  <p className="text-xs text-text-muted">Total value</p>
                  <p className="font-semibold tabular-nums text-foreground">{formatCurrency(pipelineTotalValue) ?? "$0"}</p>
                </div>
                <div>
                  <p className="text-xs text-text-muted">Weighted</p>
                  <p className="font-semibold tabular-nums text-foreground">{formatCurrency(pipelineWeightedValue) ?? "$0"}</p>
                </div>
              </div>
              <div className="space-y-1">
                {ACTIVE_STAGES.map((stage) => {
                  const count = stageCounts[stage] ?? 0;
                  return (
                    <div key={stage} className="flex items-center justify-between text-xs">
                      <span className="capitalize text-text-secondary">{stage}</span>
                      <span className={cn("font-medium tabular-nums", count > 0 ? "text-foreground" : "text-text-muted")}>
                        {count}
                      </span>
                    </div>
                  );
                })}
              </div>
              <Link href="/pipeline" className="mt-3 block text-center text-xs text-primary transition-colors hover:underline">
                View full pipeline →
              </Link>
            </div>
          </section>

          {/* Recent activity */}
          <section>
            <h2 className="mb-3 text-sm font-semibold text-foreground">Recent activity</h2>
            {recentActivity.length === 0 ? (
              <p className="text-sm text-text-muted">No recent activity yet.</p>
            ) : (
              <ul className="space-y-2">
                {recentActivity.map((item) => {
                  const Icon = item.icon;
                  return (
                    <li key={`${item.type}-${item.id}`} className="flex items-start gap-2.5">
                      <span className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-muted text-text-muted">
                        <Icon className="h-3.5 w-3.5" />
                      </span>
                      <div className="min-w-0">
                        <p className="truncate text-sm text-foreground">{item.label}</p>
                        <div className="flex items-center gap-1.5 text-xs text-text-muted">
                          {item.clientId && item.clientName && (
                            <Link href={`/clients/${item.clientId}`} className="hover:text-foreground hover:underline">
                              {item.clientName}
                            </Link>
                          )}
                          {item.clientId && <span>·</span>}
                          <RelativeDate date={item.date} />
                        </div>
                      </div>
                    </li>
                  );
                })}
              </ul>
            )}
          </section>
        </div>
      </div>
    </div>
  );
}

function MetricCard({
  label,
  value,
  icon: Icon,
  href,
  highlight,
}: {
  label: string;
  value: number | string;
  icon: LucideIcon;
  href?: string;
  highlight?: boolean;
}) {
  const inner = (
    <div className={cn(
      "rounded-xl border bg-card p-4 transition-colors",
      highlight ? "border-danger/30" : "border-border",
      href && "hover:border-foreground/20"
    )}>
      <div className="flex items-center justify-between">
        <p className="text-xs text-text-muted">{label}</p>
        <Icon className={cn("h-4 w-4", highlight ? "text-danger" : "text-text-muted")} />
      </div>
      <p className={cn("mt-2 text-2xl font-semibold tabular-nums", highlight ? "text-danger" : "text-foreground")}>
        {value}
      </p>
    </div>
  );
  return href ? <Link href={href}>{inner}</Link> : <div>{inner}</div>;
}
