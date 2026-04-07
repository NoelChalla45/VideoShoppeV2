// Shared Stripe client for checkout session creation and verification.
import Stripe from "stripe";

const stripeSecretKey = process.env.STRIPE_SECRET_KEY;

export const stripe = stripeSecretKey
  ? new Stripe(stripeSecretKey, { apiVersion: "2025-02-24.acacia" })
  : null;

export function requireStripe() {
  if (!stripe) {
    throw new Error("STRIPE_NOT_CONFIGURED");
  }

  return stripe;
}
