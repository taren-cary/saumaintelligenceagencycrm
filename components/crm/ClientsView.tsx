"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { LayoutGrid, List, Search, Users } from "lucide-react";
import { PageHeader } from "@/components/crm/PageHeader";
import { ComingSoon } from "@/components/crm/ComingSoon";
import { ClientCard } from "@/components/crm/ClientCard";
import { AddClientSheet } from "@/components/crm/AddClientSheet";
import { HealthBadge, healthScoreInfo } from "@/components/crm/HealthBadge";
import { StatusBadge } from "@/components/crm/StatusBadge";
import { RelativeDate } from "@/components/crm/RelativeDate";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { daysUntil } from "@/lib/dates";
import { formatCurrency, formatLabel } from "@/lib/format";
import { cn } from "@/lib/utils";
import type { ClientWithStats } from "@/app/(app)/clients/page";

const ALL = "all";

function healthLabel(value: string) {
  return `${value} — ${healthScoreInfo(Number(value)).label}`;
}

export function ClientsView({ clients }: { clients: ClientWithStats[] }) {
  const [view, setView] = useState<"table" | "grid">("table");
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>(ALL);
  const [healthFilter, setHealthFilter] = useState<string>(ALL);
  const [billingFilter, setBillingFilter] = useState<string>(ALL);

  const onStatusChange = (v: string | null) => setStatusFilter(v ?? ALL);
  const onHealthChange = (v: string | null) => setHealthFilter(v ?? ALL);
  const onBillingChange = (v: string | null) => setBillingFilter(v ?? ALL);

  const statusOptions = useMemo(
    () => Array.from(new Set(clients.map((c) => c.status))).sort(),
    [clients]
  );
  const billingOptions = useMemo(
    () =>
      Array.from(new Set(clients.map((c) => c.billing_model).filter((b): b is string => !!b))).sort(),
    [clients]
  );

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();

    return clients.filter((c) => {
      if (statusFilter !== ALL && c.status !== statusFilter) return false;
      if (healthFilter !== ALL && String(c.health_score ?? 3) !== healthFilter) return false;
      if (billingFilter !== ALL && c.billing_model !== billingFilter) return false;

      if (q) {
        const haystack = [c.name, c.company, ...(c.tags ?? [])]
          .filter(Boolean)
          .join(" ")
          .toLowerCase();
        if (!haystack.includes(q)) return false;
      }

      return true;
    });
  }, [clients, search, statusFilter, healthFilter, billingFilter]);

  const hasFilters =
    search.trim() !== "" || statusFilter !== ALL || healthFilter !== ALL || billingFilter !== ALL;

  return (
    <div>
      <PageHeader
        title="Clients"
        description={`${clients.length} client${clients.length === 1 ? "" : "s"} in your book of business`}
        actions={<AddClientSheet />}
      />

      <div className="mb-4 flex flex-wrap items-center gap-2">
        <div className="relative flex-1 min-w-[220px]">
          <Search className="pointer-events-none absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-text-muted" />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by name, company, or tag..."
            className="pl-8"
          />
        </div>

        <Select value={statusFilter} onValueChange={onStatusChange}>
          <SelectTrigger className="w-[150px]">
            <SelectValue placeholder="Status">
              {(v: string) => (v === ALL ? "All statuses" : formatLabel(v))}
            </SelectValue>
          </SelectTrigger>
          <SelectContent>
            <SelectItem value={ALL}>All statuses</SelectItem>
            {statusOptions.map((s) => (
              <SelectItem key={s} value={s}>
                {formatLabel(s)}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select value={healthFilter} onValueChange={onHealthChange}>
          <SelectTrigger className="w-[150px]">
            <SelectValue placeholder="Health">
              {(v: string) => (v === ALL ? "All health" : healthLabel(v))}
            </SelectValue>
          </SelectTrigger>
          <SelectContent>
            <SelectItem value={ALL}>All health</SelectItem>
            <SelectItem value="1">{healthLabel("1")}</SelectItem>
            <SelectItem value="2">{healthLabel("2")}</SelectItem>
            <SelectItem value="3">{healthLabel("3")}</SelectItem>
            <SelectItem value="4">{healthLabel("4")}</SelectItem>
            <SelectItem value="5">{healthLabel("5")}</SelectItem>
          </SelectContent>
        </Select>

        {billingOptions.length > 0 && (
          <Select value={billingFilter} onValueChange={onBillingChange}>
            <SelectTrigger className="w-[150px]">
              <SelectValue placeholder="Billing">
                {(v: string) => (v === ALL ? "All billing" : formatLabel(v))}
              </SelectValue>
            </SelectTrigger>
            <SelectContent>
              <SelectItem value={ALL}>All billing</SelectItem>
              {billingOptions.map((b) => (
                <SelectItem key={b} value={b}>
                  {formatLabel(b)}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        )}

        <div className="ml-auto flex items-center gap-1 rounded-md border border-border p-0.5">
          <Button
            variant={view === "table" ? "secondary" : "ghost"}
            size="icon-sm"
            onClick={() => setView("table")}
            aria-label="Table view"
          >
            <List className="h-4 w-4" />
          </Button>
          <Button
            variant={view === "grid" ? "secondary" : "ghost"}
            size="icon-sm"
            onClick={() => setView("grid")}
            aria-label="Grid view"
          >
            <LayoutGrid className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {filtered.length === 0 ? (
        clients.length === 0 ? (
          <ComingSoon
            icon={Users}
            title="No clients yet"
            description="Add your first client to start tracking the relationship — health, billing, systems, and every conversation in one place."
          />
        ) : (
          <ComingSoon
            icon={Search}
            title="No clients match your filters"
            description={
              hasFilters
                ? "Try adjusting your search or filters to see more results."
                : "Nothing to show here yet."
            }
          />
        )
      ) : view === "grid" ? (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {filtered.map((client) => (
            <ClientCard key={client.id} client={client} />
          ))}
        </div>
      ) : (
        <div className="overflow-hidden rounded-lg border border-border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Health</TableHead>
                <TableHead>Billing</TableHead>
                <TableHead>Last contact</TableHead>
                <TableHead className="text-right">Open tasks</TableHead>
                <TableHead>Renewal</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.map((client) => {
                const renewalDays = daysUntil(client.contract_renewal);
                const renewalSoon = renewalDays !== null && renewalDays >= 0 && renewalDays < 30;

                const billingLine = client.billing_model
                  ? client.monthly_value
                    ? `${formatCurrency(client.monthly_value)}/mo`
                    : client.hourly_rate
                      ? `${formatCurrency(client.hourly_rate)}/hr`
                      : null
                  : null;

                return (
                  <TableRow key={client.id} className="group">
                    <TableCell>
                      <Link href={`/clients/${client.id}`} className="block">
                        <p className="font-medium text-foreground group-hover:underline">
                          {client.name}
                        </p>
                        {client.company && (
                          <p className="text-xs text-text-secondary">{client.company}</p>
                        )}
                      </Link>
                    </TableCell>
                    <TableCell>
                      <StatusBadge status={client.status} />
                    </TableCell>
                    <TableCell>
                      <HealthBadge score={client.health_score} />
                    </TableCell>
                    <TableCell>
                      {client.billing_model ? (
                        <div className="text-sm">
                          <span className="capitalize text-text-secondary">{client.billing_model}</span>
                          {billingLine && <span className="text-text-muted"> · {billingLine}</span>}
                        </div>
                      ) : (
                        <span className="text-text-muted">—</span>
                      )}
                    </TableCell>
                    <TableCell>
                      <RelativeDate date={client.lastContactAt} />
                    </TableCell>
                    <TableCell className="text-right tabular-nums">
                      {client.openTaskCount > 0 ? (
                        <span className="text-foreground">{client.openTaskCount}</span>
                      ) : (
                        <span className="text-text-muted">0</span>
                      )}
                    </TableCell>
                    <TableCell>
                      {client.contract_renewal ? (
                        <RelativeDate
                          date={client.contract_renewal}
                          className={cn(renewalSoon && "font-medium text-danger")}
                        />
                      ) : (
                        <span className="text-text-muted">—</span>
                      )}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-1 opacity-0 transition-opacity group-hover:opacity-100">
                        <Button
                          variant="ghost"
                          size="sm"
                          nativeButton={false}
                          render={<Link href={`/clients/${client.id}`}>View</Link>}
                        />
                        <Button
                          variant="ghost"
                          size="sm"
                          nativeButton={false}
                          render={
                            <Link href={`/clients/${client.id}?tab=communications&log=1`}>
                              Quick log
                            </Link>
                          }
                        />
                      </div>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </div>
      )}
    </div>
  );
}
