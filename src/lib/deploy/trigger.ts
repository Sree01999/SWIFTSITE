import type { createClient } from "@/lib/supabase/server";

type SupabaseServerClient = Awaited<ReturnType<typeof createClient>>;

type DeployHookResponse = {
  id?: string;
  deploymentId?: string;
  job?: { id?: string };
  url?: string;
};

type TriggerDeploymentParams = {
  supabase: SupabaseServerClient;
  projectId: string;
  userId: string;
  triggeredBy: "manual" | "restart";
};

export type TriggerDeploymentResult =
  | {
      ok: true;
      deploymentId: string;
      status: "building";
      vercelDeploymentId: string | null;
      deployUrl: string | null;
    }
  | {
      ok: false;
      statusCode: number;
      error: string;
    };

function parseDeployId(payload: DeployHookResponse | null) {
  return payload?.deploymentId ?? payload?.id ?? payload?.job?.id ?? null;
}

function isMockDeployHook(url: string) {
  try {
    const parsed = new URL(url);
    return parsed.pathname === "/api/deploy/mock";
  } catch {
    return false;
  }
}

export async function triggerDeploymentForProject({
  supabase,
  projectId,
  userId,
  triggeredBy,
}: TriggerDeploymentParams): Promise<TriggerDeploymentResult> {
  const { data: project, error: projectError } = await supabase
    .from("projects")
    .select("id,deploy_hook_url")
    .eq("id", projectId)
    .maybeSingle();

  if (projectError || !project) {
    return { ok: false, statusCode: 404, error: "Project not found." };
  }

  if (!project.deploy_hook_url) {
    return {
      ok: false,
      statusCode: 400,
      error: "Deploy hook URL is missing for this project.",
    };
  }

  const startedAt = new Date().toISOString();

  const { data: deployment, error: deploymentInsertError } = await supabase
    .from("deployments")
    .insert({
      project_id: project.id,
      owner_id: userId,
      status: "queued",
      triggered_by: triggeredBy,
      started_at: startedAt,
    })
    .select("id")
    .single();

  if (deploymentInsertError || !deployment) {
    return {
      ok: false,
      statusCode: 500,
      error: deploymentInsertError?.message ?? "Could not create deployment row.",
    };
  }

  if (isMockDeployHook(project.deploy_hook_url)) {
    const mockId = crypto.randomUUID();
    const short = mockId.replace(/-/g, "").slice(0, 10);
    const deployUrl = `https://preview-${short}.swift.local`;

    await supabase
      .from("deployments")
      .update({
        status: "building",
        vercel_deployment_id: mockId,
        deploy_url: deployUrl,
      })
      .eq("id", deployment.id);

    await supabase
      .from("projects")
      .update({
        status: "building",
        last_deploy_status: "building",
        last_deploy_url: deployUrl,
      })
      .eq("id", project.id);

    return {
      ok: true,
      deploymentId: deployment.id,
      status: "building",
      vercelDeploymentId: mockId,
      deployUrl,
    };
  }

  try {
    const deployResponse = await fetch(project.deploy_hook_url, { method: "POST" });
    const deployPayload = (await deployResponse.json().catch(() => null)) as
      | DeployHookResponse
      | null;

    if (!deployResponse.ok) {
      const errorMessage = `Deploy hook failed with status ${deployResponse.status}.`;
      await supabase
        .from("deployments")
        .update({
          status: "error",
          completed_at: new Date().toISOString(),
          error_message: errorMessage,
        })
        .eq("id", deployment.id);
      await supabase
        .from("projects")
        .update({ status: "error", last_deploy_status: "error" })
        .eq("id", project.id);

      return { ok: false, statusCode: 502, error: errorMessage };
    }

    const vercelDeploymentId = parseDeployId(deployPayload);
    const deployUrl =
      deployPayload?.url && /^https?:\/\//.test(deployPayload.url)
        ? deployPayload.url
        : null;

    await supabase
      .from("deployments")
      .update({
        status: "building",
        vercel_deployment_id: vercelDeploymentId,
        deploy_url: deployUrl,
      })
      .eq("id", deployment.id);

    await supabase
      .from("projects")
      .update({
        status: "building",
        last_deploy_status: "building",
        last_deploy_url: deployUrl,
      })
      .eq("id", project.id);

    return {
      ok: true,
      deploymentId: deployment.id,
      status: "building",
      vercelDeploymentId,
      deployUrl,
    };
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Unknown deploy trigger error.";

    await supabase
      .from("deployments")
      .update({
        status: "error",
        completed_at: new Date().toISOString(),
        error_message: message,
      })
      .eq("id", deployment.id);
    await supabase
      .from("projects")
      .update({ status: "error", last_deploy_status: "error" })
      .eq("id", project.id);

    return { ok: false, statusCode: 500, error: message };
  }
}
