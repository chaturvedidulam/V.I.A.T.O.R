import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { LogOut, Moon, Sun, UserCog } from "lucide-react";
import { toast } from "sonner";
import { AppShell } from "@/components/layout/app-shell";
import { SectionHeader } from "@/components/shared/primitives";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { useTheme } from "@/components/theme-provider";
import { useAuth } from "@/hooks/use-auth";
import { signOut } from "@/services/user";

export const Route = createFileRoute("/settings")({
  head: () => ({ meta: [{ title: "Settings — VIATOR" }, { name: "description", content: "Manage the VIATOR theme and account session." }] }),
  component: SettingsPage,
});

function SettingsPage() {
  const { theme, toggle } = useTheme();
  const { user } = useAuth();
  const navigate = useNavigate();

  return (
    <AppShell>
      <SectionHeader title="Settings" subtitle="Theme and account session" />
      <div className="mt-8 grid gap-6 lg:grid-cols-2">
        <section className="float-card p-6">
          <h2 className="flex items-center gap-2 text-sm font-bold uppercase tracking-wide text-muted-foreground">{theme === "dark" ? <Moon className="h-4 w-4" /> : <Sun className="h-4 w-4" />} Appearance</h2>
          <div className="mt-5 grid grid-cols-[minmax(0,1fr)_auto] items-center gap-4">
            <div><p className="text-sm font-semibold">Dark mode</p><p className="mt-0.5 text-xs text-muted-foreground">Saved in this browser.</p></div>
            <Switch checked={theme === "dark"} onCheckedChange={toggle} aria-label="Dark mode" />
          </div>
        </section>

        <section className="float-card p-6">
          <h2 className="flex items-center gap-2 text-sm font-bold uppercase tracking-wide text-muted-foreground"><UserCog className="h-4 w-4" /> Account</h2>
          <div className="mt-5">
            <p className="text-sm font-semibold">Signed-in email</p>
            <p className="mt-0.5 text-xs text-muted-foreground">{user?.email ?? "Sign in to view your account email."}</p>
          </div>
        </section>

        <section className="float-card p-6 lg:col-span-2">
          <h2 className="text-sm font-bold uppercase tracking-wide text-muted-foreground">Other preferences</h2>
          <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
            Notification, privacy, language, map-style, route-avoidance, and accessibility preferences are unavailable in V1 and are not saved.
          </p>
        </section>

        <section className="float-card p-6 lg:col-span-2">
          <h2 className="flex items-center gap-2 text-sm font-bold uppercase tracking-wide text-muted-foreground"><LogOut className="h-4 w-4" /> Session</h2>
          <Button variant="outline" className="mt-5 w-full rounded-xl" onClick={async () => {
            await signOut();
            toast.success("Signed out");
            navigate({ to: "/login" });
          }}>
            <LogOut className="h-4 w-4" /> Log out
          </Button>
        </section>
      </div>
    </AppShell>
  );
}
