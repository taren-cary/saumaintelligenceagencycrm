import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { formatAbsoluteDate, formatRelativeDate } from "@/lib/dates";
import { cn } from "@/lib/utils";

export function RelativeDate({
  date,
  className,
}: {
  date: string | Date | null | undefined;
  className?: string;
}) {
  if (!date) return <span className={cn("text-text-muted", className)}>—</span>;

  return (
    <Tooltip>
      <TooltipTrigger render={<span className={cn("cursor-default", className)} />}>
        {formatRelativeDate(date)}
      </TooltipTrigger>
      <TooltipContent>{formatAbsoluteDate(date)}</TooltipContent>
    </Tooltip>
  );
}
