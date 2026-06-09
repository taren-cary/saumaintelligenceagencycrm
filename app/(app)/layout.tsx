import { createClient } from "@/lib/supabase/server";
import { AppShell } from "@/components/crm/AppShell";

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient();
  const { data: clients } = await supabase.from("clients").select("id, name").order("name");

  return <AppShell clients={clients ?? []}>{children}</AppShell>;
}
