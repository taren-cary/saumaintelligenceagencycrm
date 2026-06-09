"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { createClient } from "@/lib/supabase/client";
import { healthScoreInfo } from "@/components/crm/HealthBadge";
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
  SheetTrigger,
} from "@/components/ui/sheet";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Loader2, Plus } from "lucide-react";

const STATUS_OPTIONS = ["prospect", "active", "maintenance", "at_risk", "paused", "churned"];
const COMM_PREFERENCE_OPTIONS = ["async", "sync", "email_only", "slack", "whatsapp"];
const BILLING_MODEL_OPTIONS = ["retainer", "project", "hourly", "hybrid"];

function healthLabel(value: string) {
  return `${value} — ${healthScoreInfo(Number(value)).label}`;
}

const initialState = {
  name: "",
  company: "",
  email: "",
  phone: "",
  timezone: "",
  status: "active",
  health_score: "3",
  comm_preference: "async",
  billing_model: "",
  monthly_value: "",
  hourly_rate: "",
  contract_start: "",
  contract_end: "",
  contract_renewal: "",
  payment_terms: "",
  notes: "",
  tags: "",
};

export function AddClientSheet({
  open: externalOpen,
  onOpenChange: externalOnOpenChange,
}: {
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
} = {}) {
  const router = useRouter();
  const [internalOpen, setInternalOpen] = useState(false);
  const open = externalOpen ?? internalOpen;
  const setOpen = externalOnOpenChange ?? setInternalOpen;
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
      toast.error("Client name is required");
      return;
    }

    setSubmitting(true);
    const supabase = createClient();

    const { error } = await supabase.from("clients").insert({
      name: form.name.trim(),
      company: form.company.trim() || null,
      email: form.email.trim() || null,
      phone: form.phone.trim() || null,
      timezone: form.timezone.trim() || null,
      status: form.status,
      health_score: Number(form.health_score),
      comm_preference: form.comm_preference || null,
      billing_model: form.billing_model || null,
      monthly_value: form.monthly_value ? Number(form.monthly_value) : null,
      hourly_rate: form.hourly_rate ? Number(form.hourly_rate) : null,
      contract_start: form.contract_start || null,
      contract_end: form.contract_end || null,
      contract_renewal: form.contract_renewal || null,
      payment_terms: form.payment_terms.trim() || null,
      notes: form.notes.trim() || null,
      tags: form.tags
        ? form.tags.split(",").map((t) => t.trim()).filter(Boolean)
        : [],
    });

    setSubmitting(false);

    if (error) {
      toast.error("Failed to create client", { description: error.message });
      return;
    }

    toast.success(`${form.name.trim()} added`);
    reset();
    setOpen(false);
    router.refresh();
  }

  return (
    <Sheet
      open={open}
      onOpenChange={(next) => {
        setOpen(next);
        if (!next) reset();
      }}
    >
      <SheetTrigger
        render={
          <Button>
            <Plus className="h-4 w-4" />
            Add Client
          </Button>
        }
      />
      <SheetContent className="flex w-full flex-col gap-0 sm:max-w-lg">
        <SheetHeader>
          <SheetTitle>Add client</SheetTitle>
          <SheetDescription>
            Create a new client relationship. You can fill in the rest later.
          </SheetDescription>
        </SheetHeader>

        <form onSubmit={handleSubmit} className="flex flex-1 flex-col overflow-hidden">
          <div className="flex-1 space-y-6 overflow-y-auto px-4 py-2">
            <section className="space-y-3">
              <h3 className="text-xs font-semibold uppercase tracking-wide text-text-muted">
                Identity
              </h3>
              <div className="grid grid-cols-2 gap-3">
                <div className="col-span-2 space-y-1.5">
                  <Label htmlFor="name">Name *</Label>
                  <Input
                    id="name"
                    required
                    value={form.name}
                    onChange={(e) => update("name", e.target.value)}
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="company">Company</Label>
                  <Input
                    id="company"
                    value={form.company}
                    onChange={(e) => update("company", e.target.value)}
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="timezone">Timezone</Label>
                  <Input
                    id="timezone"
                    placeholder="e.g. America/Chicago"
                    value={form.timezone}
                    onChange={(e) => update("timezone", e.target.value)}
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    value={form.email}
                    onChange={(e) => update("email", e.target.value)}
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="phone">Phone</Label>
                  <Input
                    id="phone"
                    value={form.phone}
                    onChange={(e) => update("phone", e.target.value)}
                  />
                </div>
              </div>
            </section>

            <section className="space-y-3">
              <h3 className="text-xs font-semibold uppercase tracking-wide text-text-muted">
                Relationship
              </h3>
              <div className="grid grid-cols-2 gap-3">
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
                  <Label>Health score</Label>
                  <Select
                    value={form.health_score}
                    onValueChange={(v) => update("health_score", v)}
                  >
                    <SelectTrigger className="w-full">
                      <SelectValue>{(v: string) => healthLabel(v)}</SelectValue>
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="1">{healthLabel("1")}</SelectItem>
                      <SelectItem value="2">{healthLabel("2")}</SelectItem>
                      <SelectItem value="3">{healthLabel("3")}</SelectItem>
                      <SelectItem value="4">{healthLabel("4")}</SelectItem>
                      <SelectItem value="5">{healthLabel("5")}</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="col-span-2 space-y-1.5">
                  <Label>Communication preference</Label>
                  <Select
                    value={form.comm_preference}
                    onValueChange={(v) => update("comm_preference", v)}
                  >
                    <SelectTrigger className="w-full">
                      <SelectValue>{(v: string) => formatLabel(v)}</SelectValue>
                    </SelectTrigger>
                    <SelectContent>
                      {COMM_PREFERENCE_OPTIONS.map((c) => (
                        <SelectItem key={c} value={c}>
                          {formatLabel(c)}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="col-span-2 space-y-1.5">
                  <Label htmlFor="tags">Tags</Label>
                  <Input
                    id="tags"
                    placeholder="comma-separated, e.g. voice-bot, retainer"
                    value={form.tags}
                    onChange={(e) => update("tags", e.target.value)}
                  />
                </div>
              </div>
            </section>

            <section className="space-y-3">
              <h3 className="text-xs font-semibold uppercase tracking-wide text-text-muted">
                Billing
              </h3>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label>Billing model</Label>
                  <Select
                    value={form.billing_model}
                    onValueChange={(v) => update("billing_model", v)}
                  >
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="Select model">
                        {(v: string) => (v ? formatLabel(v) : "Select model")}
                      </SelectValue>
                    </SelectTrigger>
                    <SelectContent>
                      {BILLING_MODEL_OPTIONS.map((b) => (
                        <SelectItem key={b} value={b}>
                          {formatLabel(b)}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="payment_terms">Payment terms</Label>
                  <Input
                    id="payment_terms"
                    placeholder='e.g. "Net 15"'
                    value={form.payment_terms}
                    onChange={(e) => update("payment_terms", e.target.value)}
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="monthly_value">Monthly value ($)</Label>
                  <Input
                    id="monthly_value"
                    type="number"
                    step="0.01"
                    value={form.monthly_value}
                    onChange={(e) => update("monthly_value", e.target.value)}
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="hourly_rate">Hourly rate ($)</Label>
                  <Input
                    id="hourly_rate"
                    type="number"
                    step="0.01"
                    value={form.hourly_rate}
                    onChange={(e) => update("hourly_rate", e.target.value)}
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="contract_start">Contract start</Label>
                  <Input
                    id="contract_start"
                    type="date"
                    value={form.contract_start}
                    onChange={(e) => update("contract_start", e.target.value)}
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="contract_end">Contract end</Label>
                  <Input
                    id="contract_end"
                    type="date"
                    value={form.contract_end}
                    onChange={(e) => update("contract_end", e.target.value)}
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="contract_renewal">Contract renewal</Label>
                  <Input
                    id="contract_renewal"
                    type="date"
                    value={form.contract_renewal}
                    onChange={(e) => update("contract_renewal", e.target.value)}
                  />
                </div>
              </div>
            </section>

            <section className="space-y-3">
              <h3 className="text-xs font-semibold uppercase tracking-wide text-text-muted">
                Notes
              </h3>
              <Textarea
                rows={4}
                placeholder="Anything worth remembering about this client..."
                value={form.notes}
                onChange={(e) => update("notes", e.target.value)}
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
                "Create client"
              )}
            </Button>
          </SheetFooter>
        </form>
      </SheetContent>
    </Sheet>
  );
}
