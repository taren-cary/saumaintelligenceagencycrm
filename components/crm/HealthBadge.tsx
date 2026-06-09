import { cn } from "@/lib/utils";

const HEALTH_SCORES: Record<number, { label: string; color: string }> = {
  1: { label: "Critical", color: "#f87171" },
  2: { label: "At Risk", color: "#fb923c" },
  3: { label: "Stable", color: "#fbbf24" },
  4: { label: "Good", color: "#34d399" },
  5: { label: "Excellent", color: "#60a5fa" },
};

export function healthScoreInfo(score: number | null | undefined) {
  return HEALTH_SCORES[score ?? 3] ?? HEALTH_SCORES[3];
}

export function HealthBadge({
  score,
  showLabel = true,
  className,
}: {
  score: number | null | undefined;
  showLabel?: boolean;
  className?: string;
}) {
  const { label, color } = healthScoreInfo(score);

  return (
    <span className={cn("inline-flex items-center gap-1.5", className)}>
      <span
        className="h-2.5 w-2.5 shrink-0 rounded-full"
        style={{ backgroundColor: color }}
        aria-hidden
      />
      {showLabel && <span className="text-sm text-text-secondary">{label}</span>}
    </span>
  );
}
