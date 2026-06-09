import Link from "next/link";
import { Card } from "@/components/ui/card";
import { HealthBadge } from "@/components/crm/HealthBadge";
import { StatusBadge } from "@/components/crm/StatusBadge";
import { RelativeDate } from "@/components/crm/RelativeDate";
import { daysUntil } from "@/lib/dates";
import { formatCurrency } from "@/lib/format";
import { cn } from "@/lib/utils";
import type { ClientWithStats } from "@/app/(app)/clients/page";

export function ClientCard({ client }: { client: ClientWithStats }) {
  const renewalDays = daysUntil(client.contract_renewal);
  const renewalSoon = renewalDays !== null && renewalDays >= 0 && renewalDays < 30;

  const billingLine = client.billing_model
    ? client.monthly_value
      ? `${client.billing_model} · ${formatCurrency(client.monthly_value)}/mo`
      : client.hourly_rate
        ? `${client.billing_model} · ${formatCurrency(client.hourly_rate)}/hr`
        : client.billing_model
    : null;

  return (
    <Link href={`/clients/${client.id}`}>
      <Card className="group flex h-full flex-col gap-3 p-4 ring-1 ring-foreground/10 transition-colors hover:ring-foreground/20">
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0">
            <p className="truncate font-medium text-foreground">{client.name}</p>
            {client.company && (
              <p className="truncate text-sm text-text-secondary">{client.company}</p>
            )}
          </div>
          <HealthBadge score={client.health_score} showLabel={false} />
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <StatusBadge status={client.status} />
          {billingLine && <span className="text-xs text-text-muted">{billingLine}</span>}
        </div>

        {client.tags && client.tags.length > 0 && (
          <div className="flex flex-wrap gap-1.5">
            {client.tags.slice(0, 4).map((tag) => (
              <span
                key={tag}
                className="rounded-full border border-border bg-muted px-2 py-0.5 text-xs text-text-secondary"
              >
                {tag}
              </span>
            ))}
          </div>
        )}

        <div className="mt-auto flex items-center justify-between border-t border-border pt-3 text-xs text-text-muted">
          <span>
            Last contact: <RelativeDate date={client.lastContactAt} className="text-text-secondary" />
          </span>
          <span>
            {client.openTaskCount} open task{client.openTaskCount === 1 ? "" : "s"}
          </span>
        </div>

        {client.contract_renewal && (
          <div className={cn("text-xs", renewalSoon ? "text-danger" : "text-text-muted")}>
            Renews <RelativeDate date={client.contract_renewal} className={renewalSoon ? "text-danger" : undefined} />
          </div>
        )}
      </Card>
    </Link>
  );
}
