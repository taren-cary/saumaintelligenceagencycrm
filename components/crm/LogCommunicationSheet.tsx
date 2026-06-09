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

const initialState = {
  type: "call",
  direction: "outbound",
  subject: "",
  summary: "",
  followUpRequired: false,
  followUpDate: "",
  followUpNote: "",
};

export function LogCommunicationSheet({
  clientId,
  open,
  onOpenChange,
}: {
  clientId: string;
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
    const value = decisionDraft.trim();
    if (!value) return;
    setDecisions((d) => [...d, value]);
    setDecisionDraft("");
  }

  function removeDecision(index: number) {
    setDecisions((d) => d.filter((_, i) => i !== index));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.summary.trim()) {
      toast.error("Summary is required");
      return;
    }

    setSubmitting(true);
    const supabase = createClient();

    const { error } = await supabase.from("communications").insert({
      client_id: clientId,
      type: form.type,
      direction: form.direction,
      subject: form.subject.trim() || null,
      summary: form.summary.trim(),
      decisions_made: decisions,
      follow_up_required: form.followUpRequired,
      follow_up_date: form.followUpRequired ? form.followUpDate || null : null,
      follow_up_note: form.followUpRequired ? form.followUpNote.trim() || null : null,
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
    <Sheet
      open={open}
      onOpenChange={(next) => {
        onOpenChange(next);
        if (!next) reset();
      }}
    >
      <SheetContent className="flex w-full flex-col gap-0 sm:max-w-lg">
        <SheetHeader>
          <SheetTitle>Log communication</SheetTitle>
          <SheetDescription>
            Capture what was discussed and any commitments made — future you will thank you.
          </SheetDescription>
        </SheetHeader>

        <form onSubmit={handleSubmit} className="flex flex-1 flex-col overflow-hidden">
          <div className="flex-1 space-y-5 overflow-y-auto px-4 py-2">
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label>Type</Label>
                <Select value={form.type} onValueChange={(v) => v && update("type", v)}>
                  <SelectTrigger className="w-full">
                    <SelectValue>{(v: string) => formatLabel(v)}</SelectValue>
                  </SelectTrigger>
                  <SelectContent>
                    {TYPE_OPTIONS.map((t) => (
                      <SelectItem key={t} value={t}>
                        {formatLabel(t)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label>Direction</Label>
                <Select value={form.direction} onValueChange={(v) => v && update("direction", v)}>
                  <SelectTrigger className="w-full">
                    <SelectValue>{(v: string) => formatLabel(v)}</SelectValue>
                  </SelectTrigger>
                  <SelectContent>
                    {DIRECTION_OPTIONS.map((d) => (
                      <SelectItem key={d} value={d}>
                        {formatLabel(d)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="comm-subject">Subject</Label>
              <Input
                id="comm-subject"
                placeholder="Optional headline for this entry"
                value={form.subject}
                onChange={(e) => update("subject", e.target.value)}
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="comm-summary">Summary *</Label>
              <Textarea
                id="comm-summary"
                rows={4}
                required
                placeholder="Key decisions, commitments, or context — not a transcript"
                value={form.summary}
                onChange={(e) => update("summary", e.target.value)}
              />
            </div>

            <div className="space-y-1.5">
              <Label>Decisions made</Label>
              {decisions.length > 0 && (
                <div className="space-y-1.5">
                  {decisions.map((decision, i) => (
                    <div key={i} className="flex items-center gap-2">
                      <span className="flex-1 truncate rounded-md border border-border bg-muted px-2.5 py-1.5 text-sm text-text-secondary">
                        {decision}
                      </span>
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon-sm"
                        onClick={() => removeDecision(i)}
                        aria-label="Remove decision"
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  ))}
                </div>
              )}
              <div className="flex items-center gap-2">
                <Input
                  placeholder='e.g. "Agreed to $1,200/mo retainer"'
                  value={decisionDraft}
                  onChange={(e) => setDecisionDraft(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      e.preventDefault();
                      addDecision();
                    }
                  }}
                />
                <Button type="button" variant="secondary" onClick={addDecision} disabled={!decisionDraft.trim()}>
                  <Plus className="h-4 w-4" />
                  Add
                </Button>
              </div>
            </div>

            <div className="space-y-3 rounded-lg border border-border p-3">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <Label htmlFor="comm-follow-up">Follow-up required</Label>
                  <p className="text-xs text-text-muted">Surface this until it&apos;s resolved.</p>
                </div>
                <Switch
                  id="comm-follow-up"
                  checked={form.followUpRequired}
                  onCheckedChange={(checked) => update("followUpRequired", checked)}
                />
              </div>

              {form.followUpRequired && (
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                  <div className="space-y-1.5">
                    <Label htmlFor="comm-follow-up-date">Follow-up date</Label>
                    <Input
                      id="comm-follow-up-date"
                      type="date"
                      value={form.followUpDate}
                      onChange={(e) => update("followUpDate", e.target.value)}
                    />
                  </div>
                  <div className="space-y-1.5 sm:col-span-2">
                    <Label htmlFor="comm-follow-up-note">Follow-up note</Label>
                    <Input
                      id="comm-follow-up-note"
                      placeholder="What needs to happen?"
                      value={form.followUpNote}
                      onChange={(e) => update("followUpNote", e.target.value)}
                    />
                  </div>
                </div>
              )}
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
                "Log communication"
              )}
            </Button>
          </SheetFooter>
        </form>
      </SheetContent>
    </Sheet>
  );
}
