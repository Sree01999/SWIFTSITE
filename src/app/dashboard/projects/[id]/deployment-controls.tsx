"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";

import styles from "./page.module.css";

type DeploymentControlsProps = {
  projectId: string;
  initialDeploymentId: string | null;
  initialStatus: string | null;
};

type DeployActionResponse = {
  deploymentId?: string;
  status?: string;
  error?: string;
};

type RestartActionResponse = DeployActionResponse & {
  restartedFromDeploymentId?: string;
};

type StatusResponse = {
  status: string;
  errorMessage?: string | null;
};

async function readJsonSafely<T>(res: Response): Promise<T> {
  const text = await res.text();
  if (!text) return {} as T;
  try {
    return JSON.parse(text) as T;
  } catch {
    return { error: text.slice(0, 180) } as T;
  }
}

const ACTIVE_STATUSES = new Set(["queued", "building"]);

function normalizeStatus(status: string | null) {
  return (status ?? "pending").toLowerCase();
}

function statusLabel(status: string) {
  if (status === "building") return "Building";
  if (status === "queued") return "Queued";
  if (status === "deployed" || status === "ready" || status === "success") {
    return "Deployed";
  }
  if (status === "canceled") return "Canceled";
  if (status === "error" || status === "failed") return "Failed";
  return "Pending";
}

export function DeploymentControls({
  projectId,
  initialDeploymentId,
  initialStatus,
}: DeploymentControlsProps) {
  const router = useRouter();
  const [deploymentId, setDeploymentId] = useState<string | null>(
    initialDeploymentId,
  );
  const [status, setStatus] = useState(normalizeStatus(initialStatus));
  const [pendingAction, setPendingAction] = useState<
    null | "deploy" | "restart" | "abort"
  >(null);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [lastSyncAt, setLastSyncAt] = useState<Date | null>(null);

  const isActive = useMemo(() => ACTIVE_STATUSES.has(status), [status]);

  useEffect(() => {
    setDeploymentId(initialDeploymentId);
    setStatus(normalizeStatus(initialStatus));
  }, [initialDeploymentId, initialStatus]);

  useEffect(() => {
    if (!deploymentId || !isActive) return;

    const interval = window.setInterval(async () => {
      const res = await fetch(`/api/deploy/${deploymentId}/status`, {
        cache: "no-store",
      });
      if (!res.ok) return;

      const data = await readJsonSafely<StatusResponse>(res);
      const nextStatus = normalizeStatus(data.status);
      setStatus(nextStatus);
      setLastSyncAt(new Date());

      if (data.errorMessage) {
        setError(data.errorMessage);
      }

      router.refresh();
    }, 5000);

    return () => window.clearInterval(interval);
  }, [deploymentId, isActive, router]);

  useEffect(() => {
    if (deploymentId || !isActive) return;

    const interval = window.setInterval(() => {
      setLastSyncAt(new Date());
      router.refresh();
    }, 5000);

    return () => window.clearInterval(interval);
  }, [deploymentId, isActive, router]);

  async function runDeploy() {
    setPendingAction("deploy");
    setMessage(null);
    setError(null);

    try {
      const res = await fetch("/api/deploy", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ projectId }),
      });
      const data = await readJsonSafely<DeployActionResponse>(res);
      if (!res.ok || !data.deploymentId) {
        setError(data.error ?? `Deploy request failed (HTTP ${res.status}).`);
        return;
      }

      setDeploymentId(data.deploymentId);
      setStatus(normalizeStatus(data.status ?? "building"));
      setMessage("Deployment started.");
      router.refresh();
    } catch (requestError) {
      setError(
        requestError instanceof Error
          ? requestError.message
          : "Deploy request failed.",
      );
    } finally {
      setPendingAction(null);
    }
  }

  async function runRestart() {
    setPendingAction("restart");
    setMessage(null);
    setError(null);

    try {
      if (!deploymentId) {
        await runDeploy();
        return;
      }

      const res = await fetch(`/api/deploy/${deploymentId}/restart`, {
        method: "POST",
      });
      const data = await readJsonSafely<RestartActionResponse>(res);
      if (!res.ok || !data.deploymentId) {
        setError(data.error ?? `Restart failed (HTTP ${res.status}).`);
        return;
      }

      setDeploymentId(data.deploymentId);
      setStatus(normalizeStatus(data.status ?? "building"));
      setMessage("Restart triggered.");
      router.refresh();
    } catch (requestError) {
      setError(
        requestError instanceof Error ? requestError.message : "Restart failed.",
      );
    } finally {
      setPendingAction(null);
    }
  }

  async function runAbort() {
    if (!deploymentId) {
      setError("No deployment is available to abort.");
      return;
    }

    setPendingAction("abort");
    setMessage(null);
    setError(null);

    try {
      const res = await fetch(`/api/deploy/${deploymentId}/abort`, {
        method: "POST",
      });
      const data = await readJsonSafely<DeployActionResponse>(res);
      if (!res.ok) {
        setError(data.error ?? `Abort failed (HTTP ${res.status}).`);
        return;
      }

      setStatus(normalizeStatus(data.status ?? "canceled"));
      setMessage("Deployment aborted.");
      router.refresh();
    } catch (requestError) {
      setError(
        requestError instanceof Error ? requestError.message : "Abort failed.",
      );
    } finally {
      setPendingAction(null);
    }
  }

  const isBusy = pendingAction !== null;
  const disableAbort = isBusy || !deploymentId || !isActive;

  return (
    <div className={styles.controlsWrap}>
      <button
        type="button"
        data-capability="deploy-trigger"
        className={styles.quickDeployBtn}
        onClick={runDeploy}
        disabled={isBusy}
      >
        {pendingAction === "deploy" ? "Deploying..." : "Deploy Site"}
      </button>

      <div className={styles.quickButtons}>
        <button
          type="button"
          data-capability="deploy-abort"
          className={styles.quickBtn}
          onClick={runAbort}
          disabled={disableAbort}
        >
          <span className={styles.quickIcon}>X</span>
          {pendingAction === "abort" ? "Aborting..." : "Abort"}
        </button>
        <button
          type="button"
          data-capability="deploy-restart"
          className={styles.quickBtn}
          onClick={runRestart}
          disabled={isBusy}
        >
          <span className={styles.quickIcon}>R</span>
          {pendingAction === "restart" ? "Restarting..." : "Restart"}
        </button>
      </div>

      <p className={styles.controlStatus}>Live status: {statusLabel(status)}</p>
      <p className={styles.controlMeta}>
        Auto-refresh is active every 5 seconds while build is running.
      </p>
      {lastSyncAt ? (
        <p className={styles.controlMeta}>
          Last synced at {lastSyncAt.toLocaleTimeString()}
        </p>
      ) : null}
      {message ? <p className={styles.controlNotice}>{message}</p> : null}
      {error ? <p className={styles.controlError}>{error}</p> : null}
    </div>
  );
}
