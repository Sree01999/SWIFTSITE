import {
  BILLING_CURRENCY,
  MAINTENANCE_CENTS,
  MAINTENANCE_LABEL,
} from "@/lib/billing/constants";
import type { createClient } from "@/lib/supabase/server";

type SupabaseServerClient = Awaited<ReturnType<typeof createClient>>;

type InvoiceRow = {
  id: string;
  client_id: string;
  owner_id: string;
  type: string | null;
  status: string;
  paid_at: string | null;
};

export async function markInvoicePaid({
  supabase,
  invoiceId,
}: {
  supabase: SupabaseServerClient;
  invoiceId: string;
}) {
  const { data: invoice, error: readError } = await supabase
    .from("invoices")
    .select("id,client_id,owner_id,type,status,paid_at")
    .eq("id", invoiceId)
    .maybeSingle();

  if (readError || !invoice) {
    return {
      ok: false as const,
      statusCode: 404,
      error: "Invoice not found.",
    };
  }

  const row = invoice as InvoiceRow;
  if (row.status === "paid") {
    return {
      ok: true as const,
      alreadyPaid: true,
      invoiceId: row.id,
    };
  }

  const nowIso = new Date().toISOString();
  const { error: updateError } = await supabase
    .from("invoices")
    .update({
      status: "paid",
      paid_at: nowIso,
    })
    .eq("id", row.id);

  if (updateError) {
    return {
      ok: false as const,
      statusCode: 500,
      error: updateError.message,
    };
  }

  await supabase
    .from("clients")
    .update({ billing_status: "current" })
    .eq("id", row.client_id);

  if (row.type === "build_fee") {
    const today = new Date();
    const periodStart = new Date(
      Date.UTC(today.getUTCFullYear(), today.getUTCMonth(), 1),
    );
    const periodEnd = new Date(
      Date.UTC(today.getUTCFullYear(), today.getUTCMonth() + 1, 0),
    );

    const startDate = periodStart.toISOString().slice(0, 10);
    const endDate = periodEnd.toISOString().slice(0, 10);

    const { data: existingMaintenance } = await supabase
      .from("invoices")
      .select("id")
      .eq("client_id", row.client_id)
      .eq("type", "maintenance")
      .eq("period_start", startDate)
      .maybeSingle();

    if (!existingMaintenance) {
      await supabase.from("invoices").insert({
        client_id: row.client_id,
        owner_id: row.owner_id,
        type: "maintenance",
        amount_cents: MAINTENANCE_CENTS,
        currency: BILLING_CURRENCY,
        status: "open",
        description: MAINTENANCE_LABEL,
        period_start: startDate,
        period_end: endDate,
      });
    }
  }

  return {
    ok: true as const,
    alreadyPaid: false,
    invoiceId: row.id,
  };
}
