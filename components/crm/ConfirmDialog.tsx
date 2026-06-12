"use client";

import { Button } from "@/components/ui/button";

export function ConfirmDialog({
  open,
  title,
  description,
  confirmLabel = "Delete",
  loading = false,
  onConfirm,
  onCancel,
}: {
  open: boolean;
  title: string;
  description: string;
  confirmLabel?: string;
  loading?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
      <div className="w-full max-w-sm rounded-xl border border-border bg-card p-6 shadow-xl">
        <h2 className="text-base font-semibold text-foreground">{title}</h2>
        <p className="mt-2 text-sm text-text-secondary">{description}</p>
        <div className="mt-5 flex gap-3">
          <Button variant="secondary" className="flex-1" onClick={onCancel} disabled={loading}>
            Cancel
          </Button>
          <Button
            className="flex-1 bg-danger text-white hover:bg-danger/90"
            onClick={onConfirm}
            disabled={loading}
          >
            {loading ? "Deleting..." : confirmLabel}
          </Button>
        </div>
      </div>
    </div>
  );
}
