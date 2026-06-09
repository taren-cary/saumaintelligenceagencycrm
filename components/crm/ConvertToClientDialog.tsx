"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type { Prospect } from "@/components/crm/PipelineView";

export function ConvertToClientDialog({
  prospect,
  open,
  onOpenChange,
}: {
  prospect: Prospect;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const router = useRouter();
  const [converting, setConverting] = useState(false);
  const [name, setName] = useState(prospect.company || prospect.name);
  const [monthlyValue, setMonthlyValue] = useState(
    prospect.estimated_value ? String(Math.round(prospect.estimated_value / 12)) : ""
  );

  if (!open) return null;

  async function handleConvert() {
    if (!name.trim()) {
      toast.error("Client name is required");
      return;
    }
    setConverting(true);
    const supabase = createClient();
    const { error } = await supabase.from("clients").insert({
      name: name.trim(),
      status: "active",
      monthly_value: monthlyValue ? parseFloat(monthlyValue) : null,
      health_score: 3,
    });
    setConverting(false);
    if (error) {
      toast.error("Failed to create client", { description: error.message });
      return;
    }
    toast.success(`${name} added as an active client`);
    onOpenChange(false);
    router.push("/clients");
    router.refresh();
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
      <div className="w-full max-w-md rounded-xl border border-border bg-card p-6 shadow-xl">
        <h2 className="text-lg font-semibold text-foreground">Convert to client?</h2>
        <p className="mt-1 text-sm text-text-secondary">
          {prospect.name} is now Won. Create an active client record?
        </p>

        <div className="mt-4 space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="cc-name">Client name</Label>
            <Input
              id="cc-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Acme Corp"
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="cc-mrr">Monthly value ($)</Label>
            <Input
              id="cc-mrr"
              type="number"
              min="0"
              step="100"
              placeholder="e.g. 2000"
              value={monthlyValue}
              onChange={(e) => setMonthlyValue(e.target.value)}
            />
          </div>
        </div>

        <div className="mt-6 flex gap-3">
          <Button
            variant="secondary"
            className="flex-1"
            onClick={() => onOpenChange(false)}
            disabled={converting}
          >
            Skip for now
          </Button>
          <Button className="flex-1" onClick={handleConvert} disabled={converting}>
            {converting ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Converting...
              </>
            ) : (
              "Convert to client"
            )}
          </Button>
        </div>
      </div>
    </div>
  );
}
