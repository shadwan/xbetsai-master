"use node";

import { v } from "convex/values";
import { internalAction } from "./_generated/server";
import { internal } from "./_generated/api";
import { render } from "@react-email/components";
import WelcomeEmail from "../emails/WelcomeEmail";
import PasswordResetEmail from "../emails/PasswordResetEmail";
import SubscriptionConfirmedEmail from "../emails/SubscriptionConfirmedEmail";
import PaymentReceiptEmail from "../emails/PaymentReceiptEmail";
import SubscriptionCanceledEmail from "../emails/SubscriptionCanceledEmail";
import PaymentFailedEmail from "../emails/PaymentFailedEmail";
import { createElement } from "react";

const FROM_EMAIL = process.env.RESEND_FROM_EMAIL ?? "noreply@xbetsai.com";
const APP_URL = process.env.NEXT_PUBLIC_APP_URL ?? "https://xbetsai.com";

export const sendWelcomeEmail = internalAction({
  args: {
    userId: v.id("users"),
    email: v.string(),
    name: v.string(),
  },
  handler: async (ctx, args) => {
    const html = await render(
      createElement(WelcomeEmail, {
        name: args.name,
        appUrl: APP_URL,
      })
    );

    await ctx.runMutation(internal.email.queueEmail, {
      from: FROM_EMAIL,
      to: args.email,
      subject: `Welcome to xBetsAI, ${args.name}!`,
      html,
      userId: args.userId,
      emailType: "welcome",
    });
  },
});

export const sendPasswordResetEmail = internalAction({
  args: {
    userId: v.id("users"),
    email: v.string(),
    name: v.string(),
    resetCode: v.string(),
  },
  handler: async (ctx, args) => {
    const resetUrl = `${APP_URL}/reset?code=${args.resetCode}`;
    const html = await render(
      createElement(PasswordResetEmail, {
        name: args.name,
        resetCode: args.resetCode,
        resetUrl,
      })
    );

    await ctx.runMutation(internal.email.queueEmail, {
      from: FROM_EMAIL,
      to: args.email,
      subject: "Reset your xBetsAI password",
      html,
      userId: args.userId,
      emailType: "password_reset",
    });
  },
});

export const sendSubscriptionConfirmedEmail = internalAction({
  args: {
    userId: v.id("users"),
    email: v.string(),
    name: v.string(),
    planName: v.string(),
  },
  handler: async (ctx, args) => {
    const html = await render(
      createElement(SubscriptionConfirmedEmail, {
        name: args.name,
        planName: args.planName,
        appUrl: APP_URL,
      })
    );

    await ctx.runMutation(internal.email.queueEmail, {
      from: FROM_EMAIL,
      to: args.email,
      subject: `Your ${args.planName} subscription is active!`,
      html,
      userId: args.userId,
      emailType: "subscription_confirmed",
    });
  },
});

export const sendPaymentReceiptEmail = internalAction({
  args: {
    userId: v.id("users"),
    email: v.string(),
    name: v.string(),
    amount: v.string(),
    currency: v.string(),
    date: v.string(),
    invoiceId: v.string(),
    planName: v.string(),
    periodStart: v.string(),
    periodEnd: v.string(),
  },
  handler: async (ctx, args) => {
    const html = await render(
      createElement(PaymentReceiptEmail, {
        name: args.name,
        amount: args.amount,
        currency: args.currency,
        date: args.date,
        invoiceId: args.invoiceId,
        planName: args.planName,
        periodStart: args.periodStart,
        periodEnd: args.periodEnd,
      })
    );

    await ctx.runMutation(internal.email.queueEmail, {
      from: FROM_EMAIL,
      to: args.email,
      subject: `Payment receipt — ${args.amount}`,
      html,
      userId: args.userId,
      emailType: "payment_receipt",
    });
  },
});

export const sendSubscriptionCanceledEmail = internalAction({
  args: {
    userId: v.id("users"),
    email: v.string(),
    name: v.string(),
    endDate: v.string(),
  },
  handler: async (ctx, args) => {
    const html = await render(
      createElement(SubscriptionCanceledEmail, {
        name: args.name,
        endDate: args.endDate,
        resubscribeUrl: `${APP_URL}/subscribe`,
      })
    );

    await ctx.runMutation(internal.email.queueEmail, {
      from: FROM_EMAIL,
      to: args.email,
      subject: "Your xBetsAI subscription has been canceled",
      html,
      userId: args.userId,
      emailType: "subscription_canceled",
    });
  },
});

export const sendPaymentFailedEmail = internalAction({
  args: {
    userId: v.id("users"),
    email: v.string(),
    name: v.string(),
    amount: v.string(),
  },
  handler: async (ctx, args) => {
    const html = await render(
      createElement(PaymentFailedEmail, {
        name: args.name,
        amount: args.amount,
        updateBillingUrl: `${APP_URL}/settings/billing`,
      })
    );

    await ctx.runMutation(internal.email.queueEmail, {
      from: FROM_EMAIL,
      to: args.email,
      subject: "Action required: Your payment failed",
      html,
      userId: args.userId,
      emailType: "payment_failed",
    });
  },
});
