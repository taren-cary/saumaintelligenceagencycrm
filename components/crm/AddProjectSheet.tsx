"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { formatLabel } from "@/lib/format";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
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
import type { Tables } from "@/lib/supabase/database.types";

const STATUS_OPTIONS = ["scoping", "in_progress", "review", "complete", "on_hold", "cancelled"];

const initialState = {
  name: "",
  description: "",
  status: "scoping",
  phase: "",
  start_date: "",
  deadline: "",
  estimated_hours: "",
  estimated_value: "",
  scope_locked: false,
  system_id: "",
  notes: "",
};

export function AddProjectSheet({
  clientId,
  systems,
  open,
  onOpenChange,
}: {
  clientId: string;
  systems: Tables<"client_systems">[];
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const router = useRouter();
  const [submitting, setSubmitting] = useState(false);
  const [form, setForm] = useState(initialState);

  function updateStr<K extends keyof typeof initialState>(key: K, value: string | null) {
    setForm((f) => ({ ...f, [key]: value ?? "" }));
  }

  function updateBool<K extends keyof typeof initialState>(key: K, value: boolean) {
    setForm((f) => ({ ...f, [key]: value }));
  }

  function reset() {
    setForm(initialState);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.name.trim()) {
      toast.error("Project name is required");
      return;
    }

    setSubmitting(true);
    const supabase = createClient();

    const { error } = await supabase.from("projects").insert({
      client_id: clientId,
      name: form.name.trim(),
      description: form.description.trim() || null,
      status: form.status,
      phase: form.phase.trim() || null,
      start_date: form.start_date || null,
      deadline: form.deadline || null,
      estimated_hours: form.estimated_hours ? Number(form.estimated_hours) : null,
      estimated_value: form.estimated_value ? Number(form.estimated_value) : null,
      scope_locked: form.scope_locked,
      system_id: form.system_id || null,
      notes: form.notes.trim() || null,
    });

    setSubmitting(false);

    if (error) {
      toast.error("Failed to create project", { description: error.message });
      return;
    }

    toast.success(`${form.name.trim()} created`);
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
      <SheetContent className="flex w-full flex-col gap-0 sm:max-w-lg">
        <SheetHeader>
          <SheetTitle>Add project</SheetTitle>
          <SheetDescription>
            Track a project phase, its hours, deadline, and tasks in one place.
          </SheetDescription>
        </SheetHeader>

        <form onSubmit={handleSubmit} className="flex flex-1 flex-col overflow-hidden">
          <div className="flex-1 space-y-6 overflow-y-auto px-4 py-2">
            <section className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div className="col-span-2 space-y-1.5">
                  <Label htmlFor="proj-name">Name *</Label>
                  <Input
                    id="proj-name"
                    required
                    placeholder="e.g. Voice Bot Phase 2"
                    value={form.name}
                    onChange={(e) => updateStr("name", e.target.value)}
                  />
                </div>
                <div className="col-span-2 space-y-1.5">
                  <Label htmlFor="proj-description">Description</Label>
                  <Input
                    id="proj-description"
                    value={form.description}
                    onChange={(e) => updateStr("description", e.target.value)}
                  />
                </div>
                <div className="space-y-1.5">
                  <Label>Status</Label>
                  <Select value={form.status} onValueChange={(v) => updateStr("status", v)}>
                    <SelectTrigger className="w-full">
                      <SelectValue>{(v: string) => formatLabel(v)}</SelectValue>
                    </SelectTrigger>
                    <SelectContent>
                      {STATUS_OPTIONS.map((s) => (
                        <SelectItem key={s} value={s}>
                          {formatLabel(s)}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="proj-phase">Phase label</Label>
                  <Input
                    id="proj-phase"
                    placeholder='e.g. "Phase 1: Voice Bot"'
                    value={form.phase}
                    onChange={(e) => updateStr("phase", e.target.value)}
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="proj-start">Start date</Label>
                  <Input
                    id="proj-start"
                    type="date"
                    value={form.start_date}
                    onChange={(e) => updateStr("start_date", e.target.value)}
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="proj-deadline">Deadline</Label>
                  <Input
                    id="proj-deadline"
                    type="date"
                    value={form.deadline}
                    onChange={(e) => updateStr("deadline", e.target.value)}
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="proj-est-hours">Estimated hours</Label>
                  <Input
                    id="proj-est-hours"
                    type="number"
                    min="0"
                    step="0.5"
                    value={form.estimated_hours}
                    onChange={(e) => updateStr("estimated_hours", e.target.value)}
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="proj-est-value">Estimated value ($)</Label>
                  <Input
                    id="proj-est-value"
                    type="number"
                    min="0"
                    step="0.01"
                    value={form.estimated_value}
                    onChange={(e) => updateStr("estimated_value", e.target.value)}
                  />
                </div>
                {systems.length > 0 && (
                  <div className="col-span-2 space-y-1.5">
                    <Label>Linked system (optional)</Label>
                    <Select value={form.system_id} onValueChange={(v) => updateStr("system_id", v ?? "")}>
                      <SelectTrigger className="w-full">
                        <SelectValue placeholder="None">
                          {(v: string) => {
                            if (!v) return "None";
                            return systems.find((s) => s.id === v)?.name ?? "None";
                          }}
                        </SelectValue>
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="">None</SelectItem>
                        {systems.map((s) => (
                          <SelectItem key={s.id} value={s.id}>
                            {s.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                )}
              </div>
            </section>

            <section className="space-y-3 rounded-lg border border-border p-3">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <Label htmlFor="proj-scope-locked">Scope locked</Label>
                  <p className="text-xs text-text-muted">
                    New tasks added after locking will be flagged as scope creep.
                  </p>
                </div>
                <Switch
                  id="proj-scope-locked"
                  checked={form.scope_locked}
                  onCheckedChange={(checked) => updateBool("scope_locked", checked)}
                />
              </div>
            </section>

            <section className="space-y-3">
              <h3 className="text-xs font-semibold uppercase tracking-wide text-text-muted">Notes</h3>
              <Textarea
                rows={3}
                placeholder="Any context or constraints for this project..."
                value={form.notes}
                onChange={(e) => updateStr("notes", e.target.value)}
              />
            </section>
          </div>

          <SheetFooter className="border-t border-border">
            <Button type="submit" disabled={submitting} className="w-full">
              {submitting ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Creating...
                </>
              ) : (
                "Create project"
              )}
            </Button>
          </SheetFooter>
        </form>
      </SheetContent>
    </Sheet>
  );
}
