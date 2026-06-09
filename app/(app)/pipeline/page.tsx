import { createClient } from "@/lib/supabase/server";
import { PageHeader } from "@/components/crm/PageHeader";
import { PipelineView } from "@/components/crm/PipelineView";

export default async function PipelinePage() {
  const supabase = await createClient();
  const { data: prospects } = await supabase
    .from("pipeline")
    .select("*")
    .order("created_at", { ascending: false });

  return (
    <>
      <PageHeader
        title="Pipeline"
        description="Track prospects from lead to won — and the value moving through each stage."
      />
      <PipelineView prospects={prospects ?? []} />
    </>
  );
}
