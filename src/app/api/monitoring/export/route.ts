import { NextResponse } from "next/server";

import { createClient } from "@/lib/supabase/server";

type DeploymentExportRow = {
  id: string;
  project_id: string;
  status: string | null;
  created_at: string;
  error_message: string | null;
  deploy_url: string | null;
  commit_sha: string | null;
  triggered_by: string;
};

type ProjectExportRow = {
  id: string;
  name: string;
  slug: string;
};

function escapeCsv(value: string | null | undefined) {
  if (!value) return "";
  const needsQuote = value.includes(",") || value.includes('"') || value.includes("\n");
  const normalized = value.replaceAll('"', '""');
  return needsQuote ? `"${normalized}"` : normalized;
}

export async function GET(request: Request) {
  try {
    const url = new URL(request.url);
    const daysParam = Number.parseInt(url.searchParams.get("days") ?? "30", 10);
    const days = Number.isFinite(daysParam) ? Math.max(1, Math.min(365, daysParam)) : 30;
    const startIso = new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString();

    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
    }

    const { data: deploymentsData, error: deploymentsError } = await supabase
      .from("deployments")
      .select(
        "id,project_id,status,created_at,error_message,deploy_url,commit_sha,triggered_by",
      )
      .gte("created_at", startIso)
      .order("created_at", { ascending: false })
      .limit(1000);

    if (deploymentsError) {
      return NextResponse.json({ error: deploymentsError.message }, { status: 500 });
    }

    const deployments = (deploymentsData ?? []) as DeploymentExportRow[];
    const projectIds = Array.from(new Set(deployments.map((row) => row.project_id)));

    let projectById = new Map<string, ProjectExportRow>();
    if (projectIds.length > 0) {
      const { data: projectsData } = await supabase
        .from("projects")
        .select("id,name,slug")
        .in("id", projectIds);
      const projects = (projectsData ?? []) as ProjectExportRow[];
      projectById = new Map(projects.map((project) => [project.id, project]));
    }

    const header = [
      "created_at",
      "project_name",
      "project_slug",
      "status",
      "triggered_by",
      "commit_sha",
      "deploy_url",
      "error_message",
    ];
    const rows = deployments.map((row) => {
      const project = projectById.get(row.project_id);
      return [
        escapeCsv(row.created_at),
        escapeCsv(project?.name ?? "Unknown project"),
        escapeCsv(project?.slug ?? ""),
        escapeCsv(row.status ?? ""),
        escapeCsv(row.triggered_by ?? ""),
        escapeCsv(row.commit_sha ?? ""),
        escapeCsv(row.deploy_url ?? ""),
        escapeCsv(row.error_message ?? ""),
      ].join(",");
    });

    const csv = [header.join(","), ...rows].join("\n");
    const filename = `monitoring-export-${new Date().toISOString().slice(0, 10)}.csv`;

    return new NextResponse(csv, {
      status: 200,
      headers: {
        "Content-Type": "text/csv; charset=utf-8",
        "Content-Disposition": `attachment; filename="${filename}"`,
        "Cache-Control": "no-store",
      },
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unexpected export error.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
