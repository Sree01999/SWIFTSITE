import { NextResponse } from "next/server";
import { z } from "zod";

import {
  BILLING_CURRENCY,
  type BillingChargeType,
  amountForChargeType,
  labelForChargeType,
} from "@/lib/billing/constants";
import { getBillingEnv } from "@/lib/billing/env";
import { createStripeCheckoutSession } from "@/lib/billing/stripe";
import { createClient } from "@/lib/supabase/server";

const checkoutSchema = z.object({
  clientId: z.string().uuid(),
  chargeType: z.enum(["build_fee", "maintenance"]),
});

export async function POST(request: Request) {
  try {
    const body = await request.json().catch(() => null);
    const parsed = checkoutSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json({ error: "Invalid checkout payload." }, { status: 400 });
    }

    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
    }

    const { data: client, error: clientError } = await supabase
      .from("clients")
      .select("id,name,email")
      .eq("id", parsed.data.clientId)
      .maybeSingle();

    if (clientError || !client) {
      return NextResponse.json({ error: "Client not found." }, { status: 404 });
    }

    const chargeType = parsed.data.chargeType as BillingChargeType;
    const { data: invoice, error: invoiceError } = await supabase
      .from("invoices")
      .insert({
        client_id: client.id,
        owner_id: user.id,
        type: chargeType,
        amount_cents: amountForChargeType(chargeType),
        currency: BILLING_CURRENCY,
        status: "open",
        description: labelForChargeType(chargeType),
      })
      .select("id,client_id,type,amount_cents,currency,status,created_at")
      .single();

    if (invoiceError || !invoice) {
      return NextResponse.json(
        { error: invoiceError?.message ?? "Could not create invoice." },
        { status: 500 },
      );
    }

    const billingEnv = getBillingEnv();
    if (!billingEnv.stripeEnabled || !billingEnv.stripeSecretKey) {
      return NextResponse.json({
        mode: "mock",
        invoice,
        checkoutUrl: `${billingEnv.appUrl}/dashboard/billing?mock_invoice=${invoice.id}`,
        message:
          "Stripe is not configured yet. Invoice created in mock mode; use Mark Paid (Dev).",
      });
    }

    try {
      const stripeSession = await createStripeCheckoutSession({
        stripeSecretKey: billingEnv.stripeSecretKey,
        appUrl: billingEnv.appUrl,
        mode: chargeType,
        customerEmail: client.email ?? null,
        invoiceId: invoice.id,
        clientId: client.id,
      });

      await supabase
        .from("invoices")
        .update({ stripe_checkout_session_id: stripeSession.id })
        .eq("id", invoice.id);

      return NextResponse.json({
        mode: "stripe",
        invoice: { ...invoice, stripe_checkout_session_id: stripeSession.id },
        checkoutUrl: stripeSession.url,
        sessionId: stripeSession.id,
      });
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Could not create Stripe checkout.";
      return NextResponse.json({ error: message }, { status: 502 });
    }
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Unexpected billing checkout error.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
