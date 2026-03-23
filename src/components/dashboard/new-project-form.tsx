"use client";

import { useActionState } from "react";

import { createProjectAction } from "@/app/dashboard/projects/actions";

type ClientOption = {
  id: string;
  name: string;
};

type FormState = { error?: string; success?: boolean } | null;
const initialState: FormState = null;

export function NewProjectForm({ clients }: { clients: ClientOption[] }) {
  const [state, formAction, isPending] = useActionState(
    createProjectAction,
    initialState,
  );

  return (
    <form action={formAction} className="grid gap-3 p-2">
      <p className="text-xs font-semibold uppercase tracking-[0.12em] text-slate-600">
        Create
      </p>
      <h2 className="text-3xl font-semibold text-[#1f2f39]">New Deployment</h2>

      <input
        required
        name="name"
        placeholder="Project Name"
        className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2.5 text-sm"
      />

      <select
        required
        name="clientId"
        className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2.5 text-sm"
        defaultValue=""
      >
        <option value="" disabled>
          Select Client
        </option>
        {clients.map((client) => (
          <option key={client.id} value={client.id}>
            {client.name}
          </option>
        ))}
      </select>

      <input
        name="techStack"
        defaultValue="nextjs"
        placeholder="Tech Stack"
        className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2.5 text-sm"
      />
      <input
        name="repoUrl"
        placeholder="Repo URL (optional)"
        className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2.5 text-sm"
      />
      <input
        name="deployHookUrl"
        placeholder="Deploy Hook URL (optional)"
        className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2.5 text-sm"
      />

      {state?.error ? <p className="text-sm text-red-700">{state.error}</p> : null}
      {state?.success ? (
        <p className="text-sm text-emerald-800">Project created successfully.</p>
      ) : null}

      <button
        type="submit"
        data-capability="projects-create"
        disabled={isPending || clients.length === 0}
        className="rounded-xl bg-[#0a6f87] px-4 py-2.5 text-sm font-semibold text-white hover:bg-[#095f73] disabled:opacity-60"
      >
        {isPending ? "Saving..." : "Create Project"}
      </button>
    </form>
  );
}
