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

const STAGES = ["lead", "contacted", "discovery", "proposal", "negotiation"] as const;
const SOURCES = ["referral", "inbound", "outbound", "social", "other"] as const;

const initial = {
  name: "",
  company: "",
  email: "",
  phone: "",
  pipeline_stage: "lead" as string,
  estimated_value: "",
  probability: "50",
  expected_close: "",
  source: "",
  next_action: "",
  next_action_date: "",
  platform_notes: "",
  notes: "",
};

export function AddProspectSheet({
  open,
  onOpenChange,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const router = useRouter();
  const [submitting, setSubmitting] = useState(false);
  const [form, setForm] = useState(initial);

  function update(key: keyof typeof initial, value: string) {
    setForm((f) => ({ ...f, [key]: value }));
  }

  function reset() {
    setForm(initial);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.name.trim()) {
      toast.error("Name is required");
      return;
    }
    setSubmitting(true);
    const supabase = createClient();
    const { error } = await supabase.from("clients").insert({
      name: form.name.trim(),
      company: form.company.trim() || null,
      email: form.email.trim() || null,
      phone: form.phone.trim() || null,
      status: "prospect",
      pipeline_stage: form.pipeline_stage,
      estimated_value: form.estimated_value ? parseFloat(form.estimated_value) : null,
      probability: form.probability ? parseInt(form.probability, 10) : null,
      expected_close: form.expected_close || null,
      source: form.source || null,
      next_action: form.next_action.trim() || null,
      next_action_date: form.next_action_date || null,
      platform_notes: form.platform_notes.trim() || null,
      notes: form.notes.trim() || null,
      health_score: 3,
    });
    setSubmitting(false);
    if (error) {
      toast.error("Failed to add prospect", { description: error.message });
      return;
    }
    toast.success(`${form.name} added to pipeline`);
    reset();
    onOpenChange(false);
    router.refresh();
  }

  return (
    <Sheet open={open} onOpenChange={(next) => { onOpenChange(next); if (!next) reset(); }}>
      <SheetContent className="flex w-full flex-col gap-0 sm:max-w-lg">
        <SheetHeader>
          <SheetTitle>Add prospect</SheetTitle>
          <SheetDescription>Add a new lead to the pipeline.</SheetDescription>
        </SheetHeader>

        <form onSubmit={handleSubmit} className="flex flex-1 flex-col overflow-hidden">
          <div className="flex-1 space-y-5 overflow-y-auto px-4 py-4">
            <div className="space-y-1.5">
              <Label htmlFor="p-name">Name / Contact *</Label>
              <Input id="p-name" required placeholder="e.g. Jane Smith" value={form.name} onChange={(e) => update("name", e.target.value)} />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="p-company">Company</Label>
              <Input id="p-company" placeholder="e.g. Acme Corp" value={form.company} onChange={(e) => update("company", e.target.value)} />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label htmlFor="p-email">Email</Label>
                <Input id="p-email" type="email" placeholder="jane@acme.com" value={form.email} onChange={(e) => update("email", e.target.value)} />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="p-phone">Phone</Label>
                <Input id="p-phone" placeholder="+1 555-000-0000" value={form.phone} onChange={(e) => update("phone", e.target.value)} />
              </div>
            </div>

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
                <Label htmlFor="p-value">Estimated value ($)</Label>
                <Input id="p-value" type="number" min="0" step="100" placeholder="5000" value={form.estimated_value} onChange={(e) => update("estimated_value", e.target.value)} />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="p-prob">Probability (%)</Label>
                <Input id="p-prob" type="number" min="0" max="100" step="5" placeholder="50" value={form.probability} onChange={(e) => update("probability", e.target.value)} />
              </div>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="p-close">Expected close date</Label>
              <Input id="p-close" type="date" value={form.expected_close} onChange={(e) => update("expected_close", e.target.value)} />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label htmlFor="p-action">Next action</Label>
                <Input id="p-action" placeholder="e.g. Send proposal" value={form.next_action} onChange={(e) => update("next_action", e.target.value)} />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="p-action-date">Next action date</Label>
                <Input id="p-action-date" type="date" value={form.next_action_date} onChange={(e) => update("next_action_date", e.target.value)} />
              </div>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="p-platform">Platform notes</Label>
              <Input id="p-platform" placeholder="Key context for this prospect..." value={form.platform_notes} onChange={(e) => update("platform_notes", e.target.value)} />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="p-notes">Notes</Label>
              <textarea
                id="p-notes"
                rows={3}
                placeholder="Any additional notes..."
                value={form.notes}
                onChange={(e) => update("notes", e.target.value)}
                className="w-full resize-none rounded-md border border-border bg-muted/30 px-3 py-2 text-sm text-foreground placeholder:text-text-muted focus:outline-none focus:ring-1 focus:ring-foreground/20"
              />
            </div>
          </div>

          <SheetFooter className="border-t border-border">
            <Button type="submit" disabled={submitting} className="w-full">
              {submitting ? <><Loader2 className="h-4 w-4 animate-spin" />Adding...</> : "Add prospect"}
            </Button>
          </SheetFooter>
        </form>
      </SheetContent>
    </Sheet>
  );
}
