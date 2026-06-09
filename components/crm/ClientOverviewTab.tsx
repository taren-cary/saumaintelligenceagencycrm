"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Check, Loader2, Plus, X } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { healthScoreInfo } from "@/components/crm/HealthBadge";
import { StatusBadge } from "@/components/crm/StatusBadge";
import { RelativeDate } from "@/components/crm/RelativeDate";
import { cn } from "@/lib/utils";
import type { Tables } from "@/lib/supabase/database.types";

type Client = Tables<"clients">;
type ScopeCreepTask = Pick<Tables<"tasks">, "id" | "title" | "status" | "is_scope_creep" | "created_at">;
type SaveResult = { error: { message: string } | null };

const HEALTH_SCORES = [1, 2, 3, 4, 5];

async function saveClientField(
  clientId: string,
  patch: Partial<Pick<Client, "notes" | "blocked_on_client" | "blocked_on_us" | "tags" | "health_score">>
): Promise<SaveResult> {
  const supabase = createClient();
  const { error } = await supabase.from("clients").update(patch).eq("id", clientId);
  return { error };
}

function useAutoSaveField(initialValue: string, save: (value: string) => Promise<SaveResult>) {
  const [value, setValue] = useState(initialValue);
  const [status, setStatus] = useState<"idle" | "saving" | "saved">("idle");
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  function onChange(next: string) {
    setValue(next);
    setStatus("idle");
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    timeoutRef.current = setTimeout(async () => {
      setStatus("saving");
      const { error } = await save(next);
      if (error) {
        toast.error("Failed to save", { description: error.message });
        setStatus("idle");
        return;
      }
      setStatus("saved");
    }, 900);
  }

  useEffect(
    () => () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
    },
    []
  );

  return { value, onChange, status };
}

function AutoSaveTextarea({
  value,
  onChange,
  status,
  placeholder,
  rows = 4,
}: {
  value: string;
  onChange: (value: string) => void;
  status: "idle" | "saving" | "saved";
  placeholder?: string;
  rows?: number;
}) {
  return (
    <div className="space-y-1.5">
      <Textarea value={value} onChange={(e) => onChange(e.target.value)} placeholder={placeholder} rows={rows} />
      <p className="text-xs text-text-muted">
        {status === "saving" ? (
          <span className="inline-flex items-center gap-1">
            <Loader2 className="h-3 w-3 animate-spin" />
            Saving...
          </span>
        ) : status === "saved" ? (
          <span className="inline-flex items-center gap-1 text-success">
            <Check className="h-3 w-3" />
            Saved
          </span>
        ) : (
          "Auto-saves as you type"
        )}
      </p>
    </div>
  );
}

function HealthScoreEditor({ clientId, score }: { clientId: string; score: number }) {
  const router = useRouter();
  const [saving, setSaving] = useState(false);

  async function setScore(next: number) {
    if (next === score || saving) return;
    setSaving(true);
    const { error } = await saveClientField(clientId, { health_score: next });
    setSaving(false);
    if (error) {
      toast.error("Failed to update health score", { description: error.message });
      return;
    }
    router.refresh();
  }

  return (
    <div className="flex flex-wrap gap-2">
      {HEALTH_SCORES.map((value) => {
        const info = healthScoreInfo(value);
        const active = value === score;
        return (
          <button
            key={value}
            type="button"
            disabled={saving}
            onClick={() => setScore(value)}
            className={cn(
              "flex items-center gap-2 rounded-lg border px-3 py-1.5 text-sm transition-colors disabled:opacity-60",
              active
                ? "border-foreground/30 bg-muted text-foreground"
                : "border-border text-text-secondary hover:border-foreground/20 hover:text-foreground"
            )}
          >
            <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: info.color }} />
            {value} — {info.label}
          </button>
        );
      })}
    </div>
  );
}

function TagsEditor({ clientId, tags }: { clientId: string; tags: string[] }) {
  const router = useRouter();
  const [draft, setDraft] = useState("");
  const [saving, setSaving] = useState(false);

  async function persist(next: string[]) {
    setSaving(true);
    const { error } = await saveClientField(clientId, { tags: next });
    setSaving(false);
    if (error) {
      toast.error("Failed to update tags", { description: error.message });
      return;
    }
    router.refresh();
  }

  function addTag(e: React.FormEvent) {
    e.preventDefault();
    const value = draft.trim();
    setDraft("");
    if (!value || tags.includes(value)) return;
    persist([...tags, value]);
  }

  function removeTag(tag: string) {
    persist(tags.filter((t) => t !== tag));
  }

  return (
    <div className="space-y-2">
      <div className="flex flex-wrap gap-1.5">
        {tags.map((tag) => (
          <span
            key={tag}
            className="inline-flex items-center gap-1 rounded-full border border-border bg-muted px-2 py-0.5 text-xs text-text-secondary"
          >
            {tag}
            <button
              type="button"
              onClick={() => removeTag(tag)}
              className="text-text-muted transition-colors hover:text-danger"
              aria-label={`Remove ${tag}`}
            >
              <X className="h-3 w-3" />
            </button>
          </span>
        ))}
        {tags.length === 0 && <span className="text-sm text-text-muted">No tags yet</span>}
      </div>
      <form onSubmit={addTag} className="flex gap-2">
        <Input
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          placeholder="Add a tag..."
          className="h-8 max-w-[200px]"
          disabled={saving}
        />
        <Button type="submit" variant="secondary" size="sm" disabled={saving || !draft.trim()}>
          <Plus className="h-3.5 w-3.5" />
          Add
        </Button>
      </form>
    </div>
  );
}

function ScopeCreepSection({ tasks }: { tasks: ScopeCreepTask[] }) {
  if (tasks.length === 0) {
    return <p className="text-sm text-text-muted">No open scope-creep flags. Nice and tidy.</p>;
  }

  return (
    <ul className="space-y-2">
      {tasks.map((task) => (
        <li
          key={task.id}
          className="flex items-center justify-between gap-3 rounded-lg border border-warning/30 bg-warning/10 px-3 py-2 text-sm"
        >
          <div className="min-w-0">
            <p className="truncate font-medium text-foreground">{task.title}</p>
            <p className="text-xs text-text-muted">
              Flagged <RelativeDate date={task.created_at} />
            </p>
          </div>
          <StatusBadge status={task.status ?? "todo"} />
        </li>
      ))}
    </ul>
  );
}

export function ClientOverviewTab({
  client,
  scopeCreepTasks,
}: {
  client: Client;
  scopeCreepTasks: ScopeCreepTask[];
}) {
  const notes = useAutoSaveField(client.notes ?? "", (value) =>
    saveClientField(client.id, { notes: value.trim() || null })
  );
  const blockedOnClient = useAutoSaveField(client.blocked_on_client ?? "", (value) =>
    saveClientField(client.id, { blocked_on_client: value.trim() || null })
  );
  const blockedOnUs = useAutoSaveField(client.blocked_on_us ?? "", (value) =>
    saveClientField(client.id, { blocked_on_us: value.trim() || null })
  );

  return (
    <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
      <div className="space-y-6 lg:col-span-2">
        <section className="space-y-3">
          <h2 className="text-sm font-semibold text-foreground">Health score</h2>
          <HealthScoreEditor clientId={client.id} score={client.health_score ?? 3} />
        </section>

        <section className="space-y-3">
          <h2 className="text-sm font-semibold text-foreground">Notes</h2>
          <AutoSaveTextarea
            value={notes.value}
            onChange={notes.onChange}
            status={notes.status}
            placeholder="Anything worth remembering about this client..."
            rows={6}
          />
        </section>

        <section className="space-y-3">
          <h2 className="text-sm font-semibold text-foreground">Blockers</h2>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <p className="mb-1.5 text-xs font-medium uppercase tracking-wide text-text-muted">
                Waiting on client
              </p>
              <AutoSaveTextarea
                value={blockedOnClient.value}
                onChange={blockedOnClient.onChange}
                status={blockedOnClient.status}
                placeholder="What do you need from them to move forward?"
                rows={4}
              />
            </div>
            <div>
              <p className="mb-1.5 text-xs font-medium uppercase tracking-wide text-text-muted">
                Waiting on us
              </p>
              <AutoSaveTextarea
                value={blockedOnUs.value}
                onChange={blockedOnUs.onChange}
                status={blockedOnUs.status}
                placeholder="What's on your plate before you can move forward?"
                rows={4}
              />
            </div>
          </div>
        </section>
      </div>

      <div className="space-y-6">
        <section className="space-y-3">
          <h2 className="text-sm font-semibold text-foreground">Tags</h2>
          <TagsEditor clientId={client.id} tags={client.tags ?? []} />
        </section>

        <section className="space-y-3">
          <h2 className="flex items-center gap-2 text-sm font-semibold text-foreground">
            Scope creep flags
            {scopeCreepTasks.length > 0 && <Badge variant="destructive">{scopeCreepTasks.length}</Badge>}
          </h2>
          <ScopeCreepSection tasks={scopeCreepTasks} />
        </section>
      </div>
    </div>
  );
}
