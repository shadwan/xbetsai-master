"use node";

import { action } from "./_generated/server";
import { components } from "./_generated/api";
import { StripeSubscriptions } from "@convex-dev/stripe";
import { getAuthUserId } from "@convex-dev/auth/server";
import { api } from "./_generated/api";
import { v } from "convex/values";
import Stripe from "stripe";

const stripeClient = new StripeSubscriptions(components.stripe, {});
const TRIAL_DAYS = 7;

export const createCheckoutSession = action({
  args: { plan: v.union(v.literal("monthly"), v.literal("annual")) },
  handler: async (ctx, args): Promise<string> => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");

    const user = await ctx.runQuery(api.users.currentUser);
    if (!user) throw new Error("User not found");

    const priceId =
      args.plan === "annual"
        ? process.env.STRIPE_ANNUAL_PRICE_ID!
        : process.env.STRIPE_PRO_PRICE_ID!;

    // Use stripeClient for customer management (keeps component in sync)
    const customer = await stripeClient.getOrCreateCustomer(ctx, {
      userId: userId,
      email: user.email ?? undefined,
      name: user.name ?? undefined,
    });

    // Only give trial to first-time subscribers
    const existingSubs = await ctx.runQuery(
      components.stripe.public.listSubscriptionsByUserId,
      { userId }
    );
    const isFirstSubscription = existingSubs.length === 0;

    // Use Stripe SDK directly for checkout (wrapper doesn't support trial_period_days)
    const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);
    const session = await stripe.checkout.sessions.create({
      mode: "subscription",
      customer: customer.customerId,
      line_items: [{ price: priceId, quantity: 1 }],
      success_url: `${process.env.NEXT_PUBLIC_APP_URL}/app?checkout=success`,
      cancel_url: `${process.env.NEXT_PUBLIC_APP_URL}/subscribe?checkout=canceled`,
      subscription_data: {
        metadata: { userId },
        ...(isFirstSubscription ? { trial_period_days: TRIAL_DAYS } : {}),
      },
      metadata: { userId },
    });

    return session.url!;
  },
});

export const createPortalSession = action({
  args: {},
  handler: async (ctx): Promise<string> => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");

    const user = await ctx.runQuery(api.users.currentUser);
    if (!user) throw new Error("User not found");

    // Try subscriptions first, fall back to customer record
    let customerId: string | undefined;

    const subscriptions = await ctx.runQuery(
      components.stripe.public.listSubscriptionsByUserId,
      { userId: userId }
    );

    if (subscriptions.length > 0) {
      customerId = subscriptions[0].stripeCustomerId;
    } else {
      // No subscription in component — try creating/getting customer directly
      const customer = await stripeClient.getOrCreateCustomer(ctx, {
        userId: userId,
        email: user.email ?? undefined,
        name: user.name ?? undefined,
      });
      customerId = customer.customerId;
    }

    if (!customerId) {
      throw new Error("No billing account found. Please subscribe first.");
    }

    const portal = await stripeClient.createCustomerPortalSession(ctx, {
      customerId,
      returnUrl: `${process.env.NEXT_PUBLIC_APP_URL}/app`,
    });

    return portal.url;
  },
});
