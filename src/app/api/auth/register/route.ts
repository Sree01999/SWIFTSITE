import { NextResponse } from "next/server";
import { z } from "zod";

import { checkRateLimit } from "@/lib/security/rate-limit";
import { createClient } from "@/lib/supabase/server";

const registerSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
  name: z.string().min(1).max(120),
});

export async function POST(request: Request) {
  const rate = checkRateLimit(request, {
    scope: "auth-register",
    maxRequests: 6,
    windowMs: 15 * 60 * 1000,
  });
  if (rate.limited) {
    return NextResponse.json(
      { error: "Too many registration attempts. Please wait and try again." },
      { status: 429, headers: rate.headers },
    );
  }

  const body = await request.json().catch(() => null);
  const parsed = registerSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json(
      { error: "Invalid registration payload." },
      { status: 400 },
    );
  }

  const supabase = await createClient();
  const { data, error } = await supabase.auth.signUp({
    email: parsed.data.email,
    password: parsed.data.password,
    options: {
      data: {
        full_name: parsed.data.name,
      },
    },
  });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }

  return NextResponse.json({ user: data.user });
}
