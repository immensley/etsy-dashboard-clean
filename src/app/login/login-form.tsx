"use client";

import { useEffect } from "react";
import { useFormState, useFormStatus } from "react-dom";
import { useRouter } from "next/navigation";
import { loginAction } from "@/lib/auth-actions";
import { initialAuthState, type AuthState } from "@/lib/auth-types";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" variant="primary" size="lg" disabled={pending}>
      {pending ? "Authenticating…" : "Enter dashboard"}
    </Button>
  );
}

export function LoginForm({ nextPath }: { nextPath?: string }) {
  const router = useRouter();
  const [state, formAction] = useFormState<AuthState, FormData>(loginAction, {
    ...initialAuthState,
    redirectTo: nextPath ?? "/admin",
  });

  useEffect(() => {
    if (state.success) {
      router.replace(state.redirectTo ?? "/admin");
    }
  }, [state.success, state.redirectTo, router]);

  return (
    <div className="relative min-h-screen bg-slate-950 text-white">
      <div className="pointer-events-none fixed inset-0 bg-[radial-gradient(circle_at_top,_rgba(56,189,248,0.18),_transparent_55%)]" />
      <div className="relative z-10 mx-auto flex min-h-screen max-w-md flex-col justify-center px-6 py-12">
        <Card className="space-y-6 border-white/10 bg-slate-900/80 p-8 shadow-[0_30px_120px_rgba(56,189,248,0.25)] backdrop-blur-xl">
          <div className="space-y-3">
            <Badge className="border-none bg-emerald-500/20 px-3 py-1 text-xs uppercase tracking-[0.32em] text-emerald-200">
              Secure access
            </Badge>
            <h1 className="text-3xl font-semibold leading-tight text-white">Sign in to MCP Orbit</h1>
            <p className="text-sm text-white/60">
              Enter the admin password to unlock the operations dashboards.
            </p>
          </div>
          <form action={formAction} className="space-y-5">
            <input type="hidden" name="next" value={nextPath ?? "/admin"} />
            <div className="space-y-2">
              <label htmlFor="password" className="text-xs uppercase tracking-[0.28em] text-white/50">
                Admin password
              </label>
              <input
                id="password"
                name="password"
                type="password"
                required
                autoFocus
                placeholder="••••••"
                className="w-full rounded-2xl border border-white/15 bg-white/10 px-4 py-3 text-base text-white placeholder:text-white/40 shadow-inner focus:border-emerald-400 focus:outline-none focus:ring-2 focus:ring-emerald-300/40"
              />
              {state.error && <p className="text-xs text-rose-200/90">{state.error}</p>}
            </div>
            <SubmitButton />
          </form>
        </Card>
      </div>
    </div>
  );
}
