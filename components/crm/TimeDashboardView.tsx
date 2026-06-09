"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import {
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { ArrowUpDown, Clock, Loader2, Plus } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { RelativeDate } from "@/components/crm/RelativeDate";
import { ComingSoon } from "@/components/crm/ComingSoon";
import { cn } from "@/lib/utils";
import type { Tables } from "@/lib/supabase/database.types";

export type GlobalTimeLog = Tables<"time_logs"> & {
  clients: { id: string; name: string } | null;
  projects: { id: string; name: string } | null;
  tasks: { id: string; title: string } | null;
};

type Client = { id: string; name: string };
type Project = { id: string; name: string; client_id: string | null };

const NONE = "__none__";

function sumHours(logs: GlobalTimeLog[]): number {
  return logs.reduce((s, l) => s + (l.hours ?? 0), 0);
}

function isThisWeek(dateStr: string | null): boolean {
  if (!dateStr) return false;
  const d = new Date(dateStr);
  const now = new Date();
  const startOfWeek = new Date(now);
  startOfWeek.setDate(now.getDate() - now.getDay());
  startOfWeek.setHours(0, 0, 0, 0);
  return d >= startOfWeek;
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

type SortKey = "date" | "client" | "project" | "hours" | "billable";

function SortHeader({
  col,
  label,
  activeKey,
  onToggle,
}: {
  col: SortKey;
  label: string;
  activeKey: SortKey;
  onToggle: (key: SortKey) => void;
}) {
  return (
    <button
      type="button"
      onClick={() => onToggle(col)}
      className="inline-flex items-center gap-1 text-xs font-medium uppercase tracking-wide text-text-muted transition-colors hover:text-foreground"
    >
      {label}
      <ArrowUpDown className={cn("h-3 w-3", activeKey === col && "text-foreground")} />
    </button>
  );
}

function StatCard({ label, value, sub }: { label: string; value: string; sub?: string }) {
  return (
    <div className="rounded-lg border border-border bg-card p-3">
      <p className="text-xs text-text-muted">{label}</p>
      <p className="mt-1 text-xl font-semibold tabular-nums text-foreground">{value}</p>
      {sub && <p className="mt-0.5 text-xs text-text-secondary">{sub}</p>}
    </div>
  );
}

export function TimeDashboardView({
  timeLogs,
  clients,
  projects,
}: {
  timeLogs: GlobalTimeLog[];
  clients: Client[];
  projects: Project[];
}) {
  const router = useRouter();
  const [sortKey, setSortKey] = useState<SortKey>("date");
  const [sortAsc, setSortAsc] = useState(false);

  // Quick log form state
  const [quickForm, setQuickForm] = useState({
    hours: "",
    description: "",
    logged_date: new Date().toISOString().split("T")[0],
    client_id: clients[0]?.id ?? NONE,
    project_id: NONE,
    billable: true,
  });
  const [quickAdding, setQuickAdding] = useState(false);

  // Stats
  const thisWeekLogs = timeLogs.filter((l) => isThisWeek(l.logged_date));
  const thisMonthLogs = timeLogs.filter((l) => isThisMonth(l.logged_date));
  const billableLogs = timeLogs.filter((l) => l.billable !== false);
  const nonBillableLogs = timeLogs.filter((l) => l.billable === false);

  // Chart data: hours by client last 30 days
  const chartData = useMemo(() => {
    const cutoff = new Date();
    cutoff.setDate(cutoff.getDate() - 30);
    cutoff.setHours(0, 0, 0, 0);
    const byClient: Record<string, number> = {};
    timeLogs.forEach((log) => {
      if (!log.logged_date) return;
      if (new Date(log.logged_date) < cutoff) return;
      const name = log.clients?.name ?? "Unknown";
      byClient[name] = (byClient[name] ?? 0) + (log.hours ?? 0);
    });
    return Object.entries(byClient)
      .map(([name, hours]) => ({ name, hours: Math.round(hours * 10) / 10 }))
      .sort((a, b) => b.hours - a.hours);
  }, [timeLogs]);

  // Sorted table
  const sorted = useMemo(() => {
    return [...timeLogs].sort((a, b) => {
      let cmp = 0;
      if (sortKey === "date") cmp = (a.logged_date ?? "").localeCompare(b.logged_date ?? "");
      if (sortKey === "client") cmp = (a.clients?.name ?? "").localeCompare(b.clients?.name ?? "");
      if (sortKey === "project") cmp = (a.projects?.name ?? "").localeCompare(b.projects?.name ?? "");
      if (sortKey === "hours") cmp = (a.hours ?? 0) - (b.hours ?? 0);
      if (sortKey === "billable") cmp = (a.billable === false ? 0 : 1) - (b.billable === false ? 0 : 1);
      return sortAsc ? cmp : -cmp;
    });
  }, [timeLogs, sortKey, sortAsc]);

  function toggleSort(key: SortKey) {
    if (sortKey === key) setSortAsc((a) => !a);
    else { setSortKey(key); setSortAsc(false); }
  }

  const quickClientProjects = projects.filter((p) => p.client_id === quickForm.client_id);

  async function handleQuickSubmit(e: React.FormEvent) {
    e.preventDefault();
    const hours = parseFloat(quickForm.hours);
    if (!hours || hours <= 0) { toast.error("Hours must be > 0"); return; }
    if (quickForm.client_id === NONE) { toast.error("Select a client"); return; }
    setQuickAdding(true);
    const supabase = createClient();
    const { error } = await supabase.from("time_logs").insert({
      client_id: quickForm.client_id,
      project_id: quickForm.project_id !== NONE ? quickForm.project_id : null,
      hours,
      description: quickForm.description.trim() || "",
      logged_date: quickForm.logged_date,
      billable: quickForm.billable,
    });
    setQuickAdding(false);
    if (error) { toast.error("Failed to log time", { description: error.message }); return; }
    toast.success(`${hours}h logged`);
    setQuickForm((f) => ({ ...f, hours: "", description: "", project_id: NONE }));
    router.refresh();
  }

  return (
    <div className="space-y-6">
      {/* Quick log form */}
      <div className="rounded-xl border border-border bg-card p-4">
        <p className="mb-3 text-sm font-medium text-foreground">Log time</p>
        <form onSubmit={handleQuickSubmit} className="flex flex-wrap items-end gap-3">
          <div className="space-y-1.5">
            <Label htmlFor="ql-hours" className="text-xs">Hours *</Label>
            <Input
              id="ql-hours"
              type="number"
              min="0.25"
              step="0.25"
              required
              placeholder="1.5"
              value={quickForm.hours}
              onChange={(e) => setQuickForm((f) => ({ ...f, hours: e.target.value }))}
              className="h-8 w-24"
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="ql-desc" className="text-xs">Description</Label>
            <Input
              id="ql-desc"
              placeholder="What did you work on?"
              value={quickForm.description}
              onChange={(e) => setQuickForm((f) => ({ ...f, description: e.target.value }))}
              className="h-8 min-w-[200px]"
            />
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs">Client</Label>
            <Select
              value={quickForm.client_id}
              onValueChange={(v) => setQuickForm((f) => ({ ...f, client_id: v ?? NONE, project_id: NONE }))}
            >
              <SelectTrigger className="h-8 w-[150px]">
                <SelectValue>
                  {(v: string) => clients.find((c) => c.id === v)?.name ?? "Select client"}
                </SelectValue>
              </SelectTrigger>
              <SelectContent>
                {clients.map((c) => (
                  <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          {quickClientProjects.length > 0 && (
            <div className="space-y-1.5">
              <Label className="text-xs">Project</Label>
              <Select
                value={quickForm.project_id}
                onValueChange={(v) => setQuickForm((f) => ({ ...f, project_id: v ?? NONE }))}
              >
                <SelectTrigger className="h-8 w-[150px]">
                  <SelectValue>
                    {(v: string) => v === NONE ? "None" : (quickClientProjects.find((p) => p.id === v)?.name ?? "None")}
                  </SelectValue>
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value={NONE}>None</SelectItem>
                  {quickClientProjects.map((p) => (
                    <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}
          <div className="space-y-1.5">
            <Label htmlFor="ql-date" className="text-xs">Date</Label>
            <Input
              id="ql-date"
              type="date"
              value={quickForm.logged_date}
              onChange={(e) => setQuickForm((f) => ({ ...f, logged_date: e.target.value }))}
              className="h-8"
            />
          </div>
          <div className="flex items-center gap-2 pb-0.5">
            <Switch
              id="ql-billable"
              size="sm"
              checked={quickForm.billable}
              onCheckedChange={(c) => setQuickForm((f) => ({ ...f, billable: c }))}
            />
            <Label htmlFor="ql-billable" className="text-xs text-text-secondary">Billable</Label>
          </div>
          <Button type="submit" size="sm" disabled={quickAdding || !quickForm.hours}>
            {quickAdding ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Plus className="h-3.5 w-3.5" />}
            Log
          </Button>
        </form>
      </div>

      {/* Summary stats */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
        <StatCard label="This week" value={fmt(sumHours(thisWeekLogs))} />
        <StatCard label="This month" value={fmt(sumHours(thisMonthLogs))} />
        <StatCard label="All time" value={fmt(sumHours(timeLogs))} />
        <StatCard
          label="Billable (all)"
          value={fmt(sumHours(billableLogs))}
          sub={`${timeLogs.length > 0 ? Math.round((billableLogs.length / timeLogs.length) * 100) : 0}% of entries`}
        />
        <StatCard label="Non-billable" value={fmt(sumHours(nonBillableLogs))} />
        <StatCard label="Total entries" value={String(timeLogs.length)} />
      </div>

      {/* Chart */}
      {chartData.length > 0 && (
        <div className="rounded-xl border border-border bg-card p-4">
          <p className="mb-4 text-sm font-medium text-foreground">Hours by client — last 30 days</p>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={chartData} margin={{ top: 0, right: 0, bottom: 0, left: -20 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.06)" />
              <XAxis
                dataKey="name"
                tick={{ fill: "#8b91a8", fontSize: 11 }}
                axisLine={false}
                tickLine={false}
              />
              <YAxis
                tick={{ fill: "#8b91a8", fontSize: 11 }}
                axisLine={false}
                tickLine={false}
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: "#1a1d27",
                  border: "1px solid #2e3347",
                  borderRadius: "8px",
                  color: "#e8eaf0",
                  fontSize: 12,
                }}
                cursor={{ fill: "rgba(255,255,255,0.04)" }}
              />
              <Bar dataKey="hours" fill="#5b7cfa" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* Log table */}
      {timeLogs.length === 0 ? (
        <ComingSoon
          icon={Clock}
          title="No time logged yet"
          description="Use the quick log form above to start tracking hours against your clients and projects."
        />
      ) : (
        <div className="overflow-hidden rounded-lg border border-border">
          <table className="w-full text-sm">
            <thead className="bg-muted/50">
              <tr>
                <th className="px-3 py-2 text-left"><SortHeader col="date" label="Date" activeKey={sortKey} onToggle={toggleSort} /></th>
                <th className="px-3 py-2 text-left"><SortHeader col="client" label="Client" activeKey={sortKey} onToggle={toggleSort} /></th>
                <th className="px-3 py-2 text-left"><SortHeader col="project" label="Project" activeKey={sortKey} onToggle={toggleSort} /></th>
                <th className="px-3 py-2 text-left text-xs font-medium uppercase tracking-wide text-text-muted">Task</th>
                <th className="px-3 py-2 text-left text-xs font-medium uppercase tracking-wide text-text-muted">Description</th>
                <th className="px-3 py-2 text-right"><SortHeader col="hours" label="Hours" activeKey={sortKey} onToggle={toggleSort} /></th>
                <th className="px-3 py-2 text-center"><SortHeader col="billable" label="Bill." activeKey={sortKey} onToggle={toggleSort} /></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {sorted.map((log) => (
                <tr key={log.id} className="transition-colors hover:bg-muted/30">
                  <td className="px-3 py-2 text-text-secondary">
                    <RelativeDate date={log.logged_date} />
                  </td>
                  <td className="px-3 py-2 text-text-secondary">
                    {log.clients?.name ?? <span className="text-text-muted">—</span>}
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
                  <td className="px-3 py-2 text-right tabular-nums font-medium text-foreground">
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
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
