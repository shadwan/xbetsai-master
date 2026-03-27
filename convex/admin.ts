import { query, mutation } from "./_generated/server";
import { components } from "./_generated/api";
import { v } from "convex/values";
import { getAuthUserId } from "@convex-dev/auth/server";

async function assertAdmin(ctx: any) {
  const userId = await getAuthUserId(ctx);
  if (!userId) throw new Error("Not authenticated");
  const user = await ctx.db.get(userId);
  if (!user || user.role !== "admin") throw new Error("Not authorized");
  return user;
}

export const dashboardStats = query({
  args: {},
  handler: async (ctx) => {
    await assertAdmin(ctx);

    const users = await ctx.db.query("users").collect();
    const monthlyPriceId = process.env.STRIPE_PRO_PRICE_ID;
    const annualPriceId = process.env.STRIPE_ANNUAL_PRICE_ID;

    let totalSubscriptions = 0;
    let activeSubscriptions = 0;
    let trialingSubscriptions = 0;
    let canceledSubscriptions = 0;
    let pastDueSubscriptions = 0;
    let manualAccessCount = 0;
    let monthlyCount = 0;
    let annualCount = 0;
    let usersWithActiveSub = 0;

    const now = Date.now();
    const sevenDaysAgo = now - 7 * 24 * 60 * 60 * 1000;
    const recentSignups = users.filter(
      (u) => u._creationTime && u._creationTime >= sevenDaysAgo
    ).length;

    for (const user of users) {
      const subs = await ctx.runQuery(
        components.stripe.public.listSubscriptionsByUserId,
        { userId: user._id }
      );
      totalSubscriptions += subs.length;

      const activeSubs = subs.filter((s) => s.status === "active");
      const trialSubs = subs.filter((s) => s.status === "trialing");
      activeSubscriptions += activeSubs.length;
      trialingSubscriptions += trialSubs.length;
      canceledSubscriptions += subs.filter((s) => s.status === "canceled").length;
      pastDueSubscriptions += subs.filter((s) => s.status === "past_due").length;

      const hasManualAccess = user.manualSubscription?.status === "active";
      if (hasManualAccess) manualAccessCount++;

      if (activeSubs.length > 0 || trialSubs.length > 0 || hasManualAccess) {
        usersWithActiveSub++;
        for (const s of [...activeSubs, ...trialSubs]) {
          if (s.priceId === annualPriceId) annualCount++;
          else if (s.priceId === monthlyPriceId) monthlyCount++;
          else monthlyCount++;
        }
      }
    }

    // MRR only counts active (paid), not trialing
    const paidMonthly = monthlyCount - trialingSubscriptions;
    const estimatedMRR =
      Math.max(0, paidMonthly) * 14.99 + annualCount * (100 / 12);
    const conversionRate =
      users.length > 0
        ? Math.round((usersWithActiveSub / users.length) * 100)
        : 0;

    return {
      totalUsers: users.length,
      recentSignups,
      activeSubscriptions,
      trialingSubscriptions,
      manualAccessCount,
      canceledSubscriptions,
      pastDueSubscriptions,
      totalSubscriptions,
      monthlyCount,
      annualCount,
      conversionRate,
      estimatedMRR: Math.round(estimatedMRR * 100) / 100,
    };
  },
});

export const listUsers = query({
  args: {},
  handler: async (ctx) => {
    await assertAdmin(ctx);
    const users = await ctx.db.query("users").collect();

    const usersWithSubs = await Promise.all(
      users.map(async (user) => {
        const subs = await ctx.runQuery(
          components.stripe.public.listSubscriptionsByUserId,
          { userId: user._id }
        );
        const subscription =
          subs.find((s) => s.status === "active") ?? subs[0] ?? null;
        return { ...user, subscription };
      })
    );

    return usersWithSubs;
  },
});

export const listSubscriptions = query({
  args: {},
  handler: async (ctx) => {
    await assertAdmin(ctx);

    const monthlyPriceId = process.env.STRIPE_PRO_PRICE_ID;
    const annualPriceId = process.env.STRIPE_ANNUAL_PRICE_ID;

    const users = await ctx.db.query("users").collect();

    const results = await Promise.all(
      users.map(async (user) => {
        const subs = await ctx.runQuery(
          components.stripe.public.listSubscriptionsByUserId,
          { userId: user._id }
        );
        return subs.map((s) => {
          let planName = "Pro";
          if (s.priceId === annualPriceId) planName = "Pro Yearly";
          else if (s.priceId === monthlyPriceId) planName = "Pro Monthly";
          return { ...s, planName, user };
        });
      })
    );

    return results.flat();
  },
});

export const listEmailLogs = query({
  args: {},
  handler: async (ctx) => {
    await assertAdmin(ctx);
    const logs = await ctx.db
      .query("emailLogs")
      .withIndex("by_sentAt")
      .order("desc")
      .take(100);

    const logsWithUsers = await Promise.all(
      logs.map(async (log) => {
        const user = await ctx.db.get(log.userId);
        return {
          ...log,
          userName: user?.name ?? "Unknown",
          userEmail: user?.email ?? log.to,
        };
      })
    );

    return logsWithUsers;
  },
});

export const updateUserRole = mutation({
  args: {
    userId: v.id("users"),
    role: v.union(v.literal("user"), v.literal("admin")),
  },
  handler: async (ctx, args) => {
    await assertAdmin(ctx);
    await ctx.db.patch(args.userId, { role: args.role });
  },
});

export const grantManualAccess = mutation({
  args: {
    userId: v.id("users"),
    note: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const admin = await assertAdmin(ctx);
    await ctx.db.patch(args.userId, {
      manualSubscription: {
        status: "active",
        grantedAt: Date.now(),
        grantedBy: admin._id,
        note: args.note,
      },
    });
  },
});

export const revokeManualAccess = mutation({
  args: {
    userId: v.id("users"),
  },
  handler: async (ctx, args) => {
    await assertAdmin(ctx);
    const user = await ctx.db.get(args.userId);
    if (!user?.manualSubscription) return;
    await ctx.db.patch(args.userId, {
      manualSubscription: {
        ...user.manualSubscription,
        status: "revoked",
      },
    });
  },
});

export const createManualUser = mutation({
  args: {
    email: v.string(),
    name: v.optional(v.string()),
    grantAccess: v.boolean(),
    note: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const admin = await assertAdmin(ctx);

    // Check if email already exists
    const existing = await ctx.db
      .query("users")
      .withIndex("email", (q) => q.eq("email", args.email))
      .first();
    if (existing) {
      throw new Error("A user with this email already exists");
    }

    const userId = await ctx.db.insert("users", {
      email: args.email,
      name: args.name,
      role: "user",
      createdAt: Date.now(),
      ...(args.grantAccess
        ? {
            manualSubscription: {
              status: "active" as const,
              grantedAt: Date.now(),
              grantedBy: admin._id,
              note: args.note,
            },
          }
        : {}),
    });

    return userId;
  },
});
