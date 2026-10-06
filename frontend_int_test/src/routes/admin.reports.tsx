import { createFileRoute } from "@tanstack/react-router";
import { Flag } from "lucide-react";
import { AppShell } from "@/components/layout/app-shell";
import { SectionHeader } from "@/components/shared/primitives";

export const Route = createFileRoute("/admin/reports")({
  component: AdminReports,
});

function AdminReports() {
  return (
    <AppShell>
      <SectionHeader title="Reports" subtitle="Review and manage community reports." />

      <div className="float-card mt-8 p-8">
        <Flag className="h-8 w-8 text-primary" />
        <h2 className="mt-4 text-lg font-bold">Moderation reports</h2>
        <p className="mt-2 text-sm text-muted-foreground">
          Report management will be connected to the backend.
        </p>
      </div>
    </AppShell>
  );
}
