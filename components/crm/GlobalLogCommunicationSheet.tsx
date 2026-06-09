"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Loader2, Plus, X } from "lucide-react";
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

const TYPE_OPTIONS = ["call", "email", "message", "meeting", "loom", "note"];
const DIRECTION_OPTIONS = ["outbound", "inbound", "internal"];
const NONE = "__none__";

const initialState = {
  client_id: NONE,
  type: "call",
  direction: "outbound",
  subject: "",
  summary: "",
  followUpRequired: false,
  followUpDate: "",
  followUpNote: "",
};

type ClientStub = { id: string; name: string };

export function GlobalLogCommunicationSheet({
  clients,
  open,
  onOpenChange,
}: {
  clients: ClientStub[];
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const router = useRouter();
  const [submitting, setSubmitting] = useState(false);
  const [form, setForm] = useState(initialState);
  const [decisions, setDecisions] = useState<string[]>([]);
  const [decisionDraft, setDecisionDraft] = useState("");

  function update<K extends keyof typeof initialState>(key: K, value: (typeof initialState)[K]) {
    setForm((f) => ({ ...f, [key]: value }));
  }

  function reset() {
    setForm(initialState);
    setDecisions([]);
    setDecisionDraft("");
  }

  function addDecision() {
    const d = decisionDraft.trim();
    if (!d) return;
    setDecisions((ds) => [...ds, d]);
    setDecisionDraft("");
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (form.client_id === NONE) {
      toast.error("Select a client");
      return;
    }
    if (!form.summary.trim()) {
      toast.error("Summary is required");
      return;
    }
    setSubmitting(true);
    const supabase = createClient();
    const { error } = await supabase.from("communications").insert({
      client_id: form.client_id,
      type: form.type,
      direction: form.direction,
      subject: form.subject.trim() || null,
      summary: form.summary.trim(),
      decisions_made: decisions.length > 0 ? decisions : null,
      follow_up_required: form.followUpRequired,
      follow_up_date: form.followUpRequired && form.followUpDate ? form.followUpDate : null,
      follow_up_note: form.followUpRequired && form.followUpNote.trim() ? form.followUpNote.trim() : null,
      logged_at: new Date().toISOString(),
    });
    setSubmitting(false);
    if (error) {
      toast.error("Failed to log communication", { description: error.message });
      return;
    }
    toast.success("Communication logged");
    reset();
    onOpenChange(false);
    router.refresh();
  }

  return (
    <Sheet open={open} onOpenChange={(next) => { onOpenChange(next); if (!next) reset(); }}>
      <SheetContent className="flex w-full flex-col gap-0 sm:max-w-lg">
        <SheetHeader>
          <SheetTitle>Log communication</SheetTitle>
          <SheetDescription>Record a call, email, meeting, or note.</SheetDescription>
        </SheetHeader>

        <form onSubmit={handleSubmit} className="flex flex-1 flex-col overflow-hidden">
          <div className="flex-1 space-y-5 overflow-y-auto px-4 py-4">
            <div className="space-y-1.5">
              <Label>Client *</Label>
              <Select value={form.client_id} onValueChange={(v) => update("client_id", v ?? NONE)}>
                <SelectTrigger className="w-full">
                  <SelectValue>
                    {(v: string) => v === NONE ? "Select client…" : (clients.find((c) => c.id === v)?.name ?? "Select client…")}
                  </SelectValue>
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value={NONE}>Select client…</SelectItem>
                  {clients.map((c) => (
                    <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label>Type</Label>
                <Select value={form.type} onValueChange={(v) => update("type", v ?? "call")}>
                  <SelectTrigger className="w-full">
                    <SelectValue>{(v: string) => formatLabel(v)}</SelectValue>
                  </SelectTrigger>
                  <SelectContent>
                    {TYPE_OPTIONS.map((t) => (
                      <SelectItem key={t} value={t}>{formatLabel(t)}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label>Direction</Label>
                <Select value={form.direction} onValueChange={(v) => update("direction", v ?? "outbound")}>
                  <SelectTrigger className="w-full">
                    <SelectValue>{(v: string) => formatLabel(v)}</SelectValue>
                  </SelectTrigger>
                  <SelectContent>
                    {DIRECTION_OPTIONS.map((d) => (
                      <SelectItem key={d} value={d}>{formatLabel(d)}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="glcs-subject">Subject</Label>
              <Input
                id="glcs-subject"
                placeholder="e.g. Monthly check-in"
                value={form.subject}
                onChange={(e) => update("subject", e.target.value)}
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="glcs-summary">Summary *</Label>
              <Textarea
                id="glcs-summary"
                required
                rows={4}
                placeholder="What was discussed?"
                value={form.summary}
                onChange={(e) => update("summary", e.target.value)}
              />
            </div>

            <div className="space-y-1.5">
              <Label>Decisions made</Label>
              {decisions.length > 0 && (
                <ul className="mb-2 space-y-1">
                  {decisions.map((d, i) => (
                    <li key={i} className="flex items-center gap-2 rounded-md bg-muted px-3 py-1.5 text-sm">
                      <span className="flex-1 text-foreground">{d}</span>
                      <button
                        type="button"
                        onClick={() => setDecisions((ds) => ds.filter((_, j) => j !== i))}
                        className="text-text-muted hover:text-danger"
                      >
                        <X className="h-3.5 w-3.5" />
                      </button>
                    </li>
                  ))}
                </ul>
              )}
              <div className="flex gap-2">
                <Input
                  placeholder="Add a decision…"
                  value={decisionDraft}
                  onChange={(e) => setDecisionDraft(e.target.value)}
                  onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); addDecision(); } }}
                />
                <Button type="button" variant="secondary" size="sm" onClick={addDecision}>
                  <Plus className="h-4 w-4" />
                </Button>
              </div>
            </div>

            <div className="flex items-center justify-between rounded-lg border border-border p-3">
              <div>
                <Label>Follow-up required</Label>
                <p className="text-xs text-text-muted">Set a reminder for this client.</p>
              </div>
              <Switch
                checked={form.followUpRequired}
                onCheckedChange={(checked) => update("followUpRequired", checked)}
              />
            </div>

            {form.followUpRequired && (
              <div className="space-y-3">
                <div className="space-y-1.5">
                  <Label htmlFor="glcs-fu-date">Follow-up date</Label>
                  <Input
                    id="glcs-fu-date"
                    type="date"
                    value={form.followUpDate}
                    onChange={(e) => update("followUpDate", e.target.value)}
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="glcs-fu-note">Follow-up note</Label>
                  <Input
                    id="glcs-fu-note"
                    placeholder="What needs to happen?"
                    value={form.followUpNote}
                    onChange={(e) => update("followUpNote", e.target.value)}
                  />
                </div>
              </div>
            )}
          </div>

          <SheetFooter className="border-t border-border">
            <Button type="submit" disabled={submitting} className="w-full">
              {submitting ? (
                <><Loader2 className="h-4 w-4 animate-spin" />Logging…</>
              ) : (
                "Log communication"
              )}
            </Button>
          </SheetFooter>
        </form>
      </SheetContent>
    </Sheet>
  );
}
