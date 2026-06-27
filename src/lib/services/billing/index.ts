import { shouldLoadSeedData } from "@/lib/config/app-mode";
import { getDataProvider } from "@/lib/data/dataProviderFactory";
import { getStripeConfig, BILLING_MODELS } from "@/lib/services/billing/stripe-config";

export { getStripeConfig, BILLING_MODELS };

export function getBillingAccounts(organizationId?: string) {
  const accounts = shouldLoadSeedData() ? getDataProvider().platform.getBillingAccounts() : [];
  return organizationId ? accounts.filter((a) => a.organizationId === organizationId) : accounts;
}

export function getBillingAccount(organizationId: string) {
  return getBillingAccounts(organizationId)[0] ?? null;
}

export interface CheckoutSessionPlaceholder {
  sessionId: string;
  url: string;
  organizationId: string;
  planId: string;
  status: "placeholder";
}

export function createCheckoutSessionPlaceholder(params: {
  organizationId: string;
  planId: string;
  billingCycle: "monthly" | "annual";
}): CheckoutSessionPlaceholder {
  const stripe = getStripeConfig();
  return {
    sessionId: `cs_placeholder_${Date.now()}`,
    url: stripe.isConfigured
      ? "https://checkout.stripe.com/placeholder"
      : "/settings?billing=stripe_not_configured",
    organizationId: params.organizationId,
    planId: params.planId,
    status: "placeholder",
  };
}

export interface WebhookEventPlaceholder {
  id: string;
  type: string;
  organizationId: string;
  processed: boolean;
  timestamp: string;
}

export function processWebhookPlaceholder(eventType: string, organizationId: string): WebhookEventPlaceholder {
  return {
    id: `evt_placeholder_${Date.now()}`,
    type: eventType,
    organizationId,
    processed: true,
    timestamp: new Date().toISOString(),
  };
}

export const WEBHOOK_EVENT_TYPES = [
  "customer.subscription.created",
  "customer.subscription.updated",
  "customer.subscription.deleted",
  "invoice.paid",
  "invoice.payment_failed",
  "checkout.session.completed",
] as const;
