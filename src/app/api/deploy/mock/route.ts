import { NextResponse } from "next/server";

import { isDevFeatureEnabled } from "@/lib/security/env";

export async function GET() {
  if (!isDevFeatureEnabled()) {
    return NextResponse.json({ error: "Not found." }, { status: 404 });
  }

  return NextResponse.json({
    ok: true,
    message:
      "Mock deploy hook is reachable. Use POST for deployment trigger simulation.",
  });
}

export async function POST() {
  if (!isDevFeatureEnabled()) {
    return NextResponse.json({ error: "Not found." }, { status: 404 });
  }

  const id = crypto.randomUUID();
  const short = id.replace(/-/g, "").slice(0, 10);

  return NextResponse.json({
    id,
    deploymentId: id,
    url: `https://preview-${short}.swift.local`,
  });
}
