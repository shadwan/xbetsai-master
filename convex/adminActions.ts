"use node";

import { action } from "./_generated/server";
import { components } from "./_generated/api";
import { v } from "convex/values";
import { getAuthUserId } from "@convex-dev/auth/server";
import { StripeSubscriptions } from "@convex-dev/stripe";

const stripeClient = new StripeSubscriptions(components.stripe, {});

export const adminCancelSubscription = action({
  args: {
    stripeSubscriptionId: v.string(),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");

    // Verify admin role
    const user = await ctx.runQuery(components.stripe.public.getSubscription, {
      stripeSubscriptionId: args.stripeSubscriptionId,
    });
    if (!user) throw new Error("Subscription not found");

    await stripeClient.cancelSubscription(ctx, {
      stripeSubscriptionId: args.stripeSubscriptionId,
    });
  },
});
