import { createFileRoute, Link, Outlet, useRouterState } from "@tanstack/react-router";
import { BarChart3, Download, Flag, LayoutDashboard, Settings, Users } from "lucide-react";
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { toast } from "sonner";
import { Logo, ThemeToggle } from "@/components/layout/app-shell";
import { EmptyState, ListSkeleton, SectionHeader } from "@/components/shared/primitives";
import { Button } from "@/components/ui/button";
import { useAsync } from "@/hooks/use-async";
import {
  exportReports,
  getAdminMetrics,
  getGrowthSeries,
  getReports,
  resolveReport,
} from "@/services/admin";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/admin")({
  head: () => ({
    meta: [
      { title: "Admin dashboard — VIATOR" },
      {
        name: "description",
        content:
          "Platform metrics, user growth, community activity and moderation reports for VIATOR operators.",
      },
      { property: "og:title", content: "Admin dashboard — VIATOR" },
      {
        property: "og:description",
        content: "Platform metrics, growth charts and moderation reports.",
      },
    ],
  }),
  component: Admin,
});

const NAV = [
  { label: "Overview", icon: LayoutDashboard, to: "/admin" },
  { label: "Users", icon: Users, to: "/admin/users" },
  { label: "Reports", icon: Flag, to: "/admin/reports" },
  { label: "Analytics", icon: BarChart3, to: "/admin/analytics" },
  { label: "Settings", icon: Settings, to: "/admin/settings" },
] as const;

const STATUS: Record<string, string> = {
  pending: "bg-warning-soft text-warning-foreground",
  reviewing: "bg-accent text-accent-foreground",
  resolved: "bg-success-soft text-success",
};

function Admin() {
  const pathname = useRouterState({
    select: (state) => state.location.pathname,
  });

  const isAdminOverview = pathname === "/admin";

  const metrics = useAsync(() => getAdminMetrics(), []);

  const growth = useAsync(() => getGrowthSeries(), []);

  const reports = useAsync(() => getReports(), []);

  return (
    <div className="flex min-h-screen bg-background">
      {/* Sidebar */}
      <aside className="hidden w-64 shrink-0 flex-col border-r border-border bg-sidebar p-5 lg:flex">
        <Logo />
        <nav className="mt-8 space-y-1">
          {NAV.map((item) => (
            <Link
              key={item.label}
              to={item.to}
              activeProps={{
                className: "bg-sidebar-accent text-sidebar-accent-foreground",
              }}
              inactiveProps={{
                className: "text-muted-foreground hover:bg-muted",
              }}
              className="transition-premium flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-semibold"
            >
              <item.icon className="h-4 w-4 shrink-0" />
              {item.label}
            </Link>
          ))}
        </nav>
      </aside>

      <main className="min-w-0 flex-1 px-4 py-8 sm:px-8">
        {isAdminOverview ? (
          <>
            <div className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-4">
              <SectionHeader title="Platform overview" subtitle="Last 7 months · all regions" />
              <div className="flex shrink-0 items-center gap-2">
                <ThemeToggle />
                <Button
                  className="rounded-xl"
                  onClick={async () => {
                    await exportReports();
                    toast.success("Export ready");
                  }}
                >
                  <Download className="h-4 w-4" /> Export
                </Button>
              </div>
            </div>

            {/* Metrics */}
            <div className="mt-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
              {metrics.loading
                ? Array.from({ length: 4 }).map((_, i) => (
                    <div key={i} className="float-card h-28 animate-pulse" />
                  ))
                : (metrics.data ?? []).map((m) => (
                    <article key={m.id} className="float-card p-5">
                      <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                        {m.label}
                      </p>
                      <p className="mt-2 text-2xl font-bold">{m.value}</p>
                      <p
                        className={cn(
                          "mt-1 text-xs font-bold",
                          m.positive ? "text-success" : "text-destructive",
                        )}
                      >
                        {m.delta}
                      </p>
                    </article>
                  ))}
            </div>

            {/* Charts */}
            <div className="mt-8 grid gap-6 lg:grid-cols-2">
              <section className="float-card p-6">
                <h2 className="text-sm font-bold uppercase tracking-wide text-muted-foreground">
                  User growth
                </h2>
                <div className="mt-4 h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={growth.data ?? []}>
                      <CartesianGrid stroke="var(--color-border)" vertical={false} />
                      <XAxis dataKey="month" stroke="var(--color-muted-foreground)" fontSize={12} />
                      <YAxis stroke="var(--color-muted-foreground)" fontSize={12} />
                      <Tooltip
                        contentStyle={{
                          background: "var(--color-card)",
                          border: "1px solid var(--color-border)",
                          borderRadius: 12,
                        }}
                      />
                      <Area
                        type="monotone"
                        dataKey="users"
                        stroke="var(--color-chart-1)"
                        fill="var(--color-chart-1)"
                        fillOpacity={0.2}
                        strokeWidth={2}
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </section>

              <section className="float-card p-6">
                <h2 className="text-sm font-bold uppercase tracking-wide text-muted-foreground">
                  Community activity
                </h2>
                <div className="mt-4 h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={growth.data ?? []}>
                      <CartesianGrid stroke="var(--color-border)" vertical={false} />
                      <XAxis dataKey="month" stroke="var(--color-muted-foreground)" fontSize={12} />
                      <YAxis stroke="var(--color-muted-foreground)" fontSize={12} />
                      <Tooltip
                        contentStyle={{
                          background: "var(--color-card)",
                          border: "1px solid var(--color-border)",
                          borderRadius: 12,
                        }}
                      />
                      <Bar dataKey="posts" fill="var(--color-chart-2)" radius={[6, 6, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </section>
            </div>

            {/* Reports table */}
            <section className="mt-8">
              <SectionHeader title="Moderation reports" subtitle="Newest first" />
              {reports.loading ? (
                <div className="mt-6">
                  <ListSkeleton count={4} />
                </div>
              ) : (reports.data ?? []).length === 0 ? (
                <EmptyState
                  className="mt-6"
                  icon={Flag}
                  title="Queue is clear"
                  description="No open reports. Nice."
                />
              ) : (
                <div className="float-card mt-6 overflow-x-auto">
                  <table className="w-full min-w-[44rem] text-sm">
                    <thead>
                      <tr className="border-b border-border text-left text-xs uppercase tracking-wide text-muted-foreground">
                        <th className="p-4 font-semibold">Subject</th>
                        <th className="p-4 font-semibold">Reporter</th>
                        <th className="p-4 font-semibold">Type</th>
                        <th className="p-4 font-semibold">Status</th>
                        <th className="p-4 font-semibold">Date</th>
                        <th className="p-4 text-right font-semibold">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {(reports.data ?? []).map((r) => (
                        <tr key={r.id} className="border-b border-border last:border-0">
                          <td className="p-4 font-semibold">{r.subject}</td>
                          <td className="p-4 text-muted-foreground">@{r.reporter}</td>
                          <td className="p-4 text-muted-foreground">{r.type}</td>
                          <td className="p-4">
                            <span
                              className={cn(
                                "rounded-full px-2.5 py-1 text-[11px] font-bold uppercase tracking-wide",
                                STATUS[r.status],
                              )}
                            >
                              {r.status}
                            </span>
                          </td>
                          <td className="p-4 text-muted-foreground">{r.date}</td>
                          <td className="p-4">
                            <div className="flex justify-end gap-2">
                              <Button
                                size="sm"
                                variant="outline"
                                className="rounded-lg"
                                onClick={async () => {
                                  await resolveReport(r.id, "approve");
                                  toast.success("Approved");
                                }}
                              >
                                Approve
                              </Button>
                              <Button
                                size="sm"
                                variant="outline"
                                className="rounded-lg text-destructive"
                                onClick={async () => {
                                  await resolveReport(r.id, "remove");
                                  toast.success("Removed");
                                }}
                              >
                                Remove
                              </Button>
                              <Button size="sm" variant="ghost" className="rounded-lg">
                                View
                              </Button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </section>
          </>
        ) : (
          <Outlet />
        )}
      </main>
    </div>
  );
}
