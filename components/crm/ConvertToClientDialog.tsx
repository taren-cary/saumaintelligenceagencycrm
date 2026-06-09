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
  const [monthlyValue, setMonthlyValue] = useState(
    prospect.estimated_value ? String(Math.round(prospect.estimated_value / 12)) : ""
  );

  if (!open) return null;

  async function handleConvert() {
    setConverting(true);
    const supabase = createClient();
    const { error } = await supabase
      .from("clients")
      .update({
        status: "active",
        pipeline_stage: "won",
        monthly_value: monthlyValue ? parseFloat(monthlyValue) : null,
      })
      .eq("id", prospect.id);
    setConverting(false);
    if (error) {
      toast.error("Failed to convert", { description: error.message });
      return;
    }
    toast.success(`${prospect.name} is now an active client`);
    onOpenChange(false);
    router.push(`/clients/${prospect.id}`);
    router.refresh();
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
      <div className="w-full max-w-md rounded-xl border border-border bg-card p-6 shadow-xl">
        <h2 className="text-lg font-semibold text-foreground">Convert to active client?</h2>
        <p className="mt-1 text-sm text-text-secondary">
          {prospect.name} is marked as Won. Convert them to an active client? All their notes, communications, and decisions stay attached.
        </p>

        <div className="mt-4 space-y-1.5">
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

        <div className="mt-6 flex gap-3">
          <Button variant="secondary" className="flex-1" onClick={() => onOpenChange(false)} disabled={converting}>
            Skip for now
          </Button>
          <Button className="flex-1" onClick={handleConvert} disabled={converting}>
            {converting ? <><Loader2 className="h-4 w-4 animate-spin" />Converting...</> : "Convert to client"}
          </Button>
        </div>
      </div>
    </div>
  );
}
