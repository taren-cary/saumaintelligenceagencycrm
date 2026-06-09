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

const NONE = "__none__";

const initial = {
  decision: "",
  rationale: "",
  made_by: "",
  system_id: NONE,
  logged_at: new Date().toISOString().split("T")[0],
};

export function LogDecisionSheet({
  clientId,
  systems,
  open,
  onOpenChange,
}: {
  clientId: string;
  systems: { id: string; name: string }[];
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
    setForm({ ...initial, logged_at: new Date().toISOString().split("T")[0] });
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.decision.trim()) {
      toast.error("Decision text is required");
      return;
    }
    setSubmitting(true);
    const supabase = createClient();
    const { error } = await supabase.from("decisions_log").insert({
      client_id: clientId,
      decision: form.decision.trim(),
      rationale: form.rationale.trim() || null,
      made_by: form.made_by.trim() || null,
      system_id: form.system_id !== NONE ? form.system_id : null,
      logged_at: new Date(form.logged_at).toISOString(),
    });
    setSubmitting(false);
    if (error) {
      toast.error("Failed to log decision", { description: error.message });
      return;
    }
    toast.success("Decision logged");
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
          <SheetTitle>Log decision</SheetTitle>
          <SheetDescription>Record a key decision made for this client.</SheetDescription>
        </SheetHeader>

        <form onSubmit={handleSubmit} className="flex flex-1 flex-col overflow-hidden">
          <div className="flex-1 space-y-5 overflow-y-auto px-4 py-4">
            <div className="space-y-1.5">
              <Label htmlFor="d-decision">Decision *</Label>
              <textarea
                id="d-decision"
                rows={3}
                required
                placeholder="e.g. Agreed to use GHL instead of a custom CRM"
                value={form.decision}
                onChange={(e) => update("decision", e.target.value)}
                className="w-full resize-none rounded-md border border-border bg-muted/30 px-3 py-2 text-sm text-foreground placeholder:text-text-muted focus:outline-none focus:ring-1 focus:ring-foreground/20"
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="d-rationale">Rationale</Label>
              <textarea
                id="d-rationale"
                rows={2}
                placeholder="Why was this decision made?"
                value={form.rationale}
                onChange={(e) => update("rationale", e.target.value)}
                className="w-full resize-none rounded-md border border-border bg-muted/30 px-3 py-2 text-sm text-foreground placeholder:text-text-muted focus:outline-none focus:ring-1 focus:ring-foreground/20"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label htmlFor="d-made-by">Made by</Label>
                <Input
                  id="d-made-by"
                  placeholder="e.g. Me, Client, Both"
                  value={form.made_by}
                  onChange={(e) => update("made_by", e.target.value)}
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="d-date">Date</Label>
                <Input
                  id="d-date"
                  type="date"
                  value={form.logged_at}
                  onChange={(e) => update("logged_at", e.target.value)}
                />
              </div>
            </div>

            {systems.length > 0 && (
              <div className="space-y-1.5">
                <Label>Related system</Label>
                <Select
                  value={form.system_id}
                  onValueChange={(v) => update("system_id", v ?? NONE)}
                >
                  <SelectTrigger className="w-full">
                    <SelectValue>
                      {(v: string) => {
                        if (v === NONE) return "None";
                        return systems.find((s) => s.id === v)?.name ?? "None";
                      }}
                    </SelectValue>
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value={NONE}>None</SelectItem>
                    {systems.map((s) => (
                      <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}
          </div>

          <SheetFooter className="border-t border-border">
            <Button type="submit" disabled={submitting} className="w-full">
              {submitting ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Logging...
                </>
              ) : (
                "Log decision"
              )}
            </Button>
          </SheetFooter>
        </form>
      </SheetContent>
    </Sheet>
  );
}
