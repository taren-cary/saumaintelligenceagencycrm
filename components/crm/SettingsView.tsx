"use client";

import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Download, Loader2, Save } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

const STORAGE_KEY = "sauma_crm_settings";

type Settings = {
  displayName: string;
  defaultHourlyRate: string;
  defaultTimezone: string;
};

const defaultSettings: Settings = {
  displayName: "",
  defaultHourlyRate: "",
  defaultTimezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
};

function loadSettings(): Settings {
  if (typeof window === "undefined") return defaultSettings;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return defaultSettings;
    return { ...defaultSettings, ...JSON.parse(raw) };
  } catch {
    return defaultSettings;
  }
}

const EXPORT_TABLES = [
  "clients",
  "client_systems",
  "projects",
  "tasks",
  "time_logs",
  "communications",
  "decisions_log",
] as const;

export function SettingsView() {
  const [settings, setSettings] = useState<Settings>(defaultSettings);
  const [saving, setSaving] = useState(false);
  const [exporting, setExporting] = useState(false);

  useEffect(() => {
    setSettings(loadSettings());
  }, []);

  function update(key: keyof Settings, value: string) {
    setSettings((s) => ({ ...s, [key]: value }));
  }

  function handleSave() {
    setSaving(true);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(settings));
    setTimeout(() => {
      setSaving(false);
      toast.success("Settings saved");
    }, 300);
  }

  async function handleExport() {
    setExporting(true);
    const supabase = createClient();

    try {
      const results = await Promise.all(
        EXPORT_TABLES.map(async (table) => {
          const { data, error } = await supabase.from(table).select("*");
          if (error) throw new Error(`${table}: ${error.message}`);
          return [table, data] as const;
        })
      );

      const payload = Object.fromEntries(results);
      const json = JSON.stringify(
        {
          exportedAt: new Date().toISOString(),
          tables: payload,
        },
        null,
        2
      );

      const blob = new Blob([json], { type: "application/json" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `sauma-crm-export-${new Date().toISOString().split("T")[0]}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      toast.success("Export downloaded");
    } catch (err) {
      toast.error("Export failed", { description: String(err) });
    } finally {
      setExporting(false);
    }
  }

  return (
    <div className="max-w-lg space-y-8">
      {/* Profile section */}
      <section className="rounded-xl border border-border bg-card p-5">
        <h2 className="mb-4 text-sm font-semibold text-foreground">Profile</h2>
        <div className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="s-name">Display name</Label>
            <Input
              id="s-name"
              placeholder="e.g. Alex"
              value={settings.displayName}
              onChange={(e) => update("displayName", e.target.value)}
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="s-tz">Default timezone</Label>
            <Input
              id="s-tz"
              placeholder="e.g. America/Chicago"
              value={settings.defaultTimezone}
              onChange={(e) => update("defaultTimezone", e.target.value)}
            />
            <p className="text-xs text-text-muted">Used for date/time display formatting.</p>
          </div>
        </div>
      </section>

      {/* Defaults section */}
      <section className="rounded-xl border border-border bg-card p-5">
        <h2 className="mb-4 text-sm font-semibold text-foreground">Defaults</h2>
        <div className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="s-rate">Default hourly rate ($)</Label>
            <Input
              id="s-rate"
              type="number"
              min="0"
              step="5"
              placeholder="e.g. 150"
              value={settings.defaultHourlyRate}
              onChange={(e) => update("defaultHourlyRate", e.target.value)}
            />
            <p className="text-xs text-text-muted">Used for time tracking revenue estimates.</p>
          </div>
        </div>
      </section>

      <Button onClick={handleSave} disabled={saving}>
        {saving ? (
          <><Loader2 className="h-4 w-4 animate-spin" />Saving…</>
        ) : (
          <><Save className="h-4 w-4" />Save settings</>
        )}
      </Button>

      {/* Export section */}
      <section className="rounded-xl border border-border bg-card p-5">
        <h2 className="mb-1 text-sm font-semibold text-foreground">Export data</h2>
        <p className="mb-4 text-sm text-text-secondary">
          Download a full JSON export of all your CRM data — clients, projects, tasks, time logs,
          communications, decisions, and pipeline.
        </p>
        <Button variant="secondary" onClick={handleExport} disabled={exporting}>
          {exporting ? (
            <><Loader2 className="h-4 w-4 animate-spin" />Exporting…</>
          ) : (
            <><Download className="h-4 w-4" />Export all data</>
          )}
        </Button>
        <p className="mt-3 text-xs text-text-muted">
          Exports: {EXPORT_TABLES.join(", ")}
        </p>
      </section>

      {/* Keyboard shortcuts reference */}
      <section className="rounded-xl border border-border bg-card p-5">
        <h2 className="mb-3 text-sm font-semibold text-foreground">Keyboard shortcuts</h2>
        <dl className="space-y-2">
          {[
            ["⌘K or /", "Global search"],
            ["c", "New client"],
            ["l", "Log communication"],
          ].map(([key, label]) => (
            <div key={key} className="flex items-center justify-between">
              <dt className="text-sm text-text-secondary">{label}</dt>
              <dd>
                <kbd className="rounded border border-border bg-muted px-2 py-0.5 font-mono text-xs text-foreground">
                  {key}
                </kbd>
              </dd>
            </div>
          ))}
        </dl>
      </section>
    </div>
  );
}
