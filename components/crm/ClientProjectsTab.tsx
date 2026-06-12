"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import {
  AlertTriangle,
  ChevronDown,
  Clock,
  Lock,
  Plus,
  ScrollText,
  Trash2,
} from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ComingSoon } from "@/components/crm/ComingSoon";
import { StatusBadge } from "@/components/crm/StatusBadge";
import { RelativeDate } from "@/components/crm/RelativeDate";
import { AddProjectSheet } from "@/components/crm/AddProjectSheet";
import { ConfirmDialog } from "@/components/crm/ConfirmDialog";
import { formatLabel } from "@/lib/format";
import { daysUntil } from "@/lib/dates";
import { cn } from "@/lib/utils";
import type { Tables } from "@/lib/supabase/database.types";
import type { ProjectWithTasks } from "@/components/crm/ClientDetailView";

type Task = Tables<"tasks">;

const TASK_STATUSES = ["todo", "in_progress", "blocked", "review", "done"] as const;
const TASK_PRIORITIES = ["low", "medium", "high", "urgent"] as const;

const PRIORITY_COLORS: Record<string, string> = {
  low: "text-text-muted",
  medium: "text-text-secondary",
  high: "text-warning",
  urgent: "text-danger",
};

export function ClientProjectsTab({
  clientId,
  projects,
  systems,
}: {
  clientId: string;
  projects: ProjectWithTasks[];
  systems: Tables<"client_systems">[];
}) {
  const [addOpen, setAddOpen] = useState(false);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-sm text-text-secondary">
          {projects.length} project{projects.length === 1 ? "" : "s"} for this client
        </p>
        <Button onClick={() => setAddOpen(true)}>
          <Plus className="h-4 w-4" />
          Add project
        </Button>
      </div>

      {projects.length === 0 ? (
        <ComingSoon
          icon={ScrollText}
          title="No projects yet"
          description="Create a project to track phases, hours, deadlines, and tasks all in one place."
        />
      ) : (
        <div className="space-y-3">
          {projects.map((project) => (
            <ProjectCard key={project.id} project={project} clientId={clientId} />
          ))}
        </div>
      )}

      <AddProjectSheet
        clientId={clientId}
        systems={systems}
        open={addOpen}
        onOpenChange={setAddOpen}
      />
    </div>
  );
}

function progressPct(actual: number | null, estimated: number | null): number {
  if (!estimated || estimated === 0) return 0;
  return Math.min(100, Math.round(((actual ?? 0) / estimated) * 100));
}

function ProjectCard({ project, clientId }: { project: ProjectWithTasks; clientId: string }) {
  const router = useRouter();
  const [expanded, setExpanded] = useState(false);
  const [addingTask, setAddingTask] = useState(false);
  const [newTaskTitle, setNewTaskTitle] = useState("");
  const [addingTaskLoading, setAddingTaskLoading] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [deleting, setDeleting] = useState(false);

  async function handleDeleteProject() {
    setDeleting(true);
    const supabase = createClient();
    const { error } = await supabase.from("projects").delete().eq("id", project.id);
    setDeleting(false);
    if (error) { toast.error("Failed to delete project", { description: error.message }); return; }
    toast.success(`"${project.name}" deleted`);
    setDeleteOpen(false);
    router.refresh();
  }

  const pct = progressPct(project.actual_hours, project.estimated_hours);
  const deadlineDays = daysUntil(project.deadline);
  const deadlineOverdue = deadlineDays !== null && deadlineDays < 0;
  const deadlineSoon = deadlineDays !== null && deadlineDays >= 0 && deadlineDays < 7;
  const openTasks = project.tasks.filter((t) => t.status !== "done");
  const scopeCreepTasks = project.tasks.filter((t) => t.is_scope_creep && t.status !== "done");

  async function handleAddTask(e: React.FormEvent) {
    e.preventDefault();
    const title = newTaskTitle.trim();
    if (!title) return;
    setAddingTaskLoading(true);
    const supabase = createClient();
    const { error } = await supabase.from("tasks").insert({
      client_id: clientId,
      project_id: project.id,
      title,
      status: "todo",
      priority: "medium",
      is_scope_creep: project.scope_locked ?? false,
    });
    setAddingTaskLoading(false);
    if (error) {
      toast.error("Failed to add task", { description: error.message });
      return;
    }
    setNewTaskTitle("");
    setAddingTask(false);
    router.refresh();
  }

  return (
    <div className="overflow-hidden rounded-xl border border-border bg-card">
      <button
        type="button"
        onClick={() => setExpanded((e) => !e)}
        className="group flex w-full items-start justify-between gap-4 px-4 py-3 text-left transition-colors hover:bg-muted/40"
      >
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <p className="font-medium text-foreground">{project.name}</p>
            <StatusBadge status={project.status ?? "scoping"} />
            {project.scope_locked && (
              <span className="inline-flex items-center gap-1 rounded-full border border-border bg-muted px-1.5 py-0.5 text-[11px] text-text-muted">
                <Lock className="h-3 w-3" />
                Scope locked
              </span>
            )}
            {scopeCreepTasks.length > 0 && (
              <span className="inline-flex items-center gap-1 rounded-full border border-warning/30 bg-warning/10 px-1.5 py-0.5 text-[11px] text-warning">
                <AlertTriangle className="h-3 w-3" />
                {scopeCreepTasks.length} scope creep
              </span>
            )}
          </div>
          {project.phase && (
            <p className="mt-0.5 text-sm text-text-secondary">{project.phase}</p>
          )}

          <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-text-muted">
            {project.estimated_hours && (
              <span className="inline-flex items-center gap-1">
                <Clock className="h-3 w-3" />
                {project.actual_hours ?? 0}h / {project.estimated_hours}h ({pct}%)
              </span>
            )}
            {project.deadline && (
              <span className={cn(deadlineOverdue && "text-danger", deadlineSoon && !deadlineOverdue && "text-warning")}>
                Due <RelativeDate date={project.deadline} className={cn(deadlineOverdue && "text-danger", deadlineSoon && !deadlineOverdue && "text-warning")} />
              </span>
            )}
            <span>{openTasks.length} open task{openTasks.length === 1 ? "" : "s"}</span>
          </div>

          {project.estimated_hours && (
            <div className="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-muted">
              <div
                className={cn(
                  "h-full rounded-full transition-all",
                  pct >= 100 ? "bg-danger" : pct >= 75 ? "bg-warning" : "bg-primary"
                )}
                style={{ width: `${pct}%` }}
              />
            </div>
          )}
        </div>

        <div className="flex items-center gap-1">
          <Button
            variant="ghost"
            size="icon-sm"
            onClick={(e) => { e.stopPropagation(); setDeleteOpen(true); }}
            aria-label="Delete project"
            className="text-text-muted opacity-0 transition-opacity hover:text-danger group-hover:opacity-100"
          >
            <Trash2 className="h-3.5 w-3.5" />
          </Button>
          <ChevronDown className={cn("h-4 w-4 shrink-0 text-text-muted transition-transform", expanded && "rotate-180")} />
        </div>
      </button>

      <ConfirmDialog
        open={deleteOpen}
        title="Delete project?"
        description={`Delete "${project.name}" and all its tasks and time logs? This cannot be undone.`}
        confirmLabel="Delete project"
        loading={deleting}
        onConfirm={handleDeleteProject}
        onCancel={() => setDeleteOpen(false)}
      />

      {expanded && (
        <div className="border-t border-border">
          {project.tasks.length === 0 && !addingTask ? (
            <div className="px-4 py-3 text-sm text-text-muted">No tasks yet.</div>
          ) : (
            <ul className="divide-y divide-border">
              {project.tasks.map((task) => (
                <TaskRow key={task.id} task={task} projectScopeLocked={project.scope_locked ?? false} />
              ))}
            </ul>
          )}

          <div className="border-t border-border px-4 py-2">
            {addingTask ? (
              <form onSubmit={handleAddTask} className="flex items-center gap-2">
                <Input
                  autoFocus
                  value={newTaskTitle}
                  onChange={(e) => setNewTaskTitle(e.target.value)}
                  placeholder="Task title..."
                  className="h-8 flex-1 text-sm"
                  disabled={addingTaskLoading}
                />
                <Button type="submit" size="sm" disabled={addingTaskLoading || !newTaskTitle.trim()}>
                  Add
                </Button>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => { setAddingTask(false); setNewTaskTitle(""); }}
                >
                  Cancel
                </Button>
              </form>
            ) : (
              <button
                type="button"
                onClick={() => setAddingTask(true)}
                className="inline-flex items-center gap-1.5 text-sm text-text-muted transition-colors hover:text-foreground"
              >
                <Plus className="h-3.5 w-3.5" />
                Add task
                {project.scope_locked && (
                  <span className="text-xs text-warning">(will be flagged as scope creep)</span>
                )}
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

function TaskRow({ task, projectScopeLocked }: { task: Task; projectScopeLocked: boolean }) {
  const router = useRouter();
  const [saving, setSaving] = useState(false);
  const [hoursValue, setHoursValue] = useState(String(task.actual_hours ?? ""));
  const [deleting, setDeleting] = useState(false);

  async function handleDeleteTask() {
    setDeleting(true);
    const supabase = createClient();
    const { error } = await supabase.from("tasks").delete().eq("id", task.id);
    setDeleting(false);
    if (error) { toast.error("Failed to delete task", { description: error.message }); return; }
    router.refresh();
  }

  async function updateTask(patch: Partial<Pick<Task, "status" | "priority" | "is_scope_creep" | "actual_hours">>) {
    if (saving) return;
    setSaving(true);
    const supabase = createClient();
    const { error } = await supabase.from("tasks").update(patch).eq("id", task.id);
    setSaving(false);
    if (error) {
      toast.error("Failed to update task", { description: error.message });
      return;
    }
    router.refresh();
  }

  async function saveHours() {
    const hours = parseFloat(hoursValue);
    if (isNaN(hours) || hours < 0) return;
    if (hours === (task.actual_hours ?? 0)) return;
    await updateTask({ actual_hours: hours });
  }

  const isDone = task.status === "done";

  return (
    <li className={cn("group flex items-center gap-2 px-4 py-2 text-sm transition-colors hover:bg-muted/30", isDone && "opacity-60")}>
      <button
        type="button"
        onClick={() => updateTask({ status: isDone ? "todo" : "done" })}
        className={cn(
          "flex h-4 w-4 shrink-0 items-center justify-center rounded border transition-colors",
          isDone ? "border-primary bg-primary text-primary-foreground" : "border-border hover:border-primary/50"
        )}
        aria-label={isDone ? "Mark incomplete" : "Mark complete"}
        disabled={saving}
      >
        {isDone && (
          <svg viewBox="0 0 12 12" className="h-2.5 w-2.5" fill="none" stroke="currentColor" strokeWidth={2}>
            <path d="M2 6l3 3 5-5" />
          </svg>
        )}
      </button>

      <span className={cn("flex-1 truncate", isDone && "line-through", task.is_scope_creep && "text-warning")}>
        {task.title}
        {task.is_scope_creep && <span className="ml-1 text-[10px] text-warning">(scope creep)</span>}
      </span>

      <select
        value={task.status ?? "todo"}
        onChange={(e) => updateTask({ status: e.target.value })}
        disabled={saving}
        className="rounded border border-border bg-muted px-1.5 py-0.5 text-xs text-text-secondary focus:outline-none"
      >
        {TASK_STATUSES.map((s) => (
          <option key={s} value={s}>{formatLabel(s)}</option>
        ))}
      </select>

      <select
        value={task.priority ?? "medium"}
        onChange={(e) => updateTask({ priority: e.target.value })}
        disabled={saving}
        className={cn(
          "rounded border border-border bg-muted px-1.5 py-0.5 text-xs focus:outline-none",
          PRIORITY_COLORS[task.priority ?? "medium"]
        )}
      >
        {TASK_PRIORITIES.map((p) => (
          <option key={p} value={p}>{formatLabel(p)}</option>
        ))}
      </select>

      <div className="flex items-center gap-0.5">
        <input
          type="number"
          min="0"
          step="0.5"
          value={hoursValue}
          onChange={(e) => setHoursValue(e.target.value)}
          onBlur={saveHours}
          placeholder="0h"
          className="w-14 rounded border border-border bg-muted px-1.5 py-0.5 text-right text-xs text-text-secondary focus:outline-none focus:ring-1 focus:ring-ring"
        />
        <span className="text-xs text-text-muted">h</span>
      </div>

      {!task.is_scope_creep && projectScopeLocked && (
        <button
          type="button"
          onClick={() => updateTask({ is_scope_creep: true })}
          disabled={saving}
          className="text-xs text-text-muted transition-colors hover:text-warning"
          title="Flag as scope creep"
        >
          <AlertTriangle className="h-3.5 w-3.5" />
        </button>
      )}
      {task.is_scope_creep && (
        <button
          type="button"
          onClick={() => updateTask({ is_scope_creep: false })}
          disabled={saving}
          className="text-xs text-warning transition-colors hover:text-text-muted"
          title="Remove scope creep flag"
        >
          <AlertTriangle className="h-3.5 w-3.5" />
        </button>
      )}

      <button
        type="button"
        onClick={handleDeleteTask}
        disabled={deleting || saving}
        className="text-text-muted opacity-0 transition-opacity hover:text-danger group-hover:opacity-100"
        title="Delete task"
      >
        <Trash2 className="h-3.5 w-3.5" />
      </button>
    </li>
  );
}
