import { createClient } from "@/lib/supabase/server";
import { DashboardView, type DashboardData } from "@/components/crm/DashboardView";

export default async function DashboardPage() {
  const supabase = await createClient();
  const today = new Date().toISOString().split("T")[0];
  const weekFromNow = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split("T")[0];

  const [
    { data: clients },
    { data: openTasks },
    { data: communications },
    { data: pipeline },
    { data: recentDoneTasks },
  ] = await Promise.all([
    supabase.from("clients").select("id, name, status, health_score, monthly_value, contract_renewal").neq("status", "prospect").order("health_score"),
    supabase
      .from("tasks")
      .select("id, title, status, priority, due_date, client_id, clients(id, name)")
      .neq("status", "done"),
    supabase
      .from("communications")
      .select("id, type, subject, summary, logged_at, follow_up_required, follow_up_date, follow_up_note, client_id, clients(id, name)")
      .order("logged_at", { ascending: false }),
    supabase
      .from("clients")
      .select("id, name, company, pipeline_stage, estimated_value, probability, next_action, next_action_date, expected_close")
      .eq("status", "prospect")
      .order("created_at"),
    supabase
      .from("tasks")
      .select("id, title, completed_at, client_id, clients(id, name)")
      .eq("status", "done")
      .not("completed_at", "is", null)
      .order("completed_at", { ascending: false })
      .limit(10),
  ]);

  const data: DashboardData = {
    clients: clients ?? [],
    openTasks: (openTasks ?? []) as DashboardData["openTasks"],
    communications: (communications ?? []) as DashboardData["communications"],
    pipeline: (pipeline ?? []) as DashboardData["pipeline"],
    recentDoneTasks: (recentDoneTasks ?? []) as DashboardData["recentDoneTasks"],
    today,
    weekFromNow,
  };

  return <DashboardView data={data} />;
}
