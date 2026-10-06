import { createFileRoute } from "@tanstack/react-router";
import { Settings } from "lucide-react";
import { AppShell } from "@/components/layout/app-shell";
import { SectionHeader } from "@/components/shared/primitives";

export const Route = createFileRoute("/admin/settings")({
  component: AdminSettings,
});

function AdminSettings() {
  return (
    <AppShell>
      <SectionHeader title="Settings" subtitle="Configure administrator preferences." />

      <div className="float-card mt-8 p-8">
        <Settings className="h-8 w-8 text-primary" />
        <h2 className="mt-4 text-lg font-bold">Admin settings</h2>
        <p className="mt-2 text-sm text-muted-foreground">
          Administrative settings will be connected to the backend.
        </p>
      </div>
    </AppShell>
  );
}
