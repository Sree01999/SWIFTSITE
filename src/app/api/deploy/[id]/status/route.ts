import { NextResponse } from "next/server";

import { createClient } from "@/lib/supabase/server";

export async function GET(
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

  const { data, error } = await supabase
    .from("deployments")
    .select("id,status,deploy_url,error_message,vercel_deployment_id,created_at")
    .eq("id", id)
    .maybeSingle();

  if (error || !data) {
    return NextResponse.json({ error: "Deployment not found." }, { status: 404 });
  }

  return NextResponse.json({
    deploymentId: data.id,
    status: data.status ?? "pending",
    deployUrl: data.deploy_url,
    errorMessage: data.error_message,
    vercelDeploymentId: data.vercel_deployment_id,
    createdAt: data.created_at,
  });
}
