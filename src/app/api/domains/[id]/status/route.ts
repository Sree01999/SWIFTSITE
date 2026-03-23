import { NextResponse } from "next/server";
import { z } from "zod";

import { createClient } from "@/lib/supabase/server";

const updateDomainSchema = z.object({
  status: z.enum(["pending", "verified", "failed"]),
});

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const body = await request.json().catch(() => null);
  const parsed = updateDomainSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid status payload." }, { status: 400 });
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  }

  const { data: existingDomain, error: readError } = await supabase
    .from("domains")
    .select("id,dns_check_passed")
    .eq("id", id)
    .maybeSingle();

  if (readError || !existingDomain) {
    return NextResponse.json({ error: "Domain not found." }, { status: 404 });
  }

  const nextStatus = parsed.data.status;
  if (nextStatus === "verified" && !existingDomain.dns_check_passed) {
    return NextResponse.json(
      {
        error:
          "DNS check has not passed. Run Check DNS and ensure required records are configured.",
      },
      { status: 409 },
    );
  }

  const sslStatus =
    nextStatus === "verified"
      ? "active"
      : nextStatus === "failed"
        ? "failed"
        : "pending";
  const verifiedAt = nextStatus === "verified" ? new Date().toISOString() : null;

  const { data: updatedDomain, error: updateError } = await supabase
    .from("domains")
    .update({
      status: nextStatus,
      ssl_status: sslStatus,
      verified_at: verifiedAt,
    })
    .eq("id", id)
    .select(
      "id,domain,status,ssl_status,verified_at,created_at,verification_token,dns_check_passed,last_dns_check_at,dns_check_details",
    )
    .single();

  if (updateError || !updatedDomain) {
    return NextResponse.json(
      { error: updateError?.message ?? "Could not update domain status." },
      { status: 500 },
    );
  }

  return NextResponse.json({ domain: updatedDomain });
}
