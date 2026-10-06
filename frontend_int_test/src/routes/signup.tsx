import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";
import { AuthLayout, Divider, GoogleButton } from "@/components/layout/auth-layout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { signInWithGoogle, signUp } from "@/services/user";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/signup")({
  head: () => ({
    meta: [
      { title: "Create account — VIATOR" },
      {
        name: "description",
        content:
          "Join VIATOR to save trips, score routes and share hidden gems with travellers worldwide.",
      },
      { property: "og:title", content: "Create account — VIATOR" },
      { property: "og:description", content: "Save trips, score routes and share hidden gems." },
    ],
  }),
  component: SignupPage,
});

function strengthOf(password: string) {
  let score = 0;
  if (password.length >= 8) score++;
  if (/[A-Z]/.test(password)) score++;
  if (/[0-9]/.test(password)) score++;
  if (/[^A-Za-z0-9]/.test(password)) score++;
  return score;
}

const LABELS = ["Too short", "Weak", "Fair", "Strong", "Excellent"];
const TONES = ["bg-muted", "bg-destructive", "bg-warning", "bg-primary", "bg-success"];

function SignupPage() {
  const navigate = useNavigate();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<{ name?: string; email?: string; password?: string }>({});

  const score = useMemo(() => strengthOf(password), [password]);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    const next: { name?: string; email?: string; password?: string } = {};
    if (name.trim().length < 2) next.name = "Tell us your name";
    if (!/^\S+@\S+\.\S+$/.test(email)) next.email = "Enter a valid email address";
    if (score < 2) next.password = "Use 8+ characters with a number or symbol";
    setErrors(next);
    if (Object.keys(next).length) return;

    setLoading(true);
    try {
      await signUp(name, email, password);
      toast.success("Account created");
      navigate({ to: "/dashboard" });
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Unable to create the account.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthLayout
      title="Create your account"
      subtitle="Save routes, follow contributors and get recommendations that fit how you travel."
      footer={
        <>
          Already have an account?{" "}
          <Link to="/login" className="font-semibold text-foreground hover:underline">
            Sign in
          </Link>
        </>
      }
    >
      <form onSubmit={submit} className="space-y-4" noValidate>
        <div className="space-y-2">
          <Label htmlFor="name">Full name</Label>
          <Input
            id="name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Alex Moreau"
            className="rounded-xl"
          />
          {errors.name && <p className="text-xs font-medium text-destructive">{errors.name}</p>}
        </div>

        <div className="space-y-2">
          <Label htmlFor="email">Email</Label>
          <Input
            id="email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="you@example.com"
            className="rounded-xl"
          />
          {errors.email && <p className="text-xs font-medium text-destructive">{errors.email}</p>}
        </div>

        <div className="space-y-2">
          <Label htmlFor="password">Password</Label>
          <Input
            id="password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="At least 8 characters"
            className="rounded-xl"
          />
          <div className="flex items-center gap-2 pt-1">
            <div className="flex flex-1 gap-1">
              {[0, 1, 2, 3].map((i) => (
                <span
                  key={i}
                  className={cn("h-1.5 flex-1 rounded-full", i < score ? TONES[score] : "bg-muted")}
                />
              ))}
            </div>
            <span className="w-20 shrink-0 text-right text-xs font-semibold text-muted-foreground">
              {LABELS[score]}
            </span>
          </div>
          {errors.password && (
            <p className="text-xs font-medium text-destructive">{errors.password}</p>
          )}
        </div>

        <Button type="submit" className="w-full rounded-xl" disabled={loading}>
          {loading && <Loader2 className="h-4 w-4 animate-spin" />}
          Create account
        </Button>
        <p className="text-xs leading-relaxed text-muted-foreground">
          By continuing you agree to the Terms of Service and Privacy Policy.
        </p>
      </form>

      <Divider label="or" />
      <GoogleButton
        onClick={async () => {
          try {
            await signInWithGoogle();
            navigate({ to: "/dashboard" });
          } catch (error) {
            toast.error(error instanceof Error ? error.message : "Unable to sign in.");
          }
        }}
      />
    </AuthLayout>
  );
}
