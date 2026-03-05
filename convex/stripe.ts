"use node";

import { action } from "./_generated/server";
import { components } from "./_generated/api";
import { StripeSubscriptions } from "@convex-dev/stripe";
import { getAuthUserId } from "@convex-dev/auth/server";
import { api } from "./_generated/api";

const stripeClient = new StripeSubscriptions(components.stripe, {});

export const createCheckoutSession = action({
  args: {},
  handler: async (ctx): Promise<string> => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");

    const user = await ctx.runQuery(api.users.currentUser);
    if (!user) throw new Error("User not found");

    const customer = await stripeClient.getOrCreateCustomer(ctx, {
      userId: userId,
      email: user.email ?? undefined,
      name: user.name ?? undefined,
    });

    const session = await stripeClient.createCheckoutSession(ctx, {
      priceId: process.env.STRIPE_PRO_PRICE_ID!,
      customerId: customer.customerId,
      mode: "subscription",
      successUrl: `${process.env.NEXT_PUBLIC_APP_URL}/app?checkout=success`,
      cancelUrl: `${process.env.NEXT_PUBLIC_APP_URL}/subscribe?checkout=canceled`,
      subscriptionMetadata: { userId: userId },
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

    const subscriptions = await ctx.runQuery(
      components.stripe.public.listSubscriptionsByUserId,
      { userId: userId }
    );

    if (subscriptions.length === 0) {
      throw new Error("No subscription found");
    }

    const customerId = subscriptions[0].stripeCustomerId;

    const portal = await stripeClient.createCustomerPortalSession(ctx, {
      customerId,
      returnUrl: `${process.env.NEXT_PUBLIC_APP_URL}/app`,
    });

    return portal.url;
  },
});
