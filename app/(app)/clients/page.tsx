import { createClient } from "@/lib/supabase/server";
import { ClientsView } from "@/components/crm/ClientsView";
import type { Tables } from "@/lib/supabase/database.types";

export type ClientWithStats = Tables<"clients"> & {
  openTaskCount: number;
  lastContactAt: string | null;
};

export default async function ClientsPage() {
  const supabase = await createClient();

  const [{ data: clients }, { data: tasks }, { data: comms }] = await Promise.all([
    supabase.from("clients").select("*").order("name"),
    supabase.from("tasks").select("client_id, status").neq("status", "done"),
    supabase.from("communications").select("client_id, logged_at"),
  ]);

  const openTaskCounts = new Map<string, number>();
  for (const t of tasks ?? []) {
    if (!t.client_id) continue;
    openTaskCounts.set(t.client_id, (openTaskCounts.get(t.client_id) ?? 0) + 1);
  }

  const lastContact = new Map<string, string>();
  for (const c of comms ?? []) {
    if (!c.client_id || !c.logged_at) continue;
    const existing = lastContact.get(c.client_id);
    if (!existing || c.logged_at > existing) lastContact.set(c.client_id, c.logged_at);
  }

  const clientsWithStats: ClientWithStats[] = (clients ?? []).map((c) => ({
    ...c,
    openTaskCount: openTaskCounts.get(c.id) ?? 0,
    lastContactAt: lastContact.get(c.id) ?? null,
  }));

  return <ClientsView clients={clientsWithStats} />;
}
