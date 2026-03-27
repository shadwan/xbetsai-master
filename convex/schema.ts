import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";
import { authTables } from "@convex-dev/auth/server";

export default defineSchema({
  ...authTables,

  users: defineTable({
    name: v.optional(v.string()),
    email: v.optional(v.string()),
    emailVerificationTime: v.optional(v.number()),
    image: v.optional(v.string()),
    isAnonymous: v.optional(v.boolean()),
    role: v.optional(v.union(v.literal("user"), v.literal("admin"))),
    createdAt: v.optional(v.number()),
    // Admin-granted access (bypasses Stripe)
    manualSubscription: v.optional(v.object({
      status: v.union(v.literal("active"), v.literal("revoked")),
      grantedAt: v.number(),
      grantedBy: v.id("users"),
      note: v.optional(v.string()),
    })),
  }).index("email", ["email"]),

  emailLogs: defineTable({
    userId: v.id("users"),
    emailType: v.string(),
    to: v.string(),
    subject: v.string(),
    status: v.string(),
    sentAt: v.number(),
    resendEmailId: v.string(),
  })
    .index("by_userId", ["userId"])
    .index("by_sentAt", ["sentAt"])
    .index("by_status", ["status"]),
});
