import crypto from "node:crypto";

import {
  BILLING_CURRENCY,
  type BillingChargeType,
  amountForChargeType,
  labelForChargeType,
} from "@/lib/billing/constants";

type CreateStripeCheckoutParams = {
  stripeSecretKey: string;
  appUrl: string;
  mode: BillingChargeType;
  customerEmail: string | null;
  invoiceId: string;
  clientId: string;
};

type StripeCheckoutSession = {
  id: string;
  url: string | null;
};

function baseCheckoutParams({
  appUrl,
  customerEmail,
  invoiceId,
  clientId,
}: Omit<CreateStripeCheckoutParams, "stripeSecretKey" | "mode">) {
  const params = new URLSearchParams();
  params.set("success_url", `${appUrl}/dashboard/billing?checkout=success`);
  params.set("cancel_url", `${appUrl}/dashboard/billing?checkout=cancel`);
  params.set("allow_promotion_codes", "true");
  params.set("metadata[invoice_id]", invoiceId);
  params.set("metadata[client_id]", clientId);

  if (customerEmail) {
    params.set("customer_email", customerEmail);
  }

  return params;
}

export async function createStripeCheckoutSession({
  stripeSecretKey,
  appUrl,
  mode,
  customerEmail,
  invoiceId,
  clientId,
}: CreateStripeCheckoutParams): Promise<StripeCheckoutSession> {
  const params = baseCheckoutParams({
    appUrl,
    customerEmail,
    invoiceId,
    clientId,
  });

  if (mode === "build_fee") {
    params.set("mode", "payment");
    params.set("line_items[0][quantity]", "1");
    params.set("line_items[0][price_data][currency]", BILLING_CURRENCY);
    params.set(
      "line_items[0][price_data][unit_amount]",
      String(amountForChargeType("build_fee")),
    );
    params.set(
      "line_items[0][price_data][product_data][name]",
      labelForChargeType("build_fee"),
    );
  } else {
    params.set("mode", "subscription");
    params.set("line_items[0][quantity]", "1");
    params.set("line_items[0][price_data][currency]", BILLING_CURRENCY);
    params.set(
      "line_items[0][price_data][unit_amount]",
      String(amountForChargeType("maintenance")),
    );
    params.set(
      "line_items[0][price_data][product_data][name]",
      labelForChargeType("maintenance"),
    );
    params.set("line_items[0][price_data][recurring][interval]", "month");
  }

  const response = await fetch("https://api.stripe.com/v1/checkout/sessions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${stripeSecretKey}`,
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: params.toString(),
  });

  const payload = (await response.json().catch(() => null)) as
    | { id?: string; url?: string; error?: { message?: string } }
    | null;

  if (!response.ok || !payload?.id) {
    throw new Error(payload?.error?.message ?? "Could not create Stripe session.");
  }

  return {
    id: payload.id,
    url: payload.url ?? null,
  };
}

export type StripeWebhookEvent = {
  id: string;
  type: string;
  data?: {
    object?: Record<string, unknown>;
  };
};

function secureCompare(a: string, b: string) {
  const bufA = Buffer.from(a);
  const bufB = Buffer.from(b);
  if (bufA.length !== bufB.length) return false;
  return crypto.timingSafeEqual(bufA, bufB);
}

export function verifyStripeWebhookSignature({
  payload,
  signatureHeader,
  webhookSecret,
}: {
  payload: string;
  signatureHeader: string | null;
  webhookSecret: string;
}) {
  if (!signatureHeader) return false;

  const parts = signatureHeader
    .split(",")
    .map((part) => part.trim())
    .filter(Boolean);
  const timestamp = parts.find((part) => part.startsWith("t="))?.slice(2);
  const signatures = parts
    .filter((part) => part.startsWith("v1="))
    .map((part) => part.slice(3));

  if (!timestamp || !signatures.length) return false;

  const signedPayload = `${timestamp}.${payload}`;
  const expected = crypto
    .createHmac("sha256", webhookSecret)
    .update(signedPayload, "utf8")
    .digest("hex");

  return signatures.some((signature) => secureCompare(signature, expected));
}
