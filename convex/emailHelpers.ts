import { internalQuery, internalMutation } from "./_generated/server";
import { v } from "convex/values";

export const getUserByEmail = internalQuery({
  args: { email: v.string() },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("users")
      .withIndex("email", (q) => q.eq("email", args.email))
      .first();
  },
});

export const getUserById = internalQuery({
  args: { userId: v.string() },
  handler: async (ctx, args) => {
    const id = ctx.db.normalizeId("users", args.userId);
    if (!id) return null;
    return await ctx.db.get(id);
  },
});

export const updateUserName = internalMutation({
  args: { userId: v.string(), name: v.string() },
  handler: async (ctx, args) => {
    const id = ctx.db.normalizeId("users", args.userId);
    if (!id) return;
    const user = await ctx.db.get(id);
    if (user && !user.name) {
      await ctx.db.patch(id, { name: args.name });
    }
  },
});
