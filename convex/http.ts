import { httpRouter } from "convex/server";
import { components, internal } from "./_generated/api";
import { registerRoutes } from "@convex-dev/stripe";
import { httpAction } from "./_generated/server";
import { auth } from "./auth";
import { resend } from "./email";
import type { Id } from "./_generated/dataModel";

const http = httpRouter();

// Convex Auth routes (required for sign-in/sign-up to work)
auth.addHttpRoutes(http);

registerRoutes(http, components.stripe, {
  webhookPath: "/stripe/webhook",
  events: {
    "checkout.session.completed": async (ctx, event) => {
      const session = event.data.object;
      const userId = session.metadata?.userId as Id<"users"> | undefined;
      const customerEmail = session.customer_email ?? session.customer_details?.email;

      if (!userId || !customerEmail) return;

      const user = await ctx.runQuery(internal.emailHelpers.getUserById, {
        userId: userId as string,
      });

      await ctx.scheduler.runAfter(
        0,
        internal.emailActions.sendSubscriptionConfirmedEmail,
        {
          userId,
          email: customerEmail,
          name: user?.name ?? "there",
          planName: "Pro",
        }
      );
    },

    "invoice.paid": async (ctx, event) => {
      const invoice = event.data.object;
      const customerEmail = invoice.customer_email;
      if (!customerEmail) return;

      // Look up user by email
      const user = await ctx.runQuery(
        internal.emailHelpers.getUserByEmail,
        { email: customerEmail }
      );
      if (!user) return;

      const amountPaid = (invoice.amount_paid / 100).toFixed(2);
      const currency = (invoice.currency ?? "usd").toUpperCase();
      const paidDate = new Date((invoice.status_transitions?.paid_at ?? Date.now() / 1000) * 1000);
      const periodStart = invoice.lines?.data?.[0]?.period?.start;
      const periodEnd = invoice.lines?.data?.[0]?.period?.end;

      await ctx.scheduler.runAfter(
        0,
        internal.emailActions.sendPaymentReceiptEmail,
        {
          userId: user._id,
          email: customerEmail,
          name: user.name ?? "there",
          amount: `$${amountPaid}`,
          currency,
          date: paidDate.toLocaleDateString("en-US", {
            year: "numeric",
            month: "long",
            day: "numeric",
          }),
          invoiceId: invoice.number ?? invoice.id,
          planName: "Pro",
          periodStart: periodStart
            ? new Date(periodStart * 1000).toLocaleDateString("en-US", {
                year: "numeric",
                month: "short",
                day: "numeric",
              })
            : "N/A",
          periodEnd: periodEnd
            ? new Date(periodEnd * 1000).toLocaleDateString("en-US", {
                year: "numeric",
                month: "short",
                day: "numeric",
              })
            : "N/A",
        }
      );
    },

    "customer.subscription.deleted": async (ctx, event) => {
      const subscription = event.data.object;
      const userId = subscription.metadata?.userId as Id<"users"> | undefined;

      if (!userId) return;

      const user = await ctx.runQuery(internal.emailHelpers.getUserById, {
        userId: userId as string,
      });
      if (!user?.email) return;

      // Use cancel_at or canceled_at timestamp for the access end date
      const endTimestamp = subscription.cancel_at ?? subscription.canceled_at ?? Math.floor(Date.now() / 1000);
      const endDate = new Date(
        endTimestamp * 1000
      ).toLocaleDateString("en-US", {
        year: "numeric",
        month: "long",
        day: "numeric",
      });

      await ctx.scheduler.runAfter(
        0,
        internal.emailActions.sendSubscriptionCanceledEmail,
        {
          userId,
          email: user.email,
          name: user.name ?? "there",
          endDate,
        }
      );
    },

    "invoice.payment_failed": async (ctx, event) => {
      const invoice = event.data.object;
      const customerEmail = invoice.customer_email;

      if (!customerEmail) return;

      const user = await ctx.runQuery(
        internal.emailHelpers.getUserByEmail,
        { email: customerEmail }
      );
      if (!user) return;

      const amountDue = (invoice.amount_due / 100).toFixed(2);

      await ctx.scheduler.runAfter(
        0,
        internal.emailActions.sendPaymentFailedEmail,
        {
          userId: user._id,
          email: customerEmail,
          name: user.name ?? "there",
          amount: `$${amountDue}`,
        }
      );
    },
  },
});

// Resend webhook for delivery tracking
http.route({
  path: "/resend/webhook",
  method: "POST",
  handler: httpAction(async (ctx, req) => {
    return await resend.handleResendEventWebhook(ctx, req);
  }),
});

export default http;
