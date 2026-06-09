"use client";

import { useCallback, useEffect, useState } from "react";
import { Sidebar } from "@/components/crm/Sidebar";
import { GlobalCommandPalette } from "@/components/crm/GlobalCommandPalette";
import { AddClientSheet } from "@/components/crm/AddClientSheet";
import { GlobalLogCommunicationSheet } from "@/components/crm/GlobalLogCommunicationSheet";

type ClientStub = { id: string; name: string };

export function AppShell({
  clients,
  children,
}: {
  clients: ClientStub[];
  children: React.ReactNode;
}) {
  const [searchOpen, setSearchOpen] = useState(false);
  const [newClientOpen, setNewClientOpen] = useState(false);
  const [logCommOpen, setLogCommOpen] = useState(false);

  const handleKey = useCallback(
    (e: KeyboardEvent) => {
      const tag = (e.target as HTMLElement)?.tagName?.toLowerCase();
      const isEditing =
        tag === "input" ||
        tag === "textarea" ||
        tag === "select" ||
        (e.target as HTMLElement)?.isContentEditable;

      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        setSearchOpen(true);
        return;
      }

      if (isEditing) return;

      if (e.key === "/") {
        e.preventDefault();
        setSearchOpen(true);
        return;
      }
      if (e.key === "c" && !e.metaKey && !e.ctrlKey && !e.altKey) {
        setNewClientOpen(true);
        return;
      }
      if (e.key === "l" && !e.metaKey && !e.ctrlKey && !e.altKey) {
        setLogCommOpen(true);
        return;
      }
      if (e.key === "Escape") {
        setSearchOpen(false);
        setNewClientOpen(false);
        setLogCommOpen(false);
      }
    },
    []
  );

  useEffect(() => {
    document.addEventListener("keydown", handleKey);
    return () => document.removeEventListener("keydown", handleKey);
  }, [handleKey]);

  return (
    <div className="flex h-screen w-full overflow-hidden bg-background">
      <Sidebar onSearchOpen={() => setSearchOpen(true)} />
      <main className="flex-1 overflow-y-auto">
        <div className="mx-auto w-full max-w-[1280px] px-6 py-6 lg:px-8">{children}</div>
      </main>

      <GlobalCommandPalette open={searchOpen} onClose={() => setSearchOpen(false)} />
      <AddClientSheet open={newClientOpen} onOpenChange={setNewClientOpen} />
      <GlobalLogCommunicationSheet
        clients={clients}
        open={logCommOpen}
        onOpenChange={setLogCommOpen}
      />
    </div>
  );
}
