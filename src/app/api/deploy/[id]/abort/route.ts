import { NextResponse } from "next/server";

import { createClient } from "@/lib/supabase/server";

const FINAL_STATES = new Set([
  "ready",
  "deployed",
  "success",
  "error",
  "failed",
  "canceled",
]);

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

  const normalizedStatus = (deployment.status ?? "unknown").toLowerCase();
  if (normalizedStatus === "canceled") {
    return NextResponse.json({
      deploymentId: deployment.id,
      status: "canceled",
      alreadyCanceled: true,
    });
  }

  if (!ACTIVE_STATES.has(normalizedStatus) && FINAL_STATES.has(normalizedStatus)) {
    return NextResponse.json(
      { error: `Deployment is already ${normalizedStatus}.` },
      { status: 409 },
    );
  }

  const completedAt = new Date().toISOString();
  const { error: cancelError } = await supabase
    .from("deployments")
    .update({
      status: "canceled",
      completed_at: completedAt,
      error_message: "Deployment aborted by operator.",
    })
    .eq("id", deployment.id);

  if (cancelError) {
    return NextResponse.json({ error: cancelError.message }, { status: 500 });
  }

  await supabase
    .from("projects")
    .update({ status: "error", last_deploy_status: "canceled" })
    .eq("id", deployment.project_id);

  return NextResponse.json({
    deploymentId: deployment.id,
    status: "canceled",
  });
}
