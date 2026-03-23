function getStringEnv(name: string) {
  const value = process.env[name];
  if (!value) return null;
  const trimmed = value.trim();
  return trimmed.length ? trimmed : null;
}

export function getBillingEnv() {
  const appUrl = getStringEnv("NEXT_PUBLIC_APP_URL") ?? "http://localhost:3000";
  const stripeSecretKey = getStringEnv("STRIPE_SECRET_KEY");
  const stripeWebhookSecret = getStringEnv("STRIPE_WEBHOOK_SECRET");

  return {
    appUrl,
    stripeSecretKey,
    stripeWebhookSecret,
    stripeEnabled: Boolean(stripeSecretKey),
  };
}
