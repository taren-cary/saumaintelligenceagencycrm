"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { GitBranch, LayoutGrid, List, Search, Users } from "lucide-react";
import { PageHeader } from "@/components/crm/PageHeader";
import { ComingSoon } from "@/components/crm/ComingSoon";
import { ClientCard } from "@/components/crm/ClientCard";
import { AddClientSheet } from "@/components/crm/AddClientSheet";
import { AddProspectSheet } from "@/components/crm/AddProspectSheet";
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

const STAGE_LABELS: Record<string, string> = {
  lead: "Lead",
  contacted: "Contacted",
  discovery: "Discovery",
  proposal: "Proposal",
  negotiation: "Negotiation",
  won: "Won",
  lost: "Lost",
};

const STAGE_COLORS: Record<string, string> = {
  lead: "bg-text-muted/20 text-text-muted",
  contacted: "bg-primary/10 text-primary",
  discovery: "bg-primary/20 text-primary",
  proposal: "bg-warning/20 text-warning",
  negotiation: "bg-warning/30 text-warning",
  won: "bg-success/20 text-success",
  lost: "bg-danger/20 text-danger",
};

function healthLabel(value: string) {
  return `${value} — ${healthScoreInfo(Number(value)).label}`;
}

type ViewTab = "clients" | "prospects";

export function ClientsView({ clients }: { clients: ClientWithStats[] }) {
  const [tab, setTab] = useState<ViewTab>("clients");
  const [view, setView] = useState<"table" | "grid">("table");
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>(ALL);
  const [healthFilter, setHealthFilter] = useState<string>(ALL);
  const [billingFilter, setBillingFilter] = useState<string>(ALL);
  const [addProspectOpen, setAddProspectOpen] = useState(false);

  const activeClients = useMemo(() => clients.filter((c) => c.status !== "prospect"), [clients]);
  const prospects = useMemo(() => clients.filter((c) => c.status === "prospect"), [clients]);
  const displayList = tab === "clients" ? activeClients : prospects;

  const statusOptions = useMemo(
    () => Array.from(new Set(activeClients.map((c) => c.status))).sort(),
    [activeClients]
  );
  const billingOptions = useMemo(
    () => Array.from(new Set(activeClients.map((c) => c.billing_model).filter((b): b is string => !!b))).sort(),
    [activeClients]
  );

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return displayList.filter((c) => {
      if (tab === "clients") {
        if (statusFilter !== ALL && c.status !== statusFilter) return false;
        if (healthFilter !== ALL && String(c.health_score ?? 3) !== healthFilter) return false;
        if (billingFilter !== ALL && c.billing_model !== billingFilter) return false;
      }
      if (q) {
        const haystack = [c.name, c.company, ...(c.tags ?? [])].filter(Boolean).join(" ").toLowerCase();
        if (!haystack.includes(q)) return false;
      }
      return true;
    });
  }, [displayList, search, statusFilter, healthFilter, billingFilter, tab]);

  const hasFilters = search.trim() !== "" || statusFilter !== ALL || healthFilter !== ALL || billingFilter !== ALL;

  return (
    <div>
      <PageHeader
        title="Clients"
        description={`${activeClients.length} client${activeClients.length === 1 ? "" : "s"}, ${prospects.length} prospect${prospects.length === 1 ? "" : "s"}`}
        actions={tab === "clients" ? <AddClientSheet /> : (
          <Button onClick={() => setAddProspectOpen(true)}>
            <GitBranch className="h-4 w-4" />
            Add prospect
          </Button>
        )}
      />

      {/* Tabs */}
      <div className="mb-4 flex items-center gap-1 rounded-lg border border-border bg-muted/30 p-1 w-fit">
        <button
          type="button"
          onClick={() => { setTab("clients"); setSearch(""); setStatusFilter(ALL); setHealthFilter(ALL); setBillingFilter(ALL); }}
          className={cn(
            "rounded-md px-4 py-1.5 text-sm font-medium transition-colors",
            tab === "clients" ? "bg-card text-foreground shadow-sm" : "text-text-secondary hover:text-foreground"
          )}
        >
          Clients <span className="ml-1.5 text-xs text-text-muted">{activeClients.length}</span>
        </button>
        <button
          type="button"
          onClick={() => { setTab("prospects"); setSearch(""); }}
          className={cn(
            "rounded-md px-4 py-1.5 text-sm font-medium transition-colors",
            tab === "prospects" ? "bg-card text-foreground shadow-sm" : "text-text-secondary hover:text-foreground"
          )}
        >
          Prospects <span className="ml-1.5 text-xs text-text-muted">{prospects.length}</span>
        </button>
      </div>

      {/* Filters */}
      <div className="mb-4 flex flex-wrap items-center gap-2">
        <div className="relative flex-1 min-w-[220px]">
          <Search className="pointer-events-none absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-text-muted" />
          <Input value={search} onChange={(e) => setSearch(e.target.value)} placeholder={`Search ${tab}...`} className="pl-8" />
        </div>

        {tab === "clients" && (
          <>
            <Select value={statusFilter} onValueChange={(v) => setStatusFilter(v ?? ALL)}>
              <SelectTrigger className="w-[150px]">
                <SelectValue placeholder="Status">{(v: string) => (v === ALL ? "All statuses" : formatLabel(v))}</SelectValue>
              </SelectTrigger>
              <SelectContent>
                <SelectItem value={ALL}>All statuses</SelectItem>
                {statusOptions.map((s) => <SelectItem key={s} value={s}>{formatLabel(s)}</SelectItem>)}
              </SelectContent>
            </Select>

            <Select value={healthFilter} onValueChange={(v) => setHealthFilter(v ?? ALL)}>
              <SelectTrigger className="w-[150px]">
                <SelectValue placeholder="Health">{(v: string) => (v === ALL ? "All health" : healthLabel(v))}</SelectValue>
              </SelectTrigger>
              <SelectContent>
                <SelectItem value={ALL}>All health</SelectItem>
                {["1","2","3","4","5"].map((v) => <SelectItem key={v} value={v}>{healthLabel(v)}</SelectItem>)}
              </SelectContent>
            </Select>

            {billingOptions.length > 0 && (
              <Select value={billingFilter} onValueChange={(v) => setBillingFilter(v ?? ALL)}>
                <SelectTrigger className="w-[150px]">
                  <SelectValue placeholder="Billing">{(v: string) => (v === ALL ? "All billing" : formatLabel(v))}</SelectValue>
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value={ALL}>All billing</SelectItem>
                  {billingOptions.map((b) => <SelectItem key={b} value={b}>{formatLabel(b)}</SelectItem>)}
                </SelectContent>
              </Select>
            )}
          </>
        )}

        {tab === "clients" && (
          <div className="ml-auto flex items-center gap-1 rounded-md border border-border p-0.5">
            <Button variant={view === "table" ? "secondary" : "ghost"} size="icon-sm" onClick={() => setView("table")} aria-label="Table view">
              <List className="h-4 w-4" />
            </Button>
            <Button variant={view === "grid" ? "secondary" : "ghost"} size="icon-sm" onClick={() => setView("grid")} aria-label="Grid view">
              <LayoutGrid className="h-4 w-4" />
            </Button>
          </div>
        )}
      </div>

      {/* Content */}
      {filtered.length === 0 ? (
        displayList.length === 0 ? (
          <ComingSoon
            icon={tab === "clients" ? Users : GitBranch}
            title={tab === "clients" ? "No clients yet" : "No prospects yet"}
            description={tab === "clients"
              ? "Add your first client to start tracking the relationship."
              : "Add a prospect to start tracking your pipeline."}
          />
        ) : (
          <ComingSoon icon={Search} title={`No ${tab} match your search`} description="Try adjusting your search." />
        )
      ) : tab === "prospects" ? (
        <ProspectsTable prospects={filtered} />
      ) : view === "grid" ? (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {filtered.map((client) => <ClientCard key={client.id} client={client} />)}
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
                  ? client.monthly_value ? `${formatCurrency(client.monthly_value)}/mo`
                  : client.hourly_rate ? `${formatCurrency(client.hourly_rate)}/hr` : null
                  : null;
                return (
                  <TableRow key={client.id} className="group">
                    <TableCell>
                      <Link href={`/clients/${client.id}`} className="block">
                        <p className="font-medium text-foreground group-hover:underline">{client.name}</p>
                        {client.company && <p className="text-xs text-text-secondary">{client.company}</p>}
                      </Link>
                    </TableCell>
                    <TableCell><StatusBadge status={client.status} /></TableCell>
                    <TableCell><HealthBadge score={client.health_score} /></TableCell>
                    <TableCell>
                      {client.billing_model ? (
                        <div className="text-sm">
                          <span className="capitalize text-text-secondary">{client.billing_model}</span>
                          {billingLine && <span className="text-text-muted"> · {billingLine}</span>}
                        </div>
                      ) : <span className="text-text-muted">—</span>}
                    </TableCell>
                    <TableCell><RelativeDate date={client.lastContactAt} /></TableCell>
                    <TableCell className="text-right tabular-nums">
                      {client.openTaskCount > 0 ? <span className="text-foreground">{client.openTaskCount}</span> : <span className="text-text-muted">0</span>}
                    </TableCell>
                    <TableCell>
                      {client.contract_renewal
                        ? <RelativeDate date={client.contract_renewal} className={cn(renewalSoon && "font-medium text-danger")} />
                        : <span className="text-text-muted">—</span>}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-1 opacity-0 transition-opacity group-hover:opacity-100">
                        <Button variant="ghost" size="sm" nativeButton={false} render={<Link href={`/clients/${client.id}`}>View</Link>} />
                        <Button variant="ghost" size="sm" nativeButton={false} render={<Link href={`/clients/${client.id}?tab=communications&log=1`}>Quick log</Link>} />
                      </div>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </div>
      )}

      <AddProspectSheet open={addProspectOpen} onOpenChange={setAddProspectOpen} />
    </div>
  );
}

function ProspectsTable({ prospects }: { prospects: ClientWithStats[] }) {
  return (
    <div className="overflow-hidden rounded-lg border border-border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Name</TableHead>
            <TableHead>Stage</TableHead>
            <TableHead>Value</TableHead>
            <TableHead>Probability</TableHead>
            <TableHead>Expected close</TableHead>
            <TableHead>Next action</TableHead>
            <TableHead>Last contact</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {prospects.map((p) => {
            const stage = p.pipeline_stage ?? "lead";
            return (
              <TableRow key={p.id} className="group">
                <TableCell>
                  <Link href={`/clients/${p.id}`} className="block">
                    <p className="font-medium text-foreground group-hover:underline">{p.name}</p>
                    {p.company && <p className="text-xs text-text-secondary">{p.company}</p>}
                  </Link>
                </TableCell>
                <TableCell>
                  <span className={cn("rounded-full px-2 py-0.5 text-xs font-medium capitalize", STAGE_COLORS[stage] ?? "bg-muted text-text-muted")}>
                    {STAGE_LABELS[stage] ?? stage}
                  </span>
                </TableCell>
                <TableCell>
                  {p.estimated_value != null
                    ? <span className="tabular-nums text-foreground">{formatCurrency(p.estimated_value)}</span>
                    : <span className="text-text-muted">—</span>}
                </TableCell>
                <TableCell>
                  {p.probability != null
                    ? <span className="tabular-nums text-text-secondary">{p.probability}%</span>
                    : <span className="text-text-muted">—</span>}
                </TableCell>
                <TableCell>
                  {p.expected_close ? <RelativeDate date={p.expected_close} /> : <span className="text-text-muted">—</span>}
                </TableCell>
                <TableCell>
                  {p.next_action
                    ? <span className="text-sm text-text-secondary">{p.next_action}</span>
                    : <span className="text-text-muted">—</span>}
                </TableCell>
                <TableCell><RelativeDate date={p.lastContactAt} /></TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
    </div>
  );
}
