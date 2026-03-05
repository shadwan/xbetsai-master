"use client";

import { useAuthActions } from "@convex-dev/auth/react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import Link from "next/link";

type AuthMethod = "password" | "magic-link";

export function SignInForm() {
  const { signIn } = useAuthActions();
  const [method, setMethod] = useState<AuthMethod>("password");
  const [step, setStep] = useState<"form" | "code">("form");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [code, setCode] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handlePasswordSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      await signIn("password", { email, password, flow: "signIn" });
    } catch {
      setError("Invalid email or password.");
    } finally {
      setLoading(false);
    }
  };

  const handleSendCode = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      await signIn("resend-otp", { email });
      setStep("code");
    } catch {
      setError("Failed to send verification code. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyCode = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      await signIn("resend-otp", { email, code });
    } catch {
      setError("Invalid or expired code. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  // OTP verification step
  if (step === "code") {
    return (
      <form onSubmit={handleVerifyCode} className="space-y-4">
        <div className="space-y-1.5">
          <h1 className="text-xl font-bold text-text-primary">
            Check your email
          </h1>
          <p className="text-sm text-text-secondary">
            We sent a 6-digit code to{" "}
            <span className="font-medium text-text-primary">{email}</span>
          </p>
        </div>

        {error && (
          <div className="rounded-lg bg-red-500/10 px-3 py-2 text-sm text-red-400">
            {error}
          </div>
        )}

        <div className="space-y-2">
          <Label htmlFor="code">Verification code</Label>
          <Input
            id="code"
            type="text"
            inputMode="numeric"
            pattern="[0-9]*"
            maxLength={6}
            placeholder="123456"
            value={code}
            onChange={(e) => setCode(e.target.value.replace(/\D/g, ""))}
            autoFocus
            required
            className="text-center text-2xl tracking-[0.3em] font-mono"
          />
        </div>

        <Button type="submit" className="w-full" disabled={loading || code.length !== 6}>
          {loading ? "Verifying…" : "Verify Code"}
        </Button>

        <div className="flex items-center justify-between text-sm">
          <button
            type="button"
            onClick={() => {
              setStep("form");
              setCode("");
              setError("");
            }}
            className="text-text-secondary hover:text-text-primary transition-colors"
          >
            Use a different email
          </button>
          <button
            type="button"
            onClick={async () => {
              setError("");
              setLoading(true);
              try {
                await signIn("resend-otp", { email });
                setError("");
              } catch {
                setError("Failed to resend code.");
              } finally {
                setLoading(false);
              }
            }}
            className="text-neon-gold hover:underline"
            disabled={loading}
          >
            Resend code
          </button>
        </div>
      </form>
    );
  }

  return (
    <form
      onSubmit={method === "password" ? handlePasswordSignIn : handleSendCode}
      className="space-y-4"
    >
      <div className="space-y-1.5">
        <h1 className="text-xl font-bold text-text-primary">Welcome back</h1>
        <p className="text-sm text-text-secondary">
          {method === "password"
            ? "Sign in with your email and password"
            : "We'll send you a verification code"}
        </p>
      </div>

      {error && (
        <div className="rounded-lg bg-red-500/10 px-3 py-2 text-sm text-red-400">
          {error}
        </div>
      )}

      <div className="space-y-2">
        <Label htmlFor="email">Email</Label>
        <Input
          id="email"
          type="email"
          placeholder="you@example.com"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
        />
      </div>

      {method === "password" && (
        <div className="space-y-2">
          <Label htmlFor="password">Password</Label>
          <Input
            id="password"
            type="password"
            placeholder="••••••••"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
        </div>
      )}

      <Button type="submit" className="w-full" disabled={loading}>
        {loading
          ? method === "password"
            ? "Signing in…"
            : "Sending code…"
          : method === "password"
            ? "Sign In"
            : "Send Verification Code"}
      </Button>

      <div className="relative">
        <div className="absolute inset-0 flex items-center">
          <span className="w-full border-t border-white/10" />
        </div>
        <div className="relative flex justify-center text-xs uppercase">
          <span className="bg-surface-1 px-2 text-text-secondary">or</span>
        </div>
      </div>

      <Button
        type="button"
        variant="outline"
        className="w-full"
        onClick={() => {
          setMethod(method === "password" ? "magic-link" : "password");
          setError("");
        }}
      >
        {method === "password"
          ? "Sign in with Magic Link"
          : "Sign in with Password"}
      </Button>

      <p className="text-center text-sm text-text-secondary">
        Don&apos;t have an account?{" "}
        <Link href="/sign-up" className="text-neon-gold hover:underline">
          Sign up
        </Link>
      </p>
    </form>
  );
}
