"use node";

import { action } from "./_generated/server";
import { components, internal } from "./_generated/api";
import { v } from "convex/values";
import { getAuthUserId } from "@convex-dev/auth/server";
import { StripeSubscriptions } from "@convex-dev/stripe";
import { api } from "./_generated/api";

const stripeClient = new StripeSubscriptions(components.stripe, {});

async function assertAdminAction(ctx: any) {
  const userId = await getAuthUserId(ctx);
  if (!userId) throw new Error("Not authenticated");
  const user = await ctx.runQuery(api.users.currentUser);
  if (!user || user.role !== "admin") throw new Error("Not authorized");
  return user;
}

export const adminCancelSubscription = action({
  args: {
    stripeSubscriptionId: v.string(),
  },
  handler: async (ctx, args) => {
    await assertAdminAction(ctx);
    await stripeClient.cancelSubscription(ctx, {
      stripeSubscriptionId: args.stripeSubscriptionId,
    });
  },
});
