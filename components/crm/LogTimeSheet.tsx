"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { ProjectWithTasks } from "@/components/crm/ClientDetailView";

const NONE = "__none__";

const initialState = {
  hours: "",
  description: "",
  logged_date: new Date().toISOString().split("T")[0],
  project_id: NONE,
  task_id: NONE,
  billable: true,
};

export function LogTimeSheet({
  clientId,
  clientName,
  projects,
  open,
  onOpenChange,
}: {
  clientId: string;
  clientName: string;
  projects: ProjectWithTasks[];
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const router = useRouter();
  const [submitting, setSubmitting] = useState(false);
  const [form, setForm] = useState(initialState);

  function updateStr<K extends keyof typeof initialState>(key: K, value: string) {
    setForm((f) => ({ ...f, [key]: value }));
  }

  function reset() {
    setForm({ ...initialState, logged_date: new Date().toISOString().split("T")[0] });
  }

  const selectedProject = projects.find((p) => p.id === form.project_id);
  const availableTasks = selectedProject?.tasks ?? [];

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const hours = parseFloat(form.hours);
    if (!hours || hours <= 0) {
      toast.error("Hours must be greater than 0");
      return;
    }

    setSubmitting(true);
    const supabase = createClient();

    const { error } = await supabase.from("time_logs").insert({
      client_id: clientId,
      project_id: form.project_id !== NONE ? form.project_id : null,
      task_id: form.task_id !== NONE ? form.task_id : null,
      hours,
      description: form.description.trim() || "",
      logged_date: form.logged_date,
      billable: form.billable,
    });

    setSubmitting(false);

    if (error) {
      toast.error("Failed to log time", { description: error.message });
      return;
    }

    toast.success(`${hours}h logged`);
    reset();
    onOpenChange(false);
    router.refresh();
  }

  return (
    <Sheet
      open={open}
      onOpenChange={(next) => {
        onOpenChange(next);
        if (!next) reset();
      }}
    >
      <SheetContent className="flex w-full flex-col gap-0 sm:max-w-md">
        <SheetHeader>
          <SheetTitle>Log time</SheetTitle>
          <SheetDescription>Log hours for {clientName}.</SheetDescription>
        </SheetHeader>

        <form onSubmit={handleSubmit} className="flex flex-1 flex-col overflow-hidden">
          <div className="flex-1 space-y-5 overflow-y-auto px-4 py-2">
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label htmlFor="time-hours">Hours *</Label>
                <Input
                  id="time-hours"
                  type="number"
                  min="0.25"
                  step="0.25"
                  required
                  placeholder="e.g. 1.5"
                  value={form.hours}
                  onChange={(e) => updateStr("hours", e.target.value)}
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="time-date">Date</Label>
                <Input
                  id="time-date"
                  type="date"
                  value={form.logged_date}
                  onChange={(e) => updateStr("logged_date", e.target.value)}
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="time-desc">Description</Label>
              <Input
                id="time-desc"
                placeholder="What did you work on?"
                value={form.description}
                onChange={(e) => updateStr("description", e.target.value)}
              />
            </div>

            {projects.length > 0 && (
              <div className="space-y-1.5">
                <Label>Project</Label>
                <Select
                  value={form.project_id}
                  onValueChange={(v) => {
                    updateStr("project_id", v ?? NONE);
                    updateStr("task_id", NONE);
                  }}
                >
                  <SelectTrigger className="w-full">
                    <SelectValue>
                      {(v: string) => {
                        if (v === NONE) return "None";
                        return projects.find((p) => p.id === v)?.name ?? "None";
                      }}
                    </SelectValue>
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value={NONE}>None</SelectItem>
                    {projects.map((p) => (
                      <SelectItem key={p.id} value={p.id}>
                        {p.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}

            {availableTasks.length > 0 && (
              <div className="space-y-1.5">
                <Label>Task</Label>
                <Select value={form.task_id} onValueChange={(v) => updateStr("task_id", v ?? NONE)}>
                  <SelectTrigger className="w-full">
                    <SelectValue>
                      {(v: string) => {
                        if (v === NONE) return "None";
                        return availableTasks.find((t) => t.id === v)?.title ?? "None";
                      }}
                    </SelectValue>
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value={NONE}>None</SelectItem>
                    {availableTasks.map((t) => (
                      <SelectItem key={t.id} value={t.id}>
                        {t.title}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}

            <div className="flex items-center justify-between rounded-lg border border-border p-3">
              <div>
                <Label htmlFor="time-billable">Billable</Label>
                <p className="text-xs text-text-muted">Count toward revenue calculations.</p>
              </div>
              <Switch
                id="time-billable"
                checked={form.billable}
                onCheckedChange={(checked) => setForm((f) => ({ ...f, billable: checked }))}
              />
            </div>
          </div>

          <SheetFooter className="border-t border-border">
            <Button type="submit" disabled={submitting} className="w-full">
              {submitting ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Logging...
                </>
              ) : (
                "Log time"
              )}
            </Button>
          </SheetFooter>
        </form>
      </SheetContent>
    </Sheet>
  );
}
