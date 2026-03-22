import { NextResponse } from "next/server";
import { z } from "zod";

import { triggerDeploymentForProject } from "@/lib/deploy/trigger";
import { createClient } from "@/lib/supabase/server";

const deploySchema = z.object({
  projectId: z.string().uuid(),
});

export async function POST(request: Request) {
  const body = await request.json().catch(() => null);
  const parsed = deploySchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid deploy payload." }, { status: 400 });
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  }

  const result = await triggerDeploymentForProject({
    supabase,
    projectId: parsed.data.projectId,
    userId: user.id,
    triggeredBy: "manual",
  });

  if (!result.ok) {
    return NextResponse.json({ error: result.error }, { status: result.statusCode });
  }

  return NextResponse.json(result);
}
