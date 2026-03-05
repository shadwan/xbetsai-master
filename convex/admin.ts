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

    let totalSubscriptions = 0;
    let activeSubscriptions = 0;

    for (const user of users) {
      const subs = await ctx.runQuery(
        components.stripe.public.listSubscriptionsByUserId,
        { userId: user._id }
      );
      totalSubscriptions += subs.length;
      activeSubscriptions += subs.filter((s) => s.status === "active").length;
    }

    return {
      totalUsers: users.length,
      activeSubscriptions,
      totalSubscriptions,
      estimatedMRR: activeSubscriptions * 29,
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
    const users = await ctx.db.query("users").collect();

    const results = await Promise.all(
      users.map(async (user) => {
        const subs = await ctx.runQuery(
          components.stripe.public.listSubscriptionsByUserId,
          { userId: user._id }
        );
        return subs.map((s) => ({ ...s, user }));
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
