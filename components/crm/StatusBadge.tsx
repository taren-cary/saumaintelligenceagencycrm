import { cn } from "@/lib/utils";

// Spec section 6 client status colors, extended with sensible mappings
// for system/project/task/pipeline statuses so the component is reusable everywhere.
const STATUS_COLORS: Record<string, string> = {
  // clients
  active: "#34d399", // green
  maintenance: "#60a5fa", // blue
  at_risk: "#fb923c", // orange
  paused: "#fbbf24", // yellow
  churned: "#f87171", // red
  prospect: "#a78bfa", // purple

  // systems / projects / tasks (extra states beyond the client list)
  building: "#5b7cfa",
  deprecated: "#555b72",
  scoping: "#5b7cfa",
  in_progress: "#60a5fa",
  review: "#fbbf24",
  complete: "#34d399",
  done: "#34d399",
  on_hold: "#fbbf24",
  cancelled: "#f87171",
  todo: "#8b91a8",
  blocked: "#f87171",
};

function formatStatus(status: string) {
  return status.replace(/_/g, " ");
}

export function StatusBadge({ status, className }: { status: string; className?: string }) {
  const color = STATUS_COLORS[status] ?? "#8b91a8";

  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full border px-2 py-0.5 text-xs font-medium capitalize",
        className
      )}
      style={{
        color,
        borderColor: `${color}40`,
        backgroundColor: `${color}1a`,
      }}
    >
      <span className="h-1.5 w-1.5 shrink-0 rounded-full" style={{ backgroundColor: color }} />
      {formatStatus(status)}
    </span>
  );
}
