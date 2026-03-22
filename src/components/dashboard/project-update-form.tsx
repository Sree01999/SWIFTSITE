"use client";

import { useActionState } from "react";

import { updateProjectAction } from "@/app/dashboard/projects/actions";
import {
  PROJECT_STATUS_OPTIONS,
  type ProjectStatus,
} from "@/app/dashboard/projects/constants";

type ProjectSnapshot = {
  id: string;
  status: ProjectStatus;
  tech_stack: string | null;
  repo_url: string | null;
  deploy_hook_url: string | null;
  vercel_project_id: string | null;
};

type FormState = { error?: string; success?: boolean } | null;
const initialState: FormState = null;

export function ProjectUpdateForm({ project }: { project: ProjectSnapshot }) {
  const [state, formAction, isPending] = useActionState(
    updateProjectAction,
    initialState,
  );

  return (
    <form action={formAction} className="soft-card grid gap-3 p-4">
      <p className="eyebrow">Manage</p>
      <h2 className="text-lg font-semibold">Update Project</h2>
      <input type="hidden" name="projectId" value={project.id} />

      <label className="grid gap-1">
        <span className="field-label">Status</span>
        <select
          name="status"
          defaultValue={project.status}
          className="field-input"
        >
          {PROJECT_STATUS_OPTIONS.map((status) => (
            <option key={status} value={status}>
              {status}
            </option>
          ))}
        </select>
      </label>

      <label className="grid gap-1">
        <span className="field-label">Tech Stack</span>
        <input
          name="techStack"
          defaultValue={project.tech_stack ?? "nextjs"}
          className="field-input"
        />
      </label>

      <label className="grid gap-1">
        <span className="field-label">Repo URL</span>
        <input
          name="repoUrl"
          defaultValue={project.repo_url ?? ""}
          className="field-input"
        />
      </label>

      <label className="grid gap-1">
        <span className="field-label">Deploy Hook URL</span>
        <input
          name="deployHookUrl"
          defaultValue={project.deploy_hook_url ?? ""}
          className="field-input"
        />
      </label>

      <label className="grid gap-1">
        <span className="field-label">Vercel Project ID</span>
        <input
          name="vercelProjectId"
          defaultValue={project.vercel_project_id ?? ""}
          className="field-input"
        />
      </label>

      {state?.error ? <p className="text-sm text-red-700">{state.error}</p> : null}
      {state?.success ? (
        <p className="text-sm text-emerald-800">Project updated successfully.</p>
      ) : null}

      <button
        type="submit"
        disabled={isPending}
        className="btn-primary disabled:opacity-60"
      >
        {isPending ? "Updating..." : "Save Changes"}
      </button>
    </form>
  );
}
