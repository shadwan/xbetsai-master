import { convexAuth } from "@convex-dev/auth/server";
import { Email } from "@convex-dev/auth/providers/Email";
import { Password } from "@convex-dev/auth/providers/Password";
import { internal } from "./_generated/api";

// ── Magic-link / OTP provider via Resend ────────────────────────────────────
const ResendOTP = Email({
  id: "resend-otp",
  maxAge: 15 * 60, // 15 minutes
  async generateVerificationToken() {
    return Math.floor(100000 + Math.random() * 900000).toString();
  },
  async sendVerificationRequest({ identifier: email, token }) {
    const from = process.env.RESEND_FROM_EMAIL ?? "onboarding@resend.dev";
    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${process.env.RESEND_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from,
        to: email,
        subject: `${token} is your xBetsAI verification code`,
        html: `
<!DOCTYPE html>
<html lang="en">
<head><meta charset="utf-8" /></head>
<body style="margin:0;padding:0;background:#f9fafb;font-family:Inter,Arial,sans-serif;">
  <div style="max-width:600px;margin:0 auto;padding:40px 20px;">
    <div style="text-align:center;margin-bottom:32px;">
      <span style="font-size:28px;font-weight:700;color:#6366f1;letter-spacing:-0.5px;">xBetsAI</span>
    </div>
    <div style="background:#ffffff;border-radius:12px;padding:40px 32px;border:1px solid #e5e7eb;">
      <p style="font-size:24px;font-weight:700;color:#111827;margin:0 0 16px;">Sign in to xBetsAI</p>
      <p style="font-size:16px;color:#111827;line-height:24px;margin:0 0 24px;">
        Enter this code to verify your email address. It expires in 15 minutes.
      </p>
      <div style="background:#f3f4f6;border-radius:8px;padding:24px;text-align:center;margin:0 0 24px;">
        <span style="font-size:36px;font-weight:700;color:#6366f1;letter-spacing:6px;font-family:monospace;">${token}</span>
      </div>
      <p style="font-size:14px;color:#6b7280;line-height:20px;margin:0;">
        If you didn&apos;t request this code, you can safely ignore this email.
      </p>
    </div>
    <div style="margin-top:32px;text-align:center;">
      <p style="color:#6b7280;font-size:12px;margin:0;">xBetsAI &middot; AI-Powered Sports Betting Intelligence</p>
    </div>
  </div>
</body>
</html>`,
      }),
    });
    if (!res.ok) {
      const body = await res.text();
      throw new Error(`Failed to send verification email: ${body}`);
    }
  },
});

// ── Password reset email provider (reuses Resend) ───────────────────────────
const ResendPasswordReset = Email({
  id: "resend-password-reset",
  maxAge: 15 * 60,
  async generateVerificationToken() {
    return Math.floor(100000 + Math.random() * 900000).toString();
  },
  async sendVerificationRequest({ identifier: email, token }) {
    const from = process.env.RESEND_FROM_EMAIL ?? "onboarding@resend.dev";
    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${process.env.RESEND_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from,
        to: email,
        subject: `${token} is your xBetsAI password reset code`,
        html: `
<!DOCTYPE html>
<html lang="en">
<head><meta charset="utf-8" /></head>
<body style="margin:0;padding:0;background:#f9fafb;font-family:Inter,Arial,sans-serif;">
  <div style="max-width:600px;margin:0 auto;padding:40px 20px;">
    <div style="text-align:center;margin-bottom:32px;">
      <span style="font-size:28px;font-weight:700;color:#6366f1;letter-spacing:-0.5px;">xBetsAI</span>
    </div>
    <div style="background:#ffffff;border-radius:12px;padding:40px 32px;border:1px solid #e5e7eb;">
      <p style="font-size:24px;font-weight:700;color:#111827;margin:0 0 16px;">Reset your password</p>
      <p style="font-size:16px;color:#111827;line-height:24px;margin:0 0 24px;">
        Use the code below to reset your password. It expires in 15 minutes.
      </p>
      <div style="background:#f3f4f6;border-radius:8px;padding:24px;text-align:center;margin:0 0 24px;">
        <span style="font-size:36px;font-weight:700;color:#6366f1;letter-spacing:6px;font-family:monospace;">${token}</span>
      </div>
      <p style="font-size:14px;color:#6b7280;line-height:20px;margin:0;">
        If you didn&apos;t request this, you can safely ignore this email.
      </p>
    </div>
    <div style="margin-top:32px;text-align:center;">
      <p style="color:#6b7280;font-size:12px;margin:0;">xBetsAI &middot; AI-Powered Sports Betting Intelligence</p>
    </div>
  </div>
</body>
</html>`,
      }),
    });
    if (!res.ok) {
      const body = await res.text();
      throw new Error(`Failed to send password reset email: ${body}`);
    }
  },
});

// ── Password provider (email + password + reset) ────────────────────────────
const PasswordAuth = Password({
  id: "password",
  reset: ResendPasswordReset,
  profile(params) {
    return {
      email: params.email as string,
      ...(params.name ? { name: params.name as string } : {}),
    };
  },
});

export const { auth, signIn, signOut, store, isAuthenticated } = convexAuth({
  providers: [ResendOTP, PasswordAuth],
  callbacks: {
    afterUserCreatedOrUpdated: async (ctx, args) => {
      // Only send welcome email for newly created users (not updates)
      if (args.existingUserId === null) {
        const user = await ctx.db.get(args.userId);
        if (user?.email) {
          await ctx.scheduler.runAfter(
            0,
            internal.emailActions.sendWelcomeEmail,
            {
              userId: args.userId,
              email: user.email,
              name: user.name ?? "there",
            }
          );
        }
      }
    },
  },
});
