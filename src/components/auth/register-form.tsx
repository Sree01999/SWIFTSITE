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
    <form action={onSubmit} className="fade-rise mx-auto flex w-full max-w-md flex-col gap-4 md:gap-5">
      <div className="space-y-1.5">
        <p className="type-label text-[#0a6f87]">Get started</p>
        <h1 className="type-h2 text-[#162536]">Create your workspace account</h1>
        <p className="type-secondary text-slate-600">
          Set up a secure operator login in less than a minute.
        </p>
      </div>

      <label className="flex flex-col gap-1.5">
        <span className="field-label text-slate-700">Full name</span>
        <input
          name="fullName"
          className="field-input h-11 placeholder:text-slate-400"
          placeholder="SwiftSite Operator"
          autoComplete="name"
        />
      </label>

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
          minLength={8}
          type="password"
          name="password"
          className="field-input h-11 placeholder:text-slate-400"
          placeholder="At least 8 characters"
          autoComplete="new-password"
        />
      </label>

      {error ? (
        <p className="rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
          {error}
        </p>
      ) : null}

      <button
        type="submit"
        data-capability="auth-register"
        disabled={isPending}
        className="btn-primary h-11 w-full shadow-[0_10px_24px_rgba(10,111,135,0.24)] transition-all duration-150 hover:-translate-y-0.5 hover:shadow-[0_14px_28px_rgba(10,111,135,0.28)] active:translate-y-0 disabled:cursor-not-allowed disabled:opacity-60"
      >
        {isPending ? "Creating account..." : "Create account"}
      </button>

      <div className="rounded-2xl border border-slate-200 bg-slate-50/80 px-4 py-3">
        <p className="type-secondary text-slate-600">
          Your workspace is protected by owner-scoped access policies from day one.
        </p>
      </div>

      <p className="type-secondary text-slate-600">
        Already have an account?{" "}
        <Link
          href="/auth/login"
          className="font-semibold text-[#0a6f87] underline-offset-4 hover:underline"
        >
          Log in
        </Link>
      </p>
    </form>
  );
}
