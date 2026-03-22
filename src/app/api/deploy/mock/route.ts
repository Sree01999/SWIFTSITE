import { NextResponse } from "next/server";

export async function GET() {
  return NextResponse.json({
    ok: true,
    message:
      "Mock deploy hook is reachable. Use POST for deployment trigger simulation.",
  });
}

export async function POST() {
  const id = crypto.randomUUID();
  const short = id.replace(/-/g, "").slice(0, 10);

  return NextResponse.json({
    id,
    deploymentId: id,
    url: `https://preview-${short}.swift.local`,
  });
}
