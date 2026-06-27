/**
 * Stripe-ready billing architecture.
 * Webhook handlers and checkout sessions will be wired in Phase 7.
 */

export const BILLING_MODELS = [
  "monthly_subscription",
  "annual_subscription",
  "per_seat",
  "per_market",
  "per_lead_pack",
  "enterprise_invoice",
] as const;

export type BillingModel = (typeof BILLING_MODELS)[number];

export function getStripeConfig() {
  return {
    secretKey: process.env.STRIPE_SECRET_KEY ?? "",
    publishableKey: process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY ?? "",
    webhookSecret: process.env.STRIPE_WEBHOOK_SECRET ?? "",
    isConfigured: Boolean(
      process.env.STRIPE_SECRET_KEY &&
        process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY
    ),
  };
}
