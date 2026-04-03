import { NextResponse } from "next/server";

import { getBillingEnv } from "@/lib/billing/env";
import { markInvoicePaid } from "@/lib/billing/invoices";
import {
  type StripeWebhookEvent,
  verifyStripeWebhookSignature,
} from "@/lib/billing/stripe";
import { createServiceRoleClient } from "@/lib/supabase/service";

function asString(value: unknown) {
  return typeof value === "string" ? value : null;
}

export async function POST(request: Request) {
  const billingEnv = getBillingEnv();
  if (!billingEnv.stripeWebhookSecret) {
    return NextResponse.json(
      { error: "Stripe webhook secret is not configured." },
      { status: 503 },
    );
  }

  const signature = request.headers.get("stripe-signature");
  const rawBody = await request.text();
  const isValid = verifyStripeWebhookSignature({
    payload: rawBody,
    signatureHeader: signature,
    webhookSecret: billingEnv.stripeWebhookSecret,
  });

  if (!isValid) {
    return NextResponse.json({ error: "Invalid webhook signature." }, { status: 400 });
  }

  const event = JSON.parse(rawBody) as StripeWebhookEvent;
  if (!event?.id || !event?.type) {
    return NextResponse.json({ error: "Invalid webhook event payload." }, { status: 400 });
  }

  let supabase;
  try {
    supabase = createServiceRoleClient();
  } catch {
    return NextResponse.json(
      { error: "Supabase service role is not configured." },
      { status: 503 },
    );
  }
  const { data: processed } = await supabase
    .from("processed_events")
    .select("id")
    .eq("event_source", "stripe")
    .eq("event_id", event.id)
    .maybeSingle();

  if (processed) {
    return NextResponse.json({ received: true, deduped: true });
  }

  const object = (event.data?.object ?? {}) as Record<string, unknown>;

  if (event.type === "checkout.session.completed") {
    const metadata = (object.metadata ?? {}) as Record<string, unknown>;
    const invoiceId = asString(metadata.invoice_id);
    const sessionId = asString(object.id);

    if (invoiceId) {
      await markInvoicePaid({ supabase, invoiceId });
      if (sessionId) {
        await supabase
          .from("invoices")
          .update({ stripe_checkout_session_id: sessionId })
          .eq("id", invoiceId);
      }
    }
  } else if (event.type === "invoice.payment_succeeded") {
    const invoiceStripeId = asString(object.id);
    if (invoiceStripeId) {
      const { data: existingInvoice } = await supabase
        .from("invoices")
        .select("id")
        .eq("stripe_invoice_id", invoiceStripeId)
        .maybeSingle();

      if (existingInvoice?.id) {
        await markInvoicePaid({ supabase, invoiceId: existingInvoice.id });
      }
    }
  } else if (event.type === "invoice.payment_failed") {
    const invoiceStripeId = asString(object.id);
    if (invoiceStripeId) {
      await supabase
        .from("invoices")
        .update({ status: "open" })
        .eq("stripe_invoice_id", invoiceStripeId);
    }
  } else if (event.type === "customer.subscription.deleted") {
    const customerId = asString(object.customer);
    if (customerId) {
      await supabase
        .from("clients")
        .update({ billing_status: "canceled" })
        .eq("stripe_customer_id", customerId);
    }
  }

  await supabase.from("processed_events").insert({
    event_source: "stripe",
    event_id: event.id,
  });

  return NextResponse.json({ received: true });
}
