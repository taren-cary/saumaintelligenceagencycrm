"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import {
  CheckSquare,
  GitBranch,
  Loader2,
  MessagesSquare,
  Search,
  Users,
  X,
} from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { cn } from "@/lib/utils";

type ResultItem = {
  id: string;
  group: string;
  label: string;
  sub?: string;
  href: string;
  icon: React.ElementType;
};

const GROUPS = ["Clients", "Tasks", "Pipeline", "Communications"];

async function runSearch(q: string): Promise<ResultItem[]> {
  if (!q.trim()) return [];
  const supabase = createClient();
  const term = `%${q.trim()}%`;

  const [clients, tasks, pipeline, comms] = await Promise.all([
    supabase.from("clients").select("id, name, company, status").ilike("name", term).limit(5),
    supabase
      .from("tasks")
      .select("id, title, client_id, clients(id, name)")
      .ilike("title", term)
      .neq("status", "done")
      .limit(5),
    supabase
      .from("pipeline")
      .select("id, name, company, stage")
      .or(`name.ilike.${term},company.ilike.${term}`)
      .limit(5),
    supabase
      .from("communications")
      .select("id, subject, type, client_id, clients(id, name)")
      .ilike("subject", term)
      .limit(5),
  ]);

  const results: ResultItem[] = [];

  (clients.data ?? []).forEach((c) =>
    results.push({
      id: `client-${c.id}`,
      group: "Clients",
      label: c.name,
      sub: c.company ?? c.status ?? undefined,
      href: `/clients/${c.id}`,
      icon: Users,
    })
  );

  (tasks.data ?? []).forEach((t) => {
    const client = t.clients as { id: string; name: string } | null;
    results.push({
      id: `task-${t.id}`,
      group: "Tasks",
      label: t.title,
      sub: client?.name ?? undefined,
      href: client ? `/clients/${client.id}?tab=projects` : "/tasks",
      icon: CheckSquare,
    });
  });

  (pipeline.data ?? []).forEach((p) =>
    results.push({
      id: `pipeline-${p.id}`,
      group: "Pipeline",
      label: p.name,
      sub: p.company ?? p.stage ?? undefined,
      href: "/pipeline",
      icon: GitBranch,
    })
  );

  (comms.data ?? []).forEach((c) => {
    const client = c.clients as { id: string; name: string } | null;
    results.push({
      id: `comm-${c.id}`,
      group: "Communications",
      label: c.subject || `${c.type} log`,
      sub: client?.name ?? undefined,
      href: client ? `/clients/${client.id}?tab=communications` : "/clients",
      icon: MessagesSquare,
    });
  });

  return results;
}

export function GlobalCommandPalette({
  open,
  onClose,
}: {
  open: boolean;
  onClose: () => void;
}) {
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<ResultItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [activeIdx, setActiveIdx] = useState(0);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (open) {
      setQuery("");
      setResults([]);
      setActiveIdx(0);
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  }, [open]);

  const search = useCallback(async (q: string) => {
    if (!q.trim()) { setResults([]); setLoading(false); return; }
    setLoading(true);
    const res = await runSearch(q);
    setResults(res);
    setActiveIdx(0);
    setLoading(false);
  }, []);

  function handleInput(e: React.ChangeEvent<HTMLInputElement>) {
    const q = e.target.value;
    setQuery(q);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => search(q), 220);
  }

  function navigate(item: ResultItem) {
    router.push(item.href);
    onClose();
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === "Escape") { onClose(); return; }
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setActiveIdx((i) => Math.min(i + 1, results.length - 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setActiveIdx((i) => Math.max(i - 1, 0));
    } else if (e.key === "Enter" && results[activeIdx]) {
      navigate(results[activeIdx]);
    }
  }

  if (!open) return null;

  const grouped = GROUPS.map((g) => ({ group: g, items: results.filter((r) => r.group === g) })).filter(
    (g) => g.items.length > 0
  );

  return (
    <div
      className="fixed inset-0 z-50 flex items-start justify-center pt-[15vh]"
      role="dialog"
      aria-modal
      aria-label="Global search"
    >
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Panel */}
      <div className="relative z-10 w-full max-w-lg overflow-hidden rounded-xl border border-border bg-card shadow-2xl">
        {/* Input row */}
        <div className="flex items-center gap-3 border-b border-border px-4 py-3">
          {loading ? (
            <Loader2 className="h-4 w-4 shrink-0 animate-spin text-text-muted" />
          ) : (
            <Search className="h-4 w-4 shrink-0 text-text-muted" />
          )}
          <input
            ref={inputRef}
            value={query}
            onChange={handleInput}
            onKeyDown={handleKeyDown}
            placeholder="Search clients, tasks, pipeline…"
            className="flex-1 bg-transparent text-sm text-foreground placeholder:text-text-muted focus:outline-none"
          />
          <button
            type="button"
            onClick={onClose}
            className="rounded p-0.5 text-text-muted transition-colors hover:text-foreground"
            aria-label="Close search"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Results */}
        {grouped.length > 0 ? (
          <div className="max-h-96 overflow-y-auto py-2">
            {grouped.map(({ group, items }) => (
              <div key={group}>
                <p className="px-4 pb-1 pt-3 text-xs font-semibold uppercase tracking-wider text-text-muted">
                  {group}
                </p>
                {items.map((item) => {
                  const globalIdx = results.indexOf(item);
                  const Icon = item.icon;
                  return (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => navigate(item)}
                      onMouseEnter={() => setActiveIdx(globalIdx)}
                      className={cn(
                        "flex w-full items-center gap-3 px-4 py-2 text-left transition-colors",
                        globalIdx === activeIdx ? "bg-muted" : "hover:bg-muted/60"
                      )}
                    >
                      <Icon className="h-4 w-4 shrink-0 text-text-muted" />
                      <div className="min-w-0">
                        <p className="truncate text-sm text-foreground">{item.label}</p>
                        {item.sub && (
                          <p className="truncate text-xs text-text-muted">{item.sub}</p>
                        )}
                      </div>
                    </button>
                  );
                })}
              </div>
            ))}
          </div>
        ) : query.trim() && !loading ? (
          <p className="px-4 py-6 text-center text-sm text-text-muted">
            No results for &ldquo;{query}&rdquo;
          </p>
        ) : !query.trim() ? (
          <p className="px-4 py-6 text-center text-sm text-text-muted">
            Type to search across clients, tasks, and more&hellip;
          </p>
        ) : null}

        {/* Footer hint */}
        <div className="flex items-center gap-3 border-t border-border px-4 py-2">
          <span className="text-xs text-text-muted">
            <kbd className="rounded border border-border bg-muted px-1 py-0.5 font-mono text-xs">↑↓</kbd>{" "}
            navigate
          </span>
          <span className="text-xs text-text-muted">
            <kbd className="rounded border border-border bg-muted px-1 py-0.5 font-mono text-xs">↵</kbd>{" "}
            open
          </span>
          <span className="text-xs text-text-muted">
            <kbd className="rounded border border-border bg-muted px-1 py-0.5 font-mono text-xs">Esc</kbd>{" "}
            close
          </span>
        </div>
      </div>
    </div>
  );
}
