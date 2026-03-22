"use client";

import { useActionState } from "react";

import { createClientAction } from "@/app/dashboard/clients/actions";

type FormState = { error?: string; success?: boolean } | null;

const initialState: FormState = null;

export function NewClientForm() {
  const [state, formAction, isPending] = useActionState(
    createClientAction,
    initialState,
  );

  return (
    <form action={formAction} className="grid gap-3 p-2">
      <p className="text-xs font-semibold uppercase tracking-[0.12em] text-slate-600">
        Create
      </p>
      <h2 className="text-3xl font-semibold text-[#1f2f39]">New Client</h2>

      <input
        required
        name="name"
        placeholder="Client Name"
        className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2.5 text-sm"
      />
      <input
        name="email"
        type="email"
        placeholder="Email (optional)"
        className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2.5 text-sm"
      />
      <input
        name="phone"
        placeholder="Phone (optional)"
        className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2.5 text-sm"
      />
      <input
        name="businessType"
        placeholder="Business Type (optional)"
        className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2.5 text-sm"
      />

      {state?.error ? <p className="text-sm text-red-700">{state.error}</p> : null}
      {state?.success ? (
        <p className="text-sm text-emerald-800">Client added successfully.</p>
      ) : null}

      <button
        type="submit"
        disabled={isPending}
        className="rounded-xl bg-[#0a6f87] px-4 py-2.5 text-sm font-semibold text-white hover:bg-[#095f73] disabled:opacity-60"
      >
        {isPending ? "Saving..." : "Create Client"}
      </button>
    </form>
  );
}
