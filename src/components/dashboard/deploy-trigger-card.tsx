"use client";

import { useEffect, useMemo, useState } from "react";

type DeployState = "idle" | "queued" | "building" | "ready" | "error";

type StatusResponse = {
  deploymentId: string;
  status: string;
  deployUrl?: string | null;
  errorMessage?: string | null;
};

function normalizeStatus(status: string): DeployState {
  if (status === "queued") return "queued";
  if (status === "ready" || status === "deployed") return "ready";
  if (status === "error" || status === "failed" || status === "canceled") {
    return "error";
  }
  if (status === "building") return "building";
  return "idle";
}

export function DeployTriggerCard({
  projectId,
  initialStatus,
}: {
  projectId: string;
  initialStatus: string | null;
}) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [deploymentId, setDeploymentId] = useState<string | null>(null);
  const [status, setStatus] = useState<DeployState>(
    normalizeStatus(initialStatus ?? "idle"),
  );
  const [deployUrl, setDeployUrl] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const isPolling = useMemo(
    () => !!deploymentId && (status === "queued" || status === "building"),
    [deploymentId, status],
  );

  useEffect(() => {
    if (!isPolling || !deploymentId) return;

    const interval = window.setInterval(async () => {
      const res = await fetch(`/api/deploy/${deploymentId}/status`);
      if (!res.ok) return;

      const data = (await res.json()) as StatusResponse;
      const nextStatus = normalizeStatus(data.status);
      setStatus(nextStatus);
      setDeployUrl(data.deployUrl ?? null);
      setError(data.errorMessage ?? null);
    }, 5000);

    return () => window.clearInterval(interval);
  }, [deploymentId, isPolling]);

  async function triggerDeploy() {
    setIsSubmitting(true);
    setError(null);

    try {
      const res = await fetch("/api/deploy", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ projectId }),
      });
      const data = (await res.json()) as {
        deploymentId?: string;
        status?: string;
        deployUrl?: string | null;
        error?: string;
      };

      if (!res.ok || !data.deploymentId) {
        setStatus("error");
        setError(data.error ?? "Deploy request failed.");
        return;
      }

      setDeploymentId(data.deploymentId);
      setDeployUrl(data.deployUrl ?? null);
      setStatus(normalizeStatus(data.status ?? "queued"));
    } catch (e) {
      setStatus("error");
      setError(e instanceof Error ? e.message : "Deploy request failed.");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <article className="soft-card space-y-3 p-4">
      <p className="eyebrow">Deploy</p>
      <h2 className="text-lg font-semibold">Deployment</h2>
      <p className="text-sm text-slate-600">
        Trigger a manual deploy using this project&apos;s configured deploy hook.
      </p>

      <div className="rounded-xl bg-slate-100/80 px-3 py-2 text-sm">
        <span className="font-medium">Status:</span>{" "}
        <span className="capitalize">{status}</span>
      </div>

      {deploymentId ? (
        <p className="break-all text-xs text-slate-500">
          Deployment record: {deploymentId}
        </p>
      ) : null}

      {deployUrl ? (
        <a
          href={deployUrl}
          target="_blank"
          rel="noreferrer"
          className="text-sm font-medium text-emerald-800 underline underline-offset-2"
        >
          Open Deploy URL
        </a>
      ) : null}

      {error ? <p className="text-sm text-red-700">{error}</p> : null}

      <button
        type="button"
        onClick={triggerDeploy}
        disabled={isSubmitting}
        className="btn-primary text-sm disabled:opacity-60"
      >
        {isSubmitting ? "Triggering..." : "Trigger Deploy"}
      </button>
    </article>
  );
}
