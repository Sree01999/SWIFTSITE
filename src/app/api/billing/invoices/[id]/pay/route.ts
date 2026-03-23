import { NextResponse } from "next/server";

import { markInvoicePaid } from "@/lib/billing/invoices";
import { createClient } from "@/lib/supabase/server";

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

  const result = await markInvoicePaid({ supabase, invoiceId: id });
  if (!result.ok) {
    return NextResponse.json({ error: result.error }, { status: result.statusCode });
  }

  return NextResponse.json({
    invoiceId: result.invoiceId,
    alreadyPaid: result.alreadyPaid,
    status: "paid",
  });
}
