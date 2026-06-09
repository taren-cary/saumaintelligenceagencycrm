"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import {
  ArrowLeft,
  Briefcase,
  Calendar,
  Clock,
  Globe,
  Mail,
  MessagesSquare,
  Phone,
  ScrollText,
  Wrench,
} from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { StatusBadge } from "@/components/crm/StatusBadge";
import { HealthBadge } from "@/components/crm/HealthBadge";
import { RelativeDate } from "@/components/crm/RelativeDate";
import { ClientOverviewTab } from "@/components/crm/ClientOverviewTab";
import { ClientSystemsTab } from "@/components/crm/ClientSystemsTab";
import { ClientProjectsTab } from "@/components/crm/ClientProjectsTab";
import { ClientCommunicationsTab } from "@/components/crm/ClientCommunicationsTab";
import { ClientTimeTab } from "@/components/crm/ClientTimeTab";
import { ClientDecisionsTab } from "@/components/crm/ClientDecisionsTab";
import { LogCommunicationSheet } from "@/components/crm/LogCommunicationSheet";
import { formatCurrency, formatLabel } from "@/lib/format";
import { daysUntil } from "@/lib/dates";
import { cn } from "@/lib/utils";
import type { Tables } from "@/lib/supabase/database.types";

type Client = Tables<"clients">;
type ClientSystem = Tables<"client_systems">;
type Communication = Tables<"communications">;
type ScopeCreepTask = Pick<Tables<"tasks">, "id" | "title" | "status" | "is_scope_creep" | "created_at">;
type DecisionLog = Tables<"decisions_log">;
type CommForDecisions = Pick<Tables<"communications">, "id" | "logged_at" | "decisions_made" | "subject">;

export type ProjectWithTasks = Tables<"projects"> & {
  tasks: Tables<"tasks">[];
};

export type ClientTimeLog = Tables<"time_logs"> & {
  projects: { id: string; name: string } | null;
  tasks: { id: string; title: string } | null;
};

const TABS = [
  { value: "overview", label: "Overview", icon: Briefcase },
  { value: "systems", label: "Systems", icon: Wrench },
  { value: "projects", label: "Projects", icon: ScrollText },
  { value: "communications", label: "Communications", icon: MessagesSquare },
  { value: "decisions", label: "Decisions", icon: ScrollText },
  { value: "time", label: "Time", icon: Clock },
] as const;

type TabValue = (typeof TABS)[number]["value"];

function isTabValue(value: string | null): value is TabValue {
  return TABS.some((t) => t.value === value);
}

export function ClientDetailView({
  client,
  systems,
  communications,
  scopeCreepTasks,
  projects,
  timeLogs,
  decisions,
}: {
  client: Client;
  systems: ClientSystem[];
  communications: Communication[];
  scopeCreepTasks: ScopeCreepTask[];
  projects: ProjectWithTasks[];
  timeLogs: ClientTimeLog[];
  decisions: DecisionLog[];
}) {
  const router = useRouter();
  const searchParams = useSearchParams();

  const tabParam = searchParams.get("tab");
  const activeTab: TabValue = isTabValue(tabParam) ? tabParam : "overview";

  const [logSheetOpen, setLogSheetOpen] = useState(searchParams.get("log") === "1");

  function handleTabChange(value: string) {
    const params = new URLSearchParams(searchParams.toString());
    params.set("tab", value);
    params.delete("log");
    router.replace(`/clients/${client.id}?${params.toString()}`, { scroll: false });
  }

  const renewalDays = daysUntil(client.contract_renewal);
  const renewalSoon = renewalDays !== null && renewalDays >= 0 && renewalDays < 30;

  const billingParts: string[] = [];
  if (client.billing_model) billingParts.push(formatLabel(client.billing_model));
  if (client.monthly_value) billingParts.push(`${formatCurrency(client.monthly_value)}/mo`);
  else if (client.hourly_rate) billingParts.push(`${formatCurrency(client.hourly_rate)}/hr`);
  if (client.payment_terms) billingParts.push(client.payment_terms);

  return (
    <div>
      <Link
        href="/clients"
        className="mb-4 inline-flex items-center gap-1.5 text-sm text-text-secondary transition-colors hover:text-foreground"
      >
        <ArrowLeft className="h-4 w-4" />
        Back to clients
      </Link>

      <div className="mb-6 rounded-xl border border-border bg-card p-5">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2.5">
              <h1 className="text-xl font-semibold tracking-tight text-foreground">{client.name}</h1>
              <StatusBadge status={client.status} />
              <HealthBadge score={client.health_score} />
            </div>
            {client.company && <p className="mt-1 text-sm text-text-secondary">{client.company}</p>}

            <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-1.5 text-sm text-text-secondary">
              {client.email && (
                <span className="inline-flex items-center gap-1.5">
                  <Mail className="h-3.5 w-3.5 text-text-muted" />
                  {client.email}
                </span>
              )}
              {client.phone && (
                <span className="inline-flex items-center gap-1.5">
                  <Phone className="h-3.5 w-3.5 text-text-muted" />
                  {client.phone}
                </span>
              )}
              {client.timezone && (
                <span className="inline-flex items-center gap-1.5">
                  <Globe className="h-3.5 w-3.5 text-text-muted" />
                  {client.timezone}
                </span>
              )}
              {client.comm_preference && (
                <span className="inline-flex items-center gap-1.5">
                  <MessagesSquare className="h-3.5 w-3.5 text-text-muted" />
                  Prefers {formatLabel(client.comm_preference).toLowerCase()}
                </span>
              )}
            </div>

            {(billingParts.length > 0 || client.contract_renewal) && (
              <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1.5 text-sm text-text-secondary">
                {billingParts.length > 0 && (
                  <span className="inline-flex items-center gap-1.5">
                    <Briefcase className="h-3.5 w-3.5 text-text-muted" />
                    {billingParts.join(" · ")}
                  </span>
                )}
                {client.contract_renewal && (
                  <span className="inline-flex items-center gap-1.5">
                    <Calendar className="h-3.5 w-3.5 text-text-muted" />
                    Renews{" "}
                    <RelativeDate
                      date={client.contract_renewal}
                      className={cn(renewalSoon && "font-medium text-danger")}
                    />
                  </span>
                )}
              </div>
            )}
          </div>

          <div className="flex shrink-0 items-center gap-2">
            <Button onClick={() => setLogSheetOpen(true)}>
              <MessagesSquare className="h-4 w-4" />
              Log Communication
            </Button>
          </div>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={(v) => typeof v === "string" && handleTabChange(v)}>
        <TabsList variant="line" className="mb-6">
          {TABS.map(({ value, label, icon: Icon }) => (
            <TabsTrigger key={value} value={value}>
              <Icon className="h-4 w-4" />
              {label}
            </TabsTrigger>
          ))}
        </TabsList>

        <TabsContent value="overview">
          <ClientOverviewTab client={client} scopeCreepTasks={scopeCreepTasks} />
        </TabsContent>

        <TabsContent value="systems">
          <ClientSystemsTab clientId={client.id} systems={systems} />
        </TabsContent>

        <TabsContent value="projects">
          <ClientProjectsTab
            clientId={client.id}
            projects={projects}
            systems={systems}
          />
        </TabsContent>

        <TabsContent value="communications">
          <ClientCommunicationsTab
            communications={communications}
            onLogCommunication={() => setLogSheetOpen(true)}
          />
        </TabsContent>

        <TabsContent value="decisions">
          <ClientDecisionsTab
            clientId={client.id}
            decisions={decisions}
            communications={communications as CommForDecisions[]}
            systems={systems.map((s) => ({ id: s.id, name: s.name }))}
          />
        </TabsContent>

        <TabsContent value="time">
          <ClientTimeTab
            clientId={client.id}
            clientName={client.name}
            projects={projects}
            timeLogs={timeLogs}
          />
        </TabsContent>
      </Tabs>

      <LogCommunicationSheet
        clientId={client.id}
        open={logSheetOpen}
        onOpenChange={setLogSheetOpen}
      />
    </div>
  );
}
