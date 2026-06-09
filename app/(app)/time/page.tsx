import { createClient } from "@/lib/supabase/server";
import { TimeDashboardView, type GlobalTimeLog } from "@/components/crm/TimeDashboardView";
import { PageHeader } from "@/components/crm/PageHeader";

export default async function TimePage() {
  const supabase = await createClient();

  const [{ data: timeLogs }, { data: clients }, { data: projects }] = await Promise.all([
    supabase
      .from("time_logs")
      .select("*, clients(id, name), projects(id, name), tasks(id, title)")
      .order("logged_date", { ascending: false }),
    supabase.from("clients").select("id, name").order("name"),
    supabase.from("projects").select("id, name, client_id").order("name"),
  ]);

  return (
    <>
      <PageHeader
        title="Time"
        description="Hours logged, billable vs. non-billable, and revenue by client."
      />
      <TimeDashboardView
        timeLogs={(timeLogs ?? []) as GlobalTimeLog[]}
        clients={clients ?? []}
        projects={projects ?? []}
      />
    </>
  );
}
