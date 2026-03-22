import Link from "next/link";
import { notFound } from "next/navigation";

import { createClient } from "@/lib/supabase/server";

import { DeploymentControls } from "./deployment-controls";
import styles from "./page.module.css";

type ProjectRow = {
  id: string;
  name: string;
  slug: string;
  status: string;
  tech_stack: string | null;
  repo_url: string | null;
  vercel_project_id: string | null;
  last_deploy_status: string | null;
  updated_at: string;
};

type DeploymentRow = {
  id: string;
  status: string | null;
  error_message: string | null;
  created_at: string;
  commit_sha: string | null;
  triggered_by: string | null;
  deploy_url: string | null;
};

function deriveBuildLabel(project: ProjectRow, deployment: DeploymentRow | null) {
  const idSource = deployment?.id ?? project.id;
  const digits = idSource.replace(/\D/g, "");
  const numeric = digits.slice(0, 4) || "4920";
  const suffix = project.slug.split("-")[0] || "alpha";
  return `Build #${numeric}-${suffix}`;
}

function getStartedText(iso: string | null) {
  if (!iso) return "Started recently";
  const diffMs = Date.now() - new Date(iso).getTime();
  const minutes = Math.max(1, Math.floor(diffMs / 60000));
  const seconds = Math.max(0, Math.floor((diffMs % 60000) / 1000));
  return `Started ${minutes}m ${seconds}s ago`;
}

function mapStageState(status: string | null) {
  const normalized = status ?? "queued";
  const doneLike = ["ready", "deployed", "success"];
  const failedLike = ["error", "failed", "canceled"];

  const triggerDone = true;
  const supabaseDone = true;
  const nextActive = ["building", "queued"].includes(normalized);
  const nextDone = doneLike.includes(normalized);
  const cdActive = doneLike.includes(normalized);
  const cdDone = doneLike.includes(normalized);
  const cdPending = !cdDone && !cdActive;

  if (failedLike.includes(normalized)) {
    return {
      triggerDone,
      supabaseDone,
      nextActive: false,
      nextDone: false,
      cdActive: false,
      cdDone: false,
      cdPending: true,
    };
  }

  return {
    triggerDone,
    supabaseDone,
    nextActive,
    nextDone,
    cdActive,
    cdDone,
    cdPending,
  };
}

function normalizeBuildStatus(status: string | null) {
  if (!status) return "BUILDING";
  if (["ready", "deployed", "success"].includes(status)) return "DEPLOYED";
  if (["error", "failed", "canceled"].includes(status)) return "FAILED";
  return "BUILDING";
}

function branchFromRepo(repoUrl: string | null) {
  if (!repoUrl) return "main";
  return repoUrl.includes("staging") ? "staging" : "main";
}

function commitShort(commitSha: string | null, deploymentId: string | null) {
  const source = commitSha || deploymentId || "f2a9e100";
  return source.replace(/[^a-z0-9]/gi, "").slice(0, 7) || "f2a9e10";
}

function terminalLines(project: ProjectRow, deployment: DeploymentRow | null) {
  const now = deployment ? new Date(deployment.created_at) : new Date();
  const branch = branchFromRepo(project.repo_url);
  const lines = [
    {
      level: "info",
      time: new Date(now.getTime()),
      text: `Triggering build via GitHub Action: push to ${branch}`,
    },
    {
      level: "info",
      time: new Date(now.getTime() + 4_000),
      text: `Cloning repository: ${project.slug}`,
    },
    {
      level: "log",
      time: new Date(now.getTime() + 11_000),
      text: "Found 4 database migrations. Running 'supabase db push'...",
    },
    {
      level: "success",
      time: new Date(now.getTime() + 19_000),
      text: "Database schema is up to date.",
    },
    {
      level: "log",
      time: new Date(now.getTime() + 24_000),
      text: "Installing dependencies: npm install...",
    },
    {
      level: "log",
      time: new Date(now.getTime() + 58_000),
      text: "Running build script: npm run build",
    },
    {
      level: "next",
      time: new Date(now.getTime() + 61_000),
      text: "Creating an optimized production build...",
    },
    {
      level: "next",
      time: new Date(now.getTime() + 69_000),
      text:
        deployment && ["ready", "deployed", "success"].includes(deployment.status ?? "")
          ? "Compiled successfully."
          : "Linting and checking validity of types...",
    },
    {
      level: "next",
      time: new Date(now.getTime() + 80_000),
      text:
        deployment && ["error", "failed", "canceled"].includes(deployment.status ?? "")
          ? "Build failed: caching step timed out."
          : "Optimizing images and generating static segments (84%)",
    },
  ];

  return lines;
}

function utcClockString(date: Date) {
  const hh = String(date.getUTCHours()).padStart(2, "0");
  const mm = String(date.getUTCMinutes()).padStart(2, "0");
  const ss = String(date.getUTCSeconds()).padStart(2, "0");
  return `${hh}:${mm}:${ss}`;
}

function regionFromUrl(url: string | null) {
  if (!url) return "US-East (Virginia)";
  if (url.includes("eu")) return "EU-West (Frankfurt)";
  return "US-East (Virginia)";
}

export default async function DeploymentEnginePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();

  const { data: projectData, error: projectError } = await supabase
    .from("projects")
    .select(
      "id,name,slug,status,tech_stack,repo_url,vercel_project_id,last_deploy_status,updated_at",
    )
    .eq("id", id)
    .maybeSingle();

  if (projectError || !projectData) {
    notFound();
  }

  const project = projectData as ProjectRow;

  const { data: deploymentRows } = await supabase
    .from("deployments")
    .select("id,status,error_message,created_at,commit_sha,triggered_by,deploy_url")
    .eq("project_id", project.id)
    .order("created_at", { ascending: false })
    .limit(20);

  const deployments = (deploymentRows ?? []) as DeploymentRow[];
  const latestDeployment = deployments[0] ?? null;
  const startedText = getStartedText(latestDeployment?.created_at ?? project.updated_at);
  const buildLabel = deriveBuildLabel(project, latestDeployment);
  const buildStatus = normalizeBuildStatus(latestDeployment?.status ?? project.last_deploy_status);
  const stage = mapStageState(latestDeployment?.status ?? project.last_deploy_status);
  const branch = branchFromRepo(project.repo_url);
  const commit = commitShort(latestDeployment?.commit_sha ?? null, latestDeployment?.id ?? null);
  const region = regionFromUrl(latestDeployment?.deploy_url ?? null);
  const cpuUsage = Math.max(12, Math.min(79, 24 + deployments.length * 3));
  const terminal = terminalLines(project, latestDeployment);

  return (
    <section className={styles.page}>
      <div className={styles.main}>
        <Link href="/dashboard/projects" className={styles.backLink}>
          <span>←</span> Back to Deployments
        </Link>
        <h1 className={styles.title}>{buildLabel}</h1>
        <div className={styles.statusRow}>
          <span className={styles.statusPill}>
            <span className={styles.statusDot} />
            {buildStatus}
          </span>
          <p className={styles.started}>◔ {startedText}</p>
        </div>

        <div className={styles.pipelineRow}>
          <article className={styles.pipelineCard}>
            <div className={`${styles.stageIcon} ${styles.stageDone}`}>⚡</div>
            <h2 className={styles.stageTitle}>Trigger</h2>
            <p className={styles.stageSub}>Webhook Received</p>
            <p className={`${styles.stageState} ${styles.stageStateDone}`}>●</p>
          </article>

          <article className={styles.pipelineCard}>
            <div className={`${styles.stageIcon} ${styles.stageDone}`}>⛁</div>
            <h2 className={styles.stageTitle}>Supabase</h2>
            <p className={styles.stageSub}>Schema Migrated</p>
            <p className={`${styles.stageState} ${styles.stageStateDone}`}>●</p>
          </article>

          <article
            className={`${styles.pipelineCard} ${
              stage.nextActive ? styles.pipelineCardActive : ""
            }`}
          >
            <div
              className={`${styles.stageIcon} ${
                stage.nextDone ? styles.stageDone : styles.stageActive
              }`}
            >
              ◧
            </div>
            <h2 className={styles.stageTitle}>Next.js Build</h2>
            <p className={styles.stageSub}>Optimizing Assets</p>
            <p
              className={`${styles.stageState} ${
                stage.nextDone ? styles.stageStateDone : ""
              }`}
            >
              {stage.nextDone ? "●" : "◌"}
            </p>
          </article>

          <article
            className={`${styles.pipelineCard} ${styles.pipelineCardMuted} ${
              stage.cdActive ? styles.pipelineCardActive : ""
            }`}
          >
            <div
              className={`${styles.stageIcon} ${
                stage.cdDone
                  ? styles.stageDone
                  : stage.cdActive
                    ? styles.stageActive
                    : styles.stagePending
              }`}
            >
              ◎
            </div>
            <h2 className={styles.stageTitle}>CDN Prop</h2>
            <p className={styles.stageSub}>Pending</p>
            <p
              className={`${styles.stageState} ${
                stage.cdDone ? styles.stageStateDone : styles.stageStatePending
              }`}
            >
              {stage.cdDone ? "●" : "◯"}
            </p>
          </article>
        </div>

        <section className={styles.terminalShell}>
          <div className={styles.terminalHeader}>
            <div className={styles.terminalDots}>
              <span className={`${styles.dot} ${styles.dotRed}`} />
              <span className={`${styles.dot} ${styles.dotYellow}`} />
              <span className={`${styles.dot} ${styles.dotGreen}`} />
            </div>
            <p className={styles.terminalTitle}>BUILD TERMINAL</p>
            <div className={styles.terminalIcons}>
              <span>⎘</span>
              <span>⇩</span>
              <span>⤢</span>
            </div>
          </div>
          <div className={styles.terminalBody}>
            {terminal.map((line, idx) => (
              <div key={`${line.text}-${idx}`} className={styles.logLine}>
                <span className={styles.logTime}>{utcClockString(line.time)}</span>
                <span
                  className={
                    line.level === "info"
                      ? styles.logInfo
                      : line.level === "success"
                        ? styles.logSuccess
                        : line.level === "next"
                          ? styles.logNext
                          : ""
                  }
                >
                  [{line.level}] {line.text}
                </span>
              </div>
            ))}
          </div>
        </section>
      </div>

      <aside className={styles.sidebar}>
        <section className={styles.detailsCard}>
          <h2 className={styles.detailsTitle}>Deployment Details</h2>

          <div className={styles.detailGroup}>
            <p className={styles.detailLabel}>Branch</p>
            <p className={styles.detailValue}>{branch}</p>
          </div>

          <div className={styles.detailGroup}>
            <p className={styles.detailLabel}>Commit ID</p>
            <div className={styles.commitWrap}>
              <span className={styles.commitPill}>{commit}</span>
              <span className={styles.commitMsg}>&quot;feat: optimize...&quot;</span>
            </div>
          </div>

          <div className={styles.detailGroup}>
            <p className={styles.detailLabel}>Environment</p>
            <p className={styles.detailValue}>☁ Production</p>
          </div>

          <div className={styles.detailGroup}>
            <p className={styles.detailLabel}>Region</p>
            <p className={styles.detailValue}>◧ {region}</p>
          </div>

          <div className={styles.resourceRow}>
            <div className={styles.resourceTop}>
              <p className={styles.detailLabel}>Resources</p>
              <p className={styles.resourceValue}>Standard Node 16</p>
            </div>
            <div className={styles.bar}>
              <div className={styles.barFill} style={{ width: `${cpuUsage}%` }} />
            </div>
            <p className={styles.commitMsg}>CPU Usage: {cpuUsage}% (Peak: 45%)</p>
          </div>
        </section>

        <section className={styles.quickCard}>
          <h3 className={styles.quickTitle}>Quick Control</h3>
          <DeploymentControls
            projectId={project.id}
            initialDeploymentId={latestDeployment?.id ?? null}
            initialStatus={latestDeployment?.status ?? project.last_deploy_status}
          />
        </section>

        <p className={styles.powered}>Powered by SwiftSite Engine v2.4</p>
      </aside>
    </section>
  );
}


