import { PageHeader } from "@/components/crm/PageHeader";
import { SettingsView } from "@/components/crm/SettingsView";

export default function SettingsPage() {
  return (
    <>
      <PageHeader
        title="Settings"
        description="Profile, default rates, and data export."
      />
      <SettingsView />
    </>
  );
}
