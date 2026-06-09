"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { toast } from "sonner";
import {
  AlertTriangle,
  CheckSquare,
  Plus,
  Search,
} from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ComingSoon } from "@/components/crm/ComingSoon";
import { RelativeDate } from "@/components/crm/RelativeDate";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { formatLabel } from "@/lib/format";
import { daysUntil } from "@/lib/dates";
import { cn } from "@/lib/utils";
import type { Tables } from "@/lib/supabase/database.types";

export type TaskRow = Tables<"tasks"> & {
  clients: { id: string; name: string } | null;
};

type Client = { id: string; name: string };

const ALL = "all";
const TASK_STATUSES = ["todo", "in_progress", "blocked", "review", "done"];
const TASK_PRIORITIES = ["low", "medium", "high", "urgent"];

const PRIORITY_COLORS: Record<string, string> = {
  low: "text-text-muted",
  medium: "text-text-secondary",
  high: "text-warning",
  urgent: "text-danger",
};


export function TasksView({ tasks, clients }: { tasks: TaskRow[]; clients: Client[] }) {
  const router = useRouter();
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState(ALL);
  const [priorityFilter, setPriorityFilter] = useState(ALL);
  const [clientFilter, setClientFilter] = useState(ALL);
  const [scopeCreepOnly, setScopeCreepOnly] = useState(false);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [bulkSaving, setBulkSaving] = useState(false);

  // Quick-add state
  const [quickTitle, setQuickTitle] = useState("");
  const [quickClientId, setQuickClientId] = useState(clients[0]?.id ?? "");
  const [quickAdding, setQuickAdding] = useState(false);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return tasks.filter((t) => {
      if (statusFilter !== ALL && t.status !== statusFilter) return false;
      if (priorityFilter !== ALL && t.priority !== priorityFilter) return false;
      if (clientFilter !== ALL && t.clients?.id !== clientFilter) return false;
      if (scopeCreepOnly && !t.is_scope_creep) return false;
      if (q && !t.title.toLowerCase().includes(q)) return false;
      return true;
    });
  }, [tasks, search, statusFilter, priorityFilter, clientFilter, scopeCreepOnly]);

  const allSelected = filtered.length > 0 && filtered.every((t) => selected.has(t.id));

  function toggleAll() {
    if (allSelected) {
      setSelected((s) => {
        const next = new Set(s);
        filtered.forEach((t) => next.delete(t.id));
        return next;
      });
    } else {
      setSelected((s) => {
        const next = new Set(s);
        filtered.forEach((t) => next.add(t.id));
        return next;
      });
    }
  }

  function toggleOne(id: string) {
    setSelected((s) => {
      const next = new Set(s);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  }

  async function bulkMarkDone() {
    const ids = Array.from(selected);
    if (!ids.length) return;
    setBulkSaving(true);
    const supabase = createClient();
    const { error } = await supabase
      .from("tasks")
      .update({ status: "done", completed_at: new Date().toISOString() })
      .in("id", ids);
    setBulkSaving(false);
    if (error) {
      toast.error("Failed to update tasks", { description: error.message });
      return;
    }
    toast.success(`${ids.length} task${ids.length === 1 ? "" : "s"} marked done`);
    setSelected(new Set());
    router.refresh();
  }

  async function updateTaskStatus(id: string, status: string) {
    const supabase = createClient();
    const completedAt = status === "done" ? new Date().toISOString() : undefined;
    const { error } = await supabase
      .from("tasks")
      .update({ status, ...(completedAt !== undefined && { completed_at: completedAt }) })
      .eq("id", id);
    if (error) {
      toast.error("Failed to update task", { description: error.message });
      return;
    }
    router.refresh();
  }

  async function handleQuickAdd(e: React.FormEvent) {
    e.preventDefault();
    const title = quickTitle.trim();
    if (!title || !quickClientId) return;
    setQuickAdding(true);
    const supabase = createClient();
    const { error } = await supabase.from("tasks").insert({
      client_id: quickClientId,
      title,
      status: "todo",
      priority: "medium",
    });
    setQuickAdding(false);
    if (error) {
      toast.error("Failed to add task", { description: error.message });
      return;
    }
    setQuickTitle("");
    router.refresh();
  }

  return (
    <div className="space-y-4">
      {/* Quick add */}
      {clients.length > 0 && (
        <form onSubmit={handleQuickAdd} className="flex flex-wrap items-center gap-2 rounded-xl border border-border bg-card p-3">
          <Plus className="h-4 w-4 shrink-0 text-text-muted" />
          <Input
            value={quickTitle}
            onChange={(e) => setQuickTitle(e.target.value)}
            placeholder="Add a task..."
            className="h-8 flex-1 min-w-[180px] border-0 bg-transparent px-0 shadow-none focus-visible:ring-0"
            disabled={quickAdding}
          />
          <span className="text-sm text-text-muted">for</span>
          <Select value={quickClientId} onValueChange={(v) => v && setQuickClientId(v)}>
            <SelectTrigger className="h-8 w-[160px]">
              <SelectValue>
                {(v: string) => clients.find((c) => c.id === v)?.name ?? "Client"}
              </SelectValue>
            </SelectTrigger>
            <SelectContent>
              {clients.map((c) => (
                <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Button type="submit" size="sm" disabled={quickAdding || !quickTitle.trim()}>
            Add
          </Button>
        </form>
      )}

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-2">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="pointer-events-none absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-text-muted" />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search tasks..."
            className="pl-8"
          />
        </div>

        {clients.length > 0 && (
          <Select value={clientFilter} onValueChange={(v) => setClientFilter(v ?? ALL)}>
            <SelectTrigger className="w-[150px]">
              <SelectValue placeholder="All clients">
                {(v: string) => v === ALL ? "All clients" : (clients.find((c) => c.id === v)?.name ?? "All clients")}
              </SelectValue>
            </SelectTrigger>
            <SelectContent>
              <SelectItem value={ALL}>All clients</SelectItem>
              {clients.map((c) => (
                <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        )}

        <Select value={statusFilter} onValueChange={(v) => setStatusFilter(v ?? ALL)}>
          <SelectTrigger className="w-[140px]">
            <SelectValue placeholder="All statuses">
              {(v: string) => v === ALL ? "All statuses" : formatLabel(v)}
            </SelectValue>
          </SelectTrigger>
          <SelectContent>
            <SelectItem value={ALL}>All statuses</SelectItem>
            {TASK_STATUSES.map((s) => (
              <SelectItem key={s} value={s}>{formatLabel(s)}</SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select value={priorityFilter} onValueChange={(v) => setPriorityFilter(v ?? ALL)}>
          <SelectTrigger className="w-[130px]">
            <SelectValue placeholder="All priorities">
              {(v: string) => v === ALL ? "All priorities" : formatLabel(v)}
            </SelectValue>
          </SelectTrigger>
          <SelectContent>
            <SelectItem value={ALL}>All priorities</SelectItem>
            {TASK_PRIORITIES.map((p) => (
              <SelectItem key={p} value={p}>{formatLabel(p)}</SelectItem>
            ))}
          </SelectContent>
        </Select>

        <button
          type="button"
          onClick={() => setScopeCreepOnly((v) => !v)}
          className={cn(
            "inline-flex items-center gap-1.5 rounded-md border px-2.5 py-1.5 text-sm transition-colors",
            scopeCreepOnly
              ? "border-warning/40 bg-warning/10 text-warning"
              : "border-border text-text-secondary hover:border-foreground/20 hover:text-foreground"
          )}
        >
          <AlertTriangle className="h-3.5 w-3.5" />
          Scope creep only
        </button>
      </div>

      {/* Bulk action bar */}
      {selected.size > 0 && (
        <div className="flex items-center gap-3 rounded-lg border border-border bg-card px-3 py-2 text-sm">
          <span className="text-text-secondary">{selected.size} selected</span>
          <Button size="sm" variant="secondary" onClick={bulkMarkDone} disabled={bulkSaving}>
            Mark done
          </Button>
          <button
            type="button"
            onClick={() => setSelected(new Set())}
            className="ml-auto text-xs text-text-muted transition-colors hover:text-foreground"
          >
            Clear
          </button>
        </div>
      )}

      {/* Task list */}
      {filtered.length === 0 ? (
        tasks.length === 0 ? (
          <ComingSoon
            icon={CheckSquare}
            title="No tasks yet"
            description="Tasks created from client project tabs will appear here. Or add one using the quick-add form above."
          />
        ) : (
          <ComingSoon
            icon={Search}
            title="No tasks match your filters"
            description="Try adjusting your search or filters."
          />
        )
      ) : (
        <div className="overflow-hidden rounded-lg border border-border">
          <table className="w-full text-sm">
            <thead className="bg-muted/50">
              <tr>
                <th className="w-8 px-3 py-2">
                  <input
                    type="checkbox"
                    checked={allSelected}
                    onChange={toggleAll}
                    className="rounded border-border accent-primary"
                  />
                </th>
                <th className="px-3 py-2 text-left text-xs font-medium uppercase tracking-wide text-text-muted">Task</th>
                <th className="px-3 py-2 text-left text-xs font-medium uppercase tracking-wide text-text-muted">Client</th>
                <th className="px-3 py-2 text-left text-xs font-medium uppercase tracking-wide text-text-muted">Priority</th>
                <th className="px-3 py-2 text-left text-xs font-medium uppercase tracking-wide text-text-muted">Due</th>
                <th className="px-3 py-2 text-left text-xs font-medium uppercase tracking-wide text-text-muted">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {filtered.map((task) => {
                const dueDays = daysUntil(task.due_date);
                const overdue = dueDays !== null && dueDays < 0 && task.status !== "done";
                const dueSoon = dueDays !== null && dueDays >= 0 && dueDays < 3 && task.status !== "done";
                return (
                  <tr key={task.id} className="group transition-colors hover:bg-muted/30">
                    <td className="px-3 py-2">
                      <input
                        type="checkbox"
                        checked={selected.has(task.id)}
                        onChange={() => toggleOne(task.id)}
                        className="rounded border-border accent-primary"
                      />
                    </td>
                    <td className="px-3 py-2">
                      <div className="flex items-center gap-1.5">
                        {task.is_scope_creep && (
                          <AlertTriangle className="h-3.5 w-3.5 shrink-0 text-warning" />
                        )}
                        <span className={cn("font-medium text-foreground", task.status === "done" && "text-text-muted line-through")}>
                          {task.title}
                        </span>
                      </div>
                    </td>
                    <td className="px-3 py-2">
                      {task.clients ? (
                        <Link
                          href={`/clients/${task.clients.id}?tab=projects`}
                          className="text-text-secondary transition-colors hover:text-foreground hover:underline"
                        >
                          {task.clients.name}
                        </Link>
                      ) : (
                        <span className="text-text-muted">—</span>
                      )}
                    </td>
                    <td className="px-3 py-2">
                      <span className={cn("font-medium", PRIORITY_COLORS[task.priority ?? "medium"])}>
                        {formatLabel(task.priority ?? "medium")}
                      </span>
                    </td>
                    <td className="px-3 py-2">
                      {task.due_date ? (
                        <RelativeDate
                          date={task.due_date}
                          className={cn(overdue && "font-medium text-danger", dueSoon && "font-medium text-warning")}
                        />
                      ) : (
                        <span className="text-text-muted">—</span>
                      )}
                    </td>
                    <td className="px-3 py-2">
                      <select
                        value={task.status ?? "todo"}
                        onChange={(e) => updateTaskStatus(task.id, e.target.value)}
                        className="rounded border border-border bg-muted px-1.5 py-0.5 text-xs text-text-secondary focus:outline-none"
                      >
                        {TASK_STATUSES.map((s) => (
                          <option key={s} value={s}>{formatLabel(s)}</option>
                        ))}
                      </select>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
