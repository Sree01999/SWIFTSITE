"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";

import { createClient } from "@/lib/supabase/client";

export function RegisterForm() {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  async function onSubmit(formData: FormData) {
    const email = String(formData.get("email") ?? "");
    const password = String(formData.get("password") ?? "");
    const fullName = String(formData.get("fullName") ?? "");

    setError(null);

    const supabase = createClient();
    const { error: signUpError } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          full_name: fullName,
        },
      },
    });

    if (signUpError) {
      setError(signUpError.message);
      return;
    }

    startTransition(() => {
      router.replace("/dashboard");
      router.refresh();
    });
  }

  return (
    <form action={onSubmit} className="fade-rise flex w-full max-w-md flex-col gap-4">
      <p className="eyebrow">Get Started</p>
      <h1 className="section-title">Create account</h1>
      <p className="text-sm text-slate-600">
        Set up your SwiftSite operator account.
      </p>

      <label className="flex flex-col gap-1">
        <span className="field-label">Full name</span>
        <input
          name="fullName"
          className="field-input"
          placeholder="SwiftSite Operator"
        />
      </label>

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
          minLength={8}
          type="password"
          name="password"
          className="field-input"
          placeholder="At least 8 characters"
        />
      </label>

      {error ? <p className="text-sm text-red-700">{error}</p> : null}

      <button
        type="submit"
        disabled={isPending}
        className="btn-primary disabled:opacity-60"
      >
        {isPending ? "Creating account..." : "Create account"}
      </button>

      <p className="text-sm text-slate-600">
        Already have an account?{" "}
        <Link href="/auth/login" className="font-semibold text-emerald-800">
          Log in
        </Link>
      </p>
    </form>
  );
}
