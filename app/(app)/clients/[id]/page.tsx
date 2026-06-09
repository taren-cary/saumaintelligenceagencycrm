import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { ClientDetailView, type ProjectWithTasks, type ClientTimeLog } from "@/components/crm/ClientDetailView";

export default async function ClientDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();

  const [
    { data: client },
    { data: systems },
    { data: communications },
    { data: scopeCreepTasks },
    { data: projects },
    { data: timeLogs },
    { data: decisions },
  ] = await Promise.all([
    supabase.from("clients").select("*").eq("id", id).maybeSingle(),
    supabase.from("client_systems").select("*").eq("client_id", id).order("name"),
    supabase
      .from("communications")
      .select("*")
      .eq("client_id", id)
      .order("logged_at", { ascending: false }),
    supabase
      .from("tasks")
      .select("id, title, status, is_scope_creep, created_at")
      .eq("client_id", id)
      .eq("is_scope_creep", true)
      .neq("status", "done")
      .order("created_at", { ascending: false }),
    supabase
      .from("projects")
      .select("*, tasks(*)")
      .eq("client_id", id)
      .order("created_at", { ascending: false }),
    supabase
      .from("time_logs")
      .select("*, projects(id, name), tasks(id, title)")
      .eq("client_id", id)
      .order("logged_date", { ascending: false }),
    supabase
      .from("decisions_log")
      .select("*")
      .eq("client_id", id)
      .order("logged_at", { ascending: false }),
  ]);

  if (!client) notFound();

  return (
    <ClientDetailView
      client={client}
      systems={systems ?? []}
      communications={communications ?? []}
      scopeCreepTasks={scopeCreepTasks ?? []}
      projects={(projects ?? []) as ProjectWithTasks[]}
      timeLogs={(timeLogs ?? []) as ClientTimeLog[]}
      decisions={decisions ?? []}
    />
  );
}
