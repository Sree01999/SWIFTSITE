"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";

import { createClient } from "@/lib/supabase/client";

export function LoginForm() {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  async function onSubmit(formData: FormData) {
    const email = String(formData.get("email") ?? "");
    const password = String(formData.get("password") ?? "");

    setError(null);

    const supabase = createClient();
    const { error: signInError } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (signInError) {
      setError(signInError.message);
      return;
    }

    startTransition(() => {
      router.replace("/dashboard");
      router.refresh();
    });
  }

  return (
    <form action={onSubmit} className="fade-rise mx-auto flex w-full max-w-md flex-col gap-4 md:gap-5">
      <div className="space-y-1.5">
        <p className="type-label text-[#0a6f87]">Welcome back</p>
        <h1 className="type-h2 text-[#162536]">Log in to SwiftSite</h1>
        <p className="type-secondary text-slate-600">
          Access your secure operations dashboard.
        </p>
      </div>

      <label className="flex flex-col gap-1.5">
        <span className="field-label text-slate-700">Work email</span>
        <input
          required
          type="email"
          name="email"
          className="field-input h-11 placeholder:text-slate-400"
          placeholder="you@example.com"
          autoComplete="email"
        />
      </label>

      <label className="flex flex-col gap-1.5">
        <span className="field-label text-slate-700">Password</span>
        <input
          required
          type="password"
          name="password"
          className="field-input h-11 placeholder:text-slate-400"
          placeholder="********"
          autoComplete="current-password"
        />
      </label>

      {error ? (
        <p className="rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
          {error}
        </p>
      ) : null}

      <button
        type="submit"
        data-capability="auth-login"
        disabled={isPending}
        className="btn-primary h-11 w-full shadow-[0_10px_24px_rgba(10,111,135,0.24)] transition-all duration-150 hover:-translate-y-0.5 hover:shadow-[0_14px_28px_rgba(10,111,135,0.28)] active:translate-y-0 disabled:cursor-not-allowed disabled:opacity-60"
      >
        {isPending ? "Signing in..." : "Sign in"}
      </button>

      <div className="rounded-2xl border border-slate-200 bg-slate-50/80 px-4 py-3">
        <p className="type-secondary text-slate-600">
          Secure access is protected with session-aware controls and owner-scoped
          data policies.
        </p>
      </div>

      <p className="type-secondary text-slate-600">
        New here?{" "}
        <Link
          href="/auth/register"
          className="font-semibold text-[#0a6f87] underline-offset-4 hover:underline"
        >
          Create an account
        </Link>
      </p>
    </form>
  );
}
