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

const STATUS_OPTIONS = ["active", "building", "paused", "deprecated"];

const initialState = {
  name: "",
  description: "",
  status: "active",
  tech_stack: "",
  repo_url: "",
  staging_url: "",
  production_url: "",
  monitoring_url: "",
  last_deployed_at: "",
  credentials_vault_note: "",
  architecture_notes: "",
  known_issues: "",
  on_call_instructions: "",
};

export function AddSystemSheet({
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

  function update<K extends keyof typeof initialState>(key: K, value: string | null) {
    setForm((f) => ({ ...f, [key]: value ?? "" }));
  }

  function reset() {
    setForm(initialState);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.name.trim()) {
      toast.error("System name is required");
      return;
    }

    setSubmitting(true);
    const supabase = createClient();

    const { error } = await supabase.from("client_systems").insert({
      client_id: clientId,
      name: form.name.trim(),
      description: form.description.trim() || null,
      status: form.status,
      tech_stack: form.tech_stack
        ? form.tech_stack.split(",").map((t) => t.trim()).filter(Boolean)
        : [],
      repo_url: form.repo_url.trim() || null,
      staging_url: form.staging_url.trim() || null,
      production_url: form.production_url.trim() || null,
      monitoring_url: form.monitoring_url.trim() || null,
      last_deployed_at: form.last_deployed_at || null,
      credentials_vault_note: form.credentials_vault_note.trim() || null,
      architecture_notes: form.architecture_notes.trim() || null,
      known_issues: form.known_issues.trim() || null,
      on_call_instructions: form.on_call_instructions.trim() || null,
    });

    setSubmitting(false);

    if (error) {
      toast.error("Failed to add system", { description: error.message });
      return;
    }

    toast.success(`${form.name.trim()} added`);
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
          <SheetTitle>Add system</SheetTitle>
          <SheetDescription>
            Track a bot, integration, or pipeline you&apos;ve built for this client.
          </SheetDescription>
        </SheetHeader>

        <form onSubmit={handleSubmit} className="flex flex-1 flex-col overflow-hidden">
          <div className="flex-1 space-y-6 overflow-y-auto px-4 py-2">
            <section className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div className="col-span-2 space-y-1.5">
                  <Label htmlFor="sys-name">Name *</Label>
                  <Input
                    id="sys-name"
                    required
                    placeholder="e.g. Lead Capture Voice Bot"
                    value={form.name}
                    onChange={(e) => update("name", e.target.value)}
                  />
                </div>
                <div className="col-span-2 space-y-1.5">
                  <Label htmlFor="sys-description">Description</Label>
                  <Input
                    id="sys-description"
                    value={form.description}
                    onChange={(e) => update("description", e.target.value)}
                  />
                </div>
                <div className="space-y-1.5">
                  <Label>Status</Label>
                  <Select value={form.status} onValueChange={(v) => update("status", v)}>
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
                  <Label htmlFor="sys-last-deployed">Last deployed</Label>
                  <Input
                    id="sys-last-deployed"
                    type="date"
                    value={form.last_deployed_at}
                    onChange={(e) => update("last_deployed_at", e.target.value)}
                  />
                </div>
                <div className="col-span-2 space-y-1.5">
                  <Label htmlFor="sys-tech-stack">Tech stack</Label>
                  <Input
                    id="sys-tech-stack"
                    placeholder="comma-separated, e.g. OpenClaw, Retell AI, Supabase"
                    value={form.tech_stack}
                    onChange={(e) => update("tech_stack", e.target.value)}
                  />
                </div>
              </div>
            </section>

            <section className="space-y-3">
              <h3 className="text-xs font-semibold uppercase tracking-wide text-text-muted">Links</h3>
              <div className="grid grid-cols-1 gap-3">
                <div className="space-y-1.5">
                  <Label htmlFor="sys-repo">Repo URL</Label>
                  <Input id="sys-repo" value={form.repo_url} onChange={(e) => update("repo_url", e.target.value)} />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="sys-staging">Staging URL</Label>
                  <Input
                    id="sys-staging"
                    value={form.staging_url}
                    onChange={(e) => update("staging_url", e.target.value)}
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="sys-production">Production URL</Label>
                  <Input
                    id="sys-production"
                    value={form.production_url}
                    onChange={(e) => update("production_url", e.target.value)}
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="sys-monitoring">Monitoring URL</Label>
                  <Input
                    id="sys-monitoring"
                    value={form.monitoring_url}
                    onChange={(e) => update("monitoring_url", e.target.value)}
                  />
                </div>
              </div>
            </section>

            <section className="space-y-3">
              <h3 className="text-xs font-semibold uppercase tracking-wide text-text-muted">Operations</h3>
              <div className="space-y-3">
                <div className="space-y-1.5">
                  <Label htmlFor="sys-credentials">Credentials vault note</Label>
                  <Input
                    id="sys-credentials"
                    placeholder='e.g. "1Password vault: Sauma/ClientName"'
                    value={form.credentials_vault_note}
                    onChange={(e) => update("credentials_vault_note", e.target.value)}
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="sys-architecture">Architecture notes</Label>
                  <Textarea
                    id="sys-architecture"
                    rows={3}
                    placeholder="Agent roles, data flow, known constraints..."
                    value={form.architecture_notes}
                    onChange={(e) => update("architecture_notes", e.target.value)}
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="sys-known-issues">Known issues</Label>
                  <Textarea
                    id="sys-known-issues"
                    rows={3}
                    placeholder="Ongoing bugs or gotchas to remember..."
                    value={form.known_issues}
                    onChange={(e) => update("known_issues", e.target.value)}
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="sys-on-call">On-call instructions</Label>
                  <Textarea
                    id="sys-on-call"
                    rows={3}
                    value={form.on_call_instructions}
                    onChange={(e) => update("on_call_instructions", e.target.value)}
                  />
                </div>
              </div>
            </section>
          </div>

          <SheetFooter className="border-t border-border">
            <Button type="submit" disabled={submitting} className="w-full">
              {submitting ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Adding...
                </>
              ) : (
                "Add system"
              )}
            </Button>
          </SheetFooter>
        </form>
      </SheetContent>
    </Sheet>
  );
}
