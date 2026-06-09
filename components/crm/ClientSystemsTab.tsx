"use client";

import { useState } from "react";
import { ChevronDown, ExternalLink, Plus, ShieldAlert, Wrench } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ComingSoon } from "@/components/crm/ComingSoon";
import { StatusBadge } from "@/components/crm/StatusBadge";
import { RelativeDate } from "@/components/crm/RelativeDate";
import { AddSystemSheet } from "@/components/crm/AddSystemSheet";
import { cn } from "@/lib/utils";
import type { Tables } from "@/lib/supabase/database.types";

type ClientSystem = Tables<"client_systems">;
type Integration = { name?: string; endpoint?: string; type?: string; status?: string };

function asIntegrations(value: ClientSystem["integrations"]): Integration[] {
  if (!Array.isArray(value)) return [];
  return value.filter((item): item is Integration => typeof item === "object" && item !== null);
}

export function ClientSystemsTab({ clientId, systems }: { clientId: string; systems: ClientSystem[] }) {
  const [addOpen, setAddOpen] = useState(false);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-sm text-text-secondary">
          {systems.length} system{systems.length === 1 ? "" : "s"} running for this client
        </p>
        <Button onClick={() => setAddOpen(true)}>
          <Plus className="h-4 w-4" />
          Add system
        </Button>
      </div>

      {systems.length === 0 ? (
        <ComingSoon
          icon={Wrench}
          title="No systems yet"
          description="Add the bots, integrations, and pipelines you've built for this client to keep architecture notes, credential references, and known issues in one place."
        />
      ) : (
        <div className="space-y-3">
          {systems.map((system) => (
            <SystemCard key={system.id} system={system} />
          ))}
        </div>
      )}

      <AddSystemSheet clientId={clientId} open={addOpen} onOpenChange={setAddOpen} />
    </div>
  );
}

function SystemCard({ system }: { system: ClientSystem }) {
  const [expanded, setExpanded] = useState(false);
  const integrations = asIntegrations(system.integrations);
  const links = [
    { label: "Repo", url: system.repo_url },
    { label: "Staging", url: system.staging_url },
    { label: "Production", url: system.production_url },
  ].filter((l): l is { label: string; url: string } => !!l.url);

  return (
    <div className="overflow-hidden rounded-xl border border-border bg-card">
      <button
        type="button"
        onClick={() => setExpanded((e) => !e)}
        className="flex w-full items-center justify-between gap-4 px-4 py-3 text-left transition-colors hover:bg-muted/40"
      >
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <p className="font-medium text-foreground">{system.name}</p>
            <StatusBadge status={system.status ?? "active"} />
          </div>
          {system.description && (
            <p className="mt-0.5 truncate text-sm text-text-secondary">{system.description}</p>
          )}
          {system.tech_stack && system.tech_stack.length > 0 && (
            <div className="mt-2 flex flex-wrap gap-1.5">
              {system.tech_stack.map((tech) => (
                <span
                  key={tech}
                  className="rounded-full border border-border bg-muted px-2 py-0.5 text-xs text-text-secondary"
                >
                  {tech}
                </span>
              ))}
            </div>
          )}
        </div>
        <ChevronDown
          className={cn("h-4 w-4 shrink-0 text-text-muted transition-transform", expanded && "rotate-180")}
        />
      </button>

      {expanded && (
        <div className="space-y-4 border-t border-border px-4 py-4">
          {(links.length > 0 || system.last_deployed_at) && (
            <div className="flex flex-wrap items-center gap-x-4 gap-y-1.5 text-sm">
              {links.map((link) => (
                <a
                  key={link.label}
                  href={link.url}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-1.5 text-primary transition-colors hover:underline"
                >
                  {link.label}
                  <ExternalLink className="h-3 w-3" />
                </a>
              ))}
              {system.last_deployed_at && (
                <span className="text-text-muted">
                  Last deployed <RelativeDate date={system.last_deployed_at} />
                </span>
              )}
            </div>
          )}

          {system.credentials_vault_note && (
            <div>
              <p className="mb-1 text-xs font-medium uppercase tracking-wide text-text-muted">Credentials</p>
              <p className="text-sm text-text-secondary">{system.credentials_vault_note}</p>
            </div>
          )}

          {integrations.length > 0 && (
            <div>
              <p className="mb-1.5 text-xs font-medium uppercase tracking-wide text-text-muted">Integrations</p>
              <div className="overflow-hidden rounded-lg border border-border">
                <table className="w-full text-sm">
                  <thead className="bg-muted/50 text-xs uppercase tracking-wide text-text-muted">
                    <tr>
                      <th className="px-3 py-1.5 text-left font-medium">Name</th>
                      <th className="px-3 py-1.5 text-left font-medium">Type</th>
                      <th className="px-3 py-1.5 text-left font-medium">Endpoint</th>
                      <th className="px-3 py-1.5 text-left font-medium">Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {integrations.map((integration, i) => (
                      <tr key={i} className="border-t border-border">
                        <td className="px-3 py-1.5 text-foreground">{integration.name ?? "—"}</td>
                        <td className="px-3 py-1.5 text-text-secondary">{integration.type ?? "—"}</td>
                        <td className="px-3 py-1.5 text-text-secondary">{integration.endpoint ?? "—"}</td>
                        <td className="px-3 py-1.5">
                          {integration.status ? <StatusBadge status={integration.status} /> : "—"}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {system.architecture_notes && (
            <div>
              <p className="mb-1 text-xs font-medium uppercase tracking-wide text-text-muted">Architecture notes</p>
              <p className="whitespace-pre-wrap text-sm text-text-secondary">{system.architecture_notes}</p>
            </div>
          )}

          {system.known_issues && (
            <div className="rounded-lg border border-warning/30 bg-warning/10 px-3 py-2.5">
              <p className="mb-1 inline-flex items-center gap-1.5 text-xs font-medium uppercase tracking-wide text-warning">
                <ShieldAlert className="h-3.5 w-3.5" />
                Known issues
              </p>
              <p className="whitespace-pre-wrap text-sm text-foreground/90">{system.known_issues}</p>
            </div>
          )}

          {system.on_call_instructions && (
            <div>
              <p className="mb-1 text-xs font-medium uppercase tracking-wide text-text-muted">On-call instructions</p>
              <p className="whitespace-pre-wrap text-sm text-text-secondary">{system.on_call_instructions}</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
