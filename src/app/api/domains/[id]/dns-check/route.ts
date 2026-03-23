import { NextResponse } from "next/server";

import { evaluateDomainDns } from "@/lib/domains/dns-check";
import { createClient } from "@/lib/supabase/server";

export const runtime = "nodejs";

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

  const { data: domain, error: domainReadError } = await supabase
    .from("domains")
    .select("id,domain,verification_token,status")
    .eq("id", id)
    .maybeSingle();

  if (domainReadError || !domain) {
    return NextResponse.json({ error: "Domain not found." }, { status: 404 });
  }

  if (!domain.verification_token) {
    return NextResponse.json(
      {
        error:
          "Domain is missing verification token. Run latest migration and recreate domain.",
      },
      { status: 500 },
    );
  }

  const check = await evaluateDomainDns(domain.domain, domain.verification_token);

  const { data: updatedDomain, error: updateError } = await supabase
    .from("domains")
    .update({
      dns_check_passed: check.passed,
      last_dns_check_at: check.checkedAt,
      dns_check_details: check,
      ...(check.passed
        ? {}
        : domain.status === "verified"
          ? {
              status: "pending",
              ssl_status: "pending",
              verified_at: null,
            }
          : {}),
    })
    .eq("id", id)
    .select(
      "id,domain,status,ssl_status,verified_at,created_at,verification_token,dns_check_passed,last_dns_check_at,dns_check_details",
    )
    .single();

  if (updateError || !updatedDomain) {
    return NextResponse.json(
      { error: updateError?.message ?? "Could not save DNS check result." },
      { status: 500 },
    );
  }

  return NextResponse.json({
    domain: updatedDomain,
    dnsCheck: check,
  });
}
