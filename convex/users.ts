import { query } from "./_generated/server";
import { components } from "./_generated/api";
import { getAuthUserId } from "@convex-dev/auth/server";

export const currentUser = query({
  args: {},
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) return null;

    const user = await ctx.db.get(userId);
    if (!user) return null;

    // Query subscriptions from the Stripe component
    const subscriptions = await ctx.runQuery(
      components.stripe.public.listSubscriptionsByUserId,
      { userId: userId }
    );

    const activeSubscription = subscriptions.find(
      (s) =>
        s.status === "active" ||
        s.status === "trialing" ||
        (s.status === "canceled" && s.currentPeriodEnd > Date.now())
    );

    return {
      ...user,
      subscription: activeSubscription ?? subscriptions[0] ?? null,
      hasActiveSubscription: !!activeSubscription,
    };
  },
});
