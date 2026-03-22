"use client";

import { useEffect } from "react";
import { useActionState } from "react";
import { useRouter } from "next/navigation";

import { deleteProjectAction } from "@/app/dashboard/projects/actions";

type FormState = { error?: string; success?: boolean } | null;
const initialState: FormState = null;

export function ProjectDeleteForm({ projectId }: { projectId: string }) {
  const router = useRouter();
  const [state, formAction, isPending] = useActionState(
    deleteProjectAction,
    initialState,
  );

  useEffect(() => {
    if (state?.success) {
      router.replace("/dashboard/projects");
      router.refresh();
    }
  }, [router, state?.success]);

  return (
    <form action={formAction} className="grid gap-2 rounded-2xl border border-red-200 bg-red-50/90 p-4">
      <h3 className="field-label text-red-700">Danger Zone</h3>
      <p className="text-xs text-red-700/90">
        Delete this project and all related records. This cannot be undone.
      </p>
      <input type="hidden" name="projectId" value={projectId} />

      {state?.error ? <p className="text-xs text-red-700">{state.error}</p> : null}

      <button
        type="submit"
        disabled={isPending}
        className="btn-danger text-sm disabled:opacity-60"
      >
        {isPending ? "Deleting..." : "Delete Project"}
      </button>
    </form>
  );
}
