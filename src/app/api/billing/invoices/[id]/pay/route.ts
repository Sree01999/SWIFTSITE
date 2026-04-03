import { NextResponse } from "next/server";

import { markInvoicePaid } from "@/lib/billing/invoices";
import { isDevFeatureEnabled } from "@/lib/security/env";
import { checkRateLimit } from "@/lib/security/rate-limit";
import { createClient } from "@/lib/supabase/server";

export async function POST(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    if (!isDevFeatureEnabled()) {
      return NextResponse.json({ error: "Not found." }, { status: 404 });
    }

    const rate = checkRateLimit(_request, {
      scope: "billing-mark-paid-dev",
      maxRequests: 30,
      windowMs: 10 * 60 * 1000,
    });
    if (rate.limited) {
      return NextResponse.json(
        { error: "Too many payment simulation attempts. Please try again later." },
        { status: 429, headers: rate.headers },
      );
    }

    const { id } = await params;
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
    }

    const result = await markInvoicePaid({ supabase, invoiceId: id });
    if (!result.ok) {
      return NextResponse.json({ error: result.error }, { status: result.statusCode });
    }

    return NextResponse.json({
      invoiceId: result.invoiceId,
      alreadyPaid: result.alreadyPaid,
      status: "paid",
    });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Unexpected invoice payment error.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
