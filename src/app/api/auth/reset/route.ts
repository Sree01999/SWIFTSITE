import { NextResponse } from "next/server";
import { z } from "zod";

import { checkRateLimit } from "@/lib/security/rate-limit";
import { createClient } from "@/lib/supabase/server";

const resetSchema = z.object({
  email: z.string().email(),
});

export async function POST(request: Request) {
  const rate = checkRateLimit(request, {
    scope: "auth-reset",
    maxRequests: 6,
    windowMs: 15 * 60 * 1000,
  });
  if (rate.limited) {
    return NextResponse.json(
      { error: "Too many reset requests. Please try again later." },
      { status: 429, headers: rate.headers },
    );
  }

  const body = await request.json().catch(() => null);
  const parsed = resetSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid payload." }, { status: 400 });
  }

  const supabase = await createClient();
  const { error } = await supabase.auth.resetPasswordForEmail(parsed.data.email);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }

  return NextResponse.json({ ok: true });
}
