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
    <form action={onSubmit} className="fade-rise flex w-full max-w-md flex-col gap-4">
      <p className="eyebrow">Welcome Back</p>
      <h1 className="section-title">Log in</h1>
      <p className="text-sm text-slate-600">
        Sign in to access your SwiftSite operator dashboard.
      </p>

      <label className="flex flex-col gap-1">
        <span className="field-label">Email</span>
        <input
          required
          type="email"
          name="email"
          className="field-input"
          placeholder="you@example.com"
        />
      </label>

      <label className="flex flex-col gap-1">
        <span className="field-label">Password</span>
        <input
          required
          type="password"
          name="password"
          className="field-input"
          placeholder="********"
        />
      </label>

      {error ? <p className="text-sm text-red-700">{error}</p> : null}

      <button
        type="submit"
        disabled={isPending}
        className="btn-primary disabled:opacity-60"
      >
        {isPending ? "Signing in..." : "Sign in"}
      </button>

      <p className="text-sm text-slate-600">
        New here?{" "}
        <Link href="/auth/register" className="font-semibold text-emerald-800">
          Create an account
        </Link>
      </p>
    </form>
  );
}
