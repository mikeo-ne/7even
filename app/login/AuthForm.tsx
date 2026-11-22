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
  const [notice, setNotice] = useState<string | null>(null);

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setNotice(null);
    setPending(true);

    const form = new FormData(event.currentTarget);
    const email = String(form.get("email") ?? "").trim();
    const password = String(form.get("password") ?? "");
    const fullName = String(form.get("full_name") ?? "").trim();

    if (mode === "signup") {
      if (password.length < 8) {
        setError("Use at least 8 characters for your password.");
        setPending(false);
        return;
      }
      if (!fullName) {
        setError("Tell us your name or your label name.");
        setPending(false);
        return;
      }
      const { data, error: signUpError } = await supabase.auth.signUp({
        email,
        password,
        options: { data: { full_name: fullName } },
      });

      if (signUpError) {
        setError(signUpError.message);
        setPending(false);
        return;
      }
      if (!data.session) {
        setNotice("Check your inbox to confirm your email, then sign in.");
        setPending(false);
        setMode("signin");
        return;
      }
    } else {
      const { error: signInError } = await supabase.auth.signInWithPassword({ email, password });
      if (signInError) {
        setError(signInError.message);
        setPending(false);
        return;
      }
    }

    router.replace("/dashboard");
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
        {mode === "signin" ? "Welcome back" : "Start your label"}
      </h1>
      <p className="mt-2 text-sm text-mute">
        {mode === "signin"
          ? "Sign in to your catalogue, earnings and payouts."
          : "Free to start. Your label workspace is created automatically."}
      </p>

      <form onSubmit={onSubmit} className="mt-8 space-y-4">
        {mode === "signup" && (
          <Field label="Name or label name">
            <input
              name="full_name"
              type="text"
              autoComplete="organization"
              placeholder="Kampala Sound"
              className={inputCls}
            />
          </Field>
        )}
        <Field label="Email">
          <input
            name="email"
            type="email"
            autoComplete="email"
            required
            placeholder="you@label.com"
            className={inputCls}
          />
        </Field>
        <Field label="Password">
          <input
            name="password"
            type="password"
            autoComplete={mode === "signin" ? "current-password" : "new-password"}
            required
            placeholder="••••••••"
            className={inputCls}
          />
        </Field>

        {error && (
          <p className="rounded-lg border border-rose-500/30 bg-rose-500/10 px-3 py-2.5 text-xs leading-relaxed text-rose-300">
            {error}
          </p>
        )}
        {notice && (
          <p className="rounded-lg border border-lime/30 bg-lime/10 px-3 py-2.5 text-xs leading-relaxed text-lime">
            {notice}
          </p>
        )}

        <button
          type="submit"
          disabled={pending}
          className="flex w-full items-center justify-center gap-2 rounded-full bg-lime px-5 py-3 text-sm font-semibold text-ink transition hover:bg-lime-dim disabled:cursor-not-allowed disabled:opacity-60"
        >
          {pending && <Loader2 className="size-4 animate-spin" />}
          {mode === "signin" ? "Sign in" : "Create account"}
        </button>
      </form>

      <p className="mt-6 text-center text-xs text-mute">
        {mode === "signin" ? "New to 7even?" : "Already have an account?"}{" "}
        <button
          type="button"
          onClick={() => {
            setMode(mode === "signin" ? "signup" : "signin");
            setError(null);
            setNotice(null);
          }}
          className="font-medium text-lime transition hover:text-lime-dim"
        >
          {mode === "signin" ? "Create one" : "Sign in"}
        </button>
      </p>
    </div>
  );
}

const inputCls =
  "w-full rounded-lg border border-line bg-ink-soft px-3.5 py-2.5 text-sm text-white placeholder:text-white/25 outline-none transition focus:border-lime/60 focus:ring-2 focus:ring-lime/15";

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-xs font-medium text-mute">{label}</span>
      {children}
    </label>
  );
}
