import { createFileRoute } from "@tanstack/react-router";
import { Users } from "lucide-react";
import { AppShell } from "@/components/layout/app-shell";
import { SectionHeader } from "@/components/shared/primitives";

export const Route = createFileRoute("/admin/users")({
  component: AdminUsers,
});

function AdminUsers() {
  return (
    <AppShell>
      <SectionHeader title="Users" subtitle="Manage VIATOR platform users." />

      <div className="float-card mt-8 p-8">
        <Users className="h-8 w-8 text-primary" />
        <h2 className="mt-4 text-lg font-bold">User management</h2>
        <p className="mt-2 text-sm text-muted-foreground">
          User management will be connected to the backend.
        </p>
      </div>
    </AppShell>
  );
}
