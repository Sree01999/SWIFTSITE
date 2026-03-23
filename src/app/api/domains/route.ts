import { NextResponse } from "next/server";
import { z } from "zod";

import {
  DOMAIN_WWW_CNAME_TARGET,
  buildDomainVerificationValue,
  buildVerificationToken,
} from "@/lib/domains/constants";
import { createClient } from "@/lib/supabase/server";

const createDomainSchema = z.object({
  projectId: z.string().uuid(),
  domain: z.string().min(3).max(255),
});

const DOMAIN_PATTERN =
  /^(?:[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?\.)+[a-z]{2,}$/i;

function normalizeDomain(input: string) {
  const trimmed = input.trim().toLowerCase();
  if (!trimmed) return null;

  const candidate = trimmed.includes("://")
    ? (() => {
        try {
          return new URL(trimmed).hostname.toLowerCase();
        } catch {
          return trimmed;
        }
      })()
    : trimmed;

  const sanitized = candidate.replace(/^www\./, "").replace(/\.$/, "");
  if (!DOMAIN_PATTERN.test(sanitized)) return null;
  return sanitized;
}

export async function POST(request: Request) {
  const body = await request.json().catch(() => null);
  const parsed = createDomainSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid domain payload." }, { status: 400 });
  }

  const normalizedDomain = normalizeDomain(parsed.data.domain);
  if (!normalizedDomain) {
    return NextResponse.json(
      { error: "Please provide a valid domain, e.g. example.com." },
      { status: 400 },
    );
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  }

  const { data: project, error: projectError } = await supabase
    .from("projects")
    .select("id")
    .eq("id", parsed.data.projectId)
    .maybeSingle();

  if (projectError || !project) {
    return NextResponse.json({ error: "Project not found." }, { status: 404 });
  }

  const { data: createdDomain, error: insertError } = await supabase
    .from("domains")
    .insert({
      project_id: project.id,
      owner_id: user.id,
      domain: normalizedDomain,
      status: "pending",
      ssl_status: "pending",
      verification_token: buildVerificationToken(),
      dns_check_passed: false,
      dns_check_details: {},
    })
    .select(
      "id,domain,status,ssl_status,verified_at,created_at,verification_token,dns_check_passed,last_dns_check_at,dns_check_details",
    )
    .single();

  if (insertError) {
    if (insertError.code === "23505") {
      return NextResponse.json(
        { error: "This domain is already attached to a project." },
        { status: 409 },
      );
    }
    return NextResponse.json({ error: insertError.message }, { status: 500 });
  }

  const verificationToken = createdDomain.verification_token as string;
  return NextResponse.json(
    {
      domain: createdDomain,
      dnsInstructions: [
        {
          type: "TXT",
          host: `_swiftsite-verify.${createdDomain.domain}`,
          value: buildDomainVerificationValue(verificationToken),
          required: true,
        },
        {
          type: "CNAME",
          host: `www.${createdDomain.domain}`,
          value: DOMAIN_WWW_CNAME_TARGET,
          required: false,
          note: "Optional if apex A record exists.",
        },
      ],
    },
    { status: 201 },
  );
}
