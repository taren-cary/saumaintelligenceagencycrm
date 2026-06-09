import { createClient } from "@/lib/supabase/server";
import { TasksView, type TaskRow } from "@/components/crm/TasksView";
import { PageHeader } from "@/components/crm/PageHeader";

export default async function TasksPage() {
  const supabase = await createClient();

  const [{ data: tasks }, { data: clients }] = await Promise.all([
    supabase
      .from("tasks")
      .select("*, clients(id, name)")
      .order("due_date", { ascending: true, nullsFirst: false })
      .order("priority", { ascending: false }),
    supabase.from("clients").select("id, name").order("name"),
  ]);

  return (
    <>
      <PageHeader
        title="Tasks"
        description="Every task across every client, sorted by what's due next."
      />
      <TasksView
        tasks={(tasks ?? []) as TaskRow[]}
        clients={clients ?? []}
      />
    </>
  );
}
