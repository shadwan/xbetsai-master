import { components, internal } from "./_generated/api";
import { Resend, vOnEmailEventArgs } from "@convex-dev/resend";
import type { Resend as ResendType } from "@convex-dev/resend";
import { internalMutation } from "./_generated/server";
import { v } from "convex/values";

export const resend: ResendType = new Resend(components.resend, {
  testMode: process.env.NODE_ENV !== "production",
  onEmailEvent: internal.email.handleEmailEvent,
});

export const queueEmail = internalMutation({
  args: {
    from: v.string(),
    to: v.string(),
    subject: v.string(),
    html: v.string(),
    userId: v.optional(v.id("users")),
    emailType: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const emailId = await resend.sendEmail(ctx, {
      from: args.from,
      to: args.to,
      subject: args.subject,
      html: args.html,
    });

    if (args.userId && args.emailType) {
      await ctx.db.insert("emailLogs", {
        userId: args.userId,
        emailType: args.emailType,
        to: args.to,
        subject: args.subject,
        status: "sent",
        sentAt: Date.now(),
        resendEmailId: emailId,
      });
    }

    return emailId;
  },
});

export const handleEmailEvent = internalMutation({
  args: vOnEmailEventArgs,
  handler: async (ctx, args) => {
    const eventType = args.event.type;
    const statusMap: Record<string, string> = {
      "email.delivered": "delivered",
      "email.bounced": "bounced",
      "email.failed": "failed",
      "email.complained": "complained",
      "email.delivery_delayed": "delivery_delayed",
    };

    const newStatus = statusMap[eventType];
    if (!newStatus) return;

    const logs = await ctx.db
      .query("emailLogs")
      .filter((q) => q.eq(q.field("resendEmailId"), args.id))
      .collect();

    for (const log of logs) {
      await ctx.db.patch(log._id, { status: newStatus });
    }
  },
});
