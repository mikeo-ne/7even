"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Loader2 } from "lucide-react";
import { createClient } from "@/lib/supabase/client";

export function AuthForm() {
  const router = useRouter();
  const supabase = createClient();

  const [mode, setMode] = useState<"signin" | "signup">("signup");
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setPending(true);

    const form = new FormData(event.currentTarget);
    const email = String(form.get("email") ?? "").trim();
    const password = String(form.get("password") ?? "");

    if (mode === "signup" && password.length < 8) {
      setError("Use at least 8 characters for your password.");
      setPending(false);
      return;
    }

    const result =
      mode === "signup"
        ? await supabase.auth.signUp({ email, password })
        : await supabase.auth.signInWithPassword({ email, password });

    if (result.error) {
      setError(result.error.message);
      setPending(false);
      return;
    }

    router.replace("/app");
    router.refresh();
  }

  return (
    <div className="w-full max-w-sm">
      <Link
        href="/"
        className="inline-flex items-center gap-1.5 text-xs text-mute transition hover:text-white"
      >
        <ArrowLeft className="size-3.5" />
        Back to site
      </Link>

      <h1 className="mt-8 text-2xl font-semibold tracking-tight">
        {mode === "signin" ? "Welcome back" : "Open your control room"}
      </h1>
      <p className="mt-2 text-sm text-mute">
        {mode === "signin"
          ? "Sign in to your queue, businesses and agents."
          : "This is the cloud half. Your Mac runs the agent."}
      </p>

      <form onSubmit={onSubmit} className="mt-8 space-y-4">
        <label className="block">
          <span className="mb-1.5 block text-xs text-mute">Email</span>
          <input
            name="email"
            type="email"
            required
            autoComplete="email"
            placeholder="you@example.com"
            className={input}
          />
        </label>
        <label className="block">
          <span className="mb-1.5 block text-xs text-mute">Password</span>
          <input
            name="password"
            type="password"
            required
            autoComplete={mode === "signin" ? "current-password" : "new-password"}
            placeholder="••••••••"
            className={input}
          />
        </label>

        {error && (
          <p className="rounded-lg border border-rose-500/30 bg-rose-500/10 px-3 py-2.5 text-xs text-rose-300">
            {error}
          </p>
        )}

        <button
          type="submit"
          disabled={pending}
          className="flex w-full items-center justify-center gap-2 rounded-full bg-signal px-5 py-3 text-sm font-semibold text-ink transition hover:bg-signal-dim disabled:opacity-60"
        >
          {pending && <Loader2 className="size-4 animate-spin" />}
          {mode === "signin" ? "Sign in" : "Create account"}
        </button>
      </form>

      <p className="mt-6 text-center text-xs text-mute">
        {mode === "signin" ? "No account yet?" : "Already have one?"}{" "}
        <button
          type="button"
          onClick={() => {
            setMode(mode === "signin" ? "signup" : "signin");
            setError(null);
          }}
          className="font-medium text-signal transition hover:text-signal-dim"
        >
          {mode === "signin" ? "Create one" : "Sign in"}
        </button>
      </p>
    </div>
  );
}

const input =
  "w-full rounded-lg border border-line bg-soft px-3.5 py-2.5 text-sm text-white placeholder:text-white/25 outline-none transition focus:border-signal/60 focus:ring-2 focus:ring-signal/15";
