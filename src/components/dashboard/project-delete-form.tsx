"use client";

import { useEffect, useState } from "react";
import { useActionState } from "react";

import { deleteProjectAction } from "@/app/dashboard/projects/actions";

type FormState = { error?: string; success?: boolean } | null;
const initialState: FormState = null;
const DELETE_UNLOCK_SECONDS = 5;

type ProjectDeleteFormProps = {
  projectId: string;
  projectName: string;
  deploymentCount: number;
  domainCount: number;
};

export function ProjectDeleteForm({
  projectId,
  projectName,
  deploymentCount,
  domainCount,
}: ProjectDeleteFormProps) {
  const [confirmProjectName, setConfirmProjectName] = useState("");
  const [confirmDeleteWord, setConfirmDeleteWord] = useState("");
  const [acknowledgeDelete, setAcknowledgeDelete] = useState(false);
  const [unlockCountdown, setUnlockCountdown] = useState(DELETE_UNLOCK_SECONDS);
  const [state, formAction, isPending] = useActionState(
    deleteProjectAction,
    initialState,
  );

  const hasValidName = confirmProjectName.trim() === projectName;
  const hasValidDeleteWord = confirmDeleteWord.trim().toUpperCase() === "DELETE";
  const confirmationsComplete =
    hasValidName && hasValidDeleteWord && acknowledgeDelete;

  useEffect(() => {
    if (!confirmationsComplete) return;

    if (unlockCountdown === 0) {
      return;
    }

    const timer = window.setTimeout(() => {
      setUnlockCountdown((prev) => Math.max(0, prev - 1));
    }, 1000);

    return () => window.clearTimeout(timer);
  }, [confirmationsComplete, unlockCountdown]);

  const isDeleteUnlocked = confirmationsComplete && unlockCountdown === 0;
  const disableDelete = isPending || !isDeleteUnlocked;

  return (
    <form action={formAction} className="grid gap-4 rounded-2xl border border-red-200 bg-red-50/90 p-4">
      <h3 className="field-label text-red-700">Danger zone</h3>
      <p className="text-sm text-red-700/90">
        Permanent delete is irreversible and removes project-linked operational data.
      </p>

      <div className="rounded-xl border border-red-200 bg-white/70 px-3 py-3 text-sm text-red-800">
        <p>
          Impact preview: {deploymentCount} deployment
          {deploymentCount === 1 ? "" : "s"} and {domainCount} domain
          {domainCount === 1 ? "" : "s"} linked to this project.
        </p>
      </div>

      <input type="hidden" name="projectId" value={projectId} />

      <label className="grid gap-1">
        <span className="field-label text-red-800">Type project name to confirm</span>
        <input
          type="text"
          name="confirmProjectName"
          value={confirmProjectName}
          onChange={(event) => {
            setConfirmProjectName(event.target.value);
            setUnlockCountdown(DELETE_UNLOCK_SECONDS);
          }}
          className="field-input"
          placeholder={projectName}
          autoComplete="off"
          spellCheck={false}
        />
      </label>

      <label className="grid gap-1">
        <span className="field-label text-red-800">Type DELETE to continue</span>
        <input
          type="text"
          name="confirmDeleteWord"
          value={confirmDeleteWord}
          onChange={(event) => {
            setConfirmDeleteWord(event.target.value);
            setUnlockCountdown(DELETE_UNLOCK_SECONDS);
          }}
          className="field-input"
          placeholder="DELETE"
          autoComplete="off"
          spellCheck={false}
        />
      </label>

      <label className="flex items-start gap-2 text-sm text-red-900">
        <input
          type="checkbox"
          name="acknowledgeDelete"
          checked={acknowledgeDelete}
          onChange={(event) => {
            setAcknowledgeDelete(event.target.checked);
            setUnlockCountdown(DELETE_UNLOCK_SECONDS);
          }}
          className="mt-1 h-4 w-4 accent-red-600"
        />
        <span>I understand this action is permanent and cannot be undone.</span>
      </label>

      {confirmationsComplete && !isDeleteUnlocked ? (
        <p className="text-sm text-red-700">
          Delete unlocks in {unlockCountdown}s for safety confirmation.
        </p>
      ) : null}

      {state?.error ? <p className="text-xs text-red-700">{state.error}</p> : null}

      <button
        type="submit"
        disabled={disableDelete}
        className="btn-danger text-sm disabled:cursor-not-allowed disabled:opacity-60"
      >
        {isPending ? "Deleting..." : "Delete project permanently"}
      </button>
    </form>
  );
}
