"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { CheckCircle2, Loader2, Lock, Mail } from "lucide-react";

type Mode = "password" | "magic";

export default function LoginPage() {
  const router = useRouter();
  const [mode, setMode] = useState<Mode>("password");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [status, setStatus] = useState<"idle" | "loading" | "sent" | "error">("idle");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setStatus("loading");
    setErrorMessage(null);

    const supabase = createClient();

    if (mode === "password") {
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) {
        setStatus("error");
        setErrorMessage(error.message);
        return;
      }
      router.push("/dashboard");
      router.refresh();
    } else {
      const { error } = await supabase.auth.signInWithOtp({
        email,
        options: { emailRedirectTo: `${window.location.origin}/auth/callback` },
      });
      if (error) {
        setStatus("error");
        setErrorMessage(error.message);
        return;
      }
      setStatus("sent");
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <Card className="w-full max-w-sm border-border bg-card">
        <CardHeader>
          <CardTitle className="text-xl font-semibold tracking-tight text-foreground">
            Sauma CRM
          </CardTitle>
          <CardDescription className="text-text-secondary">
            {mode === "password" ? "Sign in with your email and password." : "Sign in with a magic link sent to your email."}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {status === "sent" ? (
            <div className="flex flex-col items-center gap-3 py-6 text-center">
              <CheckCircle2 className="h-10 w-10 text-success" />
              <p className="text-sm text-foreground">Check your inbox</p>
              <p className="text-sm text-text-secondary">
                We sent a sign-in link to <span className="text-foreground">{email}</span>.
              </p>
              <button
                type="button"
                onClick={() => setStatus("idle")}
                className="text-xs text-text-muted underline hover:text-foreground"
              >
                Back
              </button>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="flex flex-col gap-4">
              <div className="flex flex-col gap-2">
                <Label htmlFor="email" className="text-text-secondary">Email</Label>
                <div className="relative">
                  <Mail className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-text-muted" />
                  <Input
                    id="email"
                    type="email"
                    placeholder="you@sauma.ai"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="pl-9"
                  />
                </div>
              </div>

              {mode === "password" && (
                <div className="flex flex-col gap-2">
                  <Label htmlFor="password" className="text-text-secondary">Password</Label>
                  <div className="relative">
                    <Lock className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-text-muted" />
                    <Input
                      id="password"
                      type="password"
                      placeholder="••••••••"
                      required
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="pl-9"
                    />
                  </div>
                </div>
              )}

              {status === "error" && errorMessage && (
                <p className="text-sm text-danger">{errorMessage}</p>
              )}

              <Button type="submit" disabled={status === "loading"} className="w-full">
                {status === "loading" ? (
                  <><Loader2 className="h-4 w-4 animate-spin" />{mode === "password" ? "Signing in..." : "Sending link..."}</>
                ) : mode === "password" ? (
                  "Sign in"
                ) : (
                  "Send magic link"
                )}
              </Button>

              <button
                type="button"
                onClick={() => { setMode(mode === "password" ? "magic" : "password"); setStatus("idle"); setErrorMessage(null); }}
                className="text-center text-xs text-text-muted transition-colors hover:text-foreground"
              >
                {mode === "password" ? "Sign in with magic link instead" : "Sign in with password instead"}
              </button>
            </form>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
