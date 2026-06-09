"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
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
import { formatLabel } from "@/lib/format";
import type { Tables } from "@/lib/supabase/database.types";

const STAGES = ["lead", "contacted", "discovery", "proposal", "negotiation"] as const;
const SOURCES = ["referral", "inbound", "outbound", "social", "other"] as const;

type Prospect = Tables<"clients">;

export function EditProspectSheet({
  prospect,
  open,
  onOpenChange,
}: {
  prospect: Prospect;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const router = useRouter();
  const [submitting, setSubmitting] = useState(false);

  const [form, setForm] = useState({
    pipeline_stage: prospect.pipeline_stage ?? "lead",
    estimated_value: prospect.estimated_value != null ? String(prospect.estimated_value) : "",
    probability: prospect.probability != null ? String(prospect.probability) : "50",
    expected_close: prospect.expected_close ?? "",
    source: prospect.source ?? "",
    next_action: prospect.next_action ?? "",
    next_action_date: prospect.next_action_date ?? "",
    platform_notes: prospect.platform_notes ?? "",
  });

  function update<K extends keyof typeof form>(key: K, value: string) {
    setForm((f) => ({ ...f, [key]: value }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    const supabase = createClient();
    const { error } = await supabase
      .from("clients")
      .update({
        pipeline_stage: form.pipeline_stage,
        estimated_value: form.estimated_value ? parseFloat(form.estimated_value) : null,
        probability: form.probability ? parseInt(form.probability, 10) : null,
        expected_close: form.expected_close || null,
        source: form.source || null,
        next_action: form.next_action.trim() || null,
        next_action_date: form.next_action_date || null,
        platform_notes: form.platform_notes.trim() || null,
      })
      .eq("id", prospect.id);
    setSubmitting(false);
    if (error) {
      toast.error("Failed to update prospect", { description: error.message });
      return;
    }
    toast.success("Prospect updated");
    onOpenChange(false);
    router.refresh();
  }

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="flex w-full flex-col gap-0 sm:max-w-lg">
        <SheetHeader>
          <SheetTitle>Edit prospect</SheetTitle>
          <SheetDescription>{prospect.name}</SheetDescription>
        </SheetHeader>

        <form onSubmit={handleSubmit} className="flex flex-1 flex-col overflow-hidden">
          <div className="flex-1 space-y-5 overflow-y-auto px-4 py-4">
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label>Stage</Label>
                <Select value={form.pipeline_stage} onValueChange={(v) => update("pipeline_stage", v ?? "lead")}>
                  <SelectTrigger className="w-full">
                    <SelectValue>{(v: string) => formatLabel(v)}</SelectValue>
                  </SelectTrigger>
                  <SelectContent>
                    {STAGES.map((s) => <SelectItem key={s} value={s}>{formatLabel(s)}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label>Source</Label>
                <Select value={form.source} onValueChange={(v) => update("source", v ?? "")}>
                  <SelectTrigger className="w-full">
                    <SelectValue>{(v: string) => v ? formatLabel(v) : "None"}</SelectValue>
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">None</SelectItem>
                    {SOURCES.map((s) => <SelectItem key={s} value={s}>{formatLabel(s)}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label htmlFor="ep-value">Estimated value ($)</Label>
                <Input id="ep-value" type="number" min="0" step="100" placeholder="5000" value={form.estimated_value} onChange={(e) => update("estimated_value", e.target.value)} />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="ep-prob">Probability (%)</Label>
                <Input id="ep-prob" type="number" min="0" max="100" step="5" placeholder="50" value={form.probability} onChange={(e) => update("probability", e.target.value)} />
              </div>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="ep-close">Expected close date</Label>
              <Input id="ep-close" type="date" value={form.expected_close} onChange={(e) => update("expected_close", e.target.value)} />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label htmlFor="ep-action">Next action</Label>
                <Input id="ep-action" placeholder="e.g. Send proposal" value={form.next_action} onChange={(e) => update("next_action", e.target.value)} />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="ep-action-date">Next action date</Label>
                <Input id="ep-action-date" type="date" value={form.next_action_date} onChange={(e) => update("next_action_date", e.target.value)} />
              </div>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="ep-platform">Platform notes</Label>
              <Input id="ep-platform" placeholder="Key context for this prospect..." value={form.platform_notes} onChange={(e) => update("platform_notes", e.target.value)} />
            </div>
          </div>

          <SheetFooter className="border-t border-border">
            <Button type="submit" disabled={submitting} className="w-full">
              {submitting ? <><Loader2 className="h-4 w-4 animate-spin" />Saving...</> : "Save changes"}
            </Button>
          </SheetFooter>
        </form>
      </SheetContent>
    </Sheet>
  );
}
