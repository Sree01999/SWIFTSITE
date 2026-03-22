import { NextResponse } from "next/server";

import { triggerDeploymentForProject } from "@/lib/deploy/trigger";
import { createClient } from "@/lib/supabase/server";

const ACTIVE_STATES = new Set(["queued", "building"]);

export async function POST(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  }

  const { data: deployment, error: deploymentError } = await supabase
    .from("deployments")
    .select("id,project_id,status")
    .eq("id", id)
    .maybeSingle();

  if (deploymentError || !deployment) {
    return NextResponse.json({ error: "Deployment not found." }, { status: 404 });
  }

  if (ACTIVE_STATES.has((deployment.status ?? "").toLowerCase())) {
    await supabase
      .from("deployments")
      .update({
        status: "canceled",
        completed_at: new Date().toISOString(),
        error_message: "Auto-canceled due to restart request.",
      })
      .eq("id", deployment.id);
  }

  const result = await triggerDeploymentForProject({
    supabase,
    projectId: deployment.project_id,
    userId: user.id,
    triggeredBy: "restart",
  });

  if (!result.ok) {
    return NextResponse.json({ error: result.error }, { status: result.statusCode });
  }

  return NextResponse.json({
    ...result,
    restartedFromDeploymentId: deployment.id,
  });
}
