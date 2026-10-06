import { createFileRoute } from "@tanstack/react-router";
import { BarChart3 } from "lucide-react";
import { AppShell } from "@/components/layout/app-shell";
import { SectionHeader } from "@/components/shared/primitives";

export const Route = createFileRoute("/admin/analytics")({
  component: AdminAnalytics,
});

function AdminAnalytics() {
  return (
    <AppShell>
      <SectionHeader title="Analytics" subtitle="Platform and community analytics." />

      <div className="float-card mt-8 p-8">
        <BarChart3 className="h-8 w-8 text-primary" />
        <h2 className="mt-4 text-lg font-bold">Analytics</h2>
        <p className="mt-2 text-sm text-muted-foreground">
          Detailed analytics will be connected to the backend.
        </p>
      </div>
    </AppShell>
  );
}
