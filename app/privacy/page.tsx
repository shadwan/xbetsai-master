import { LandingNav } from "@/src/components/landing/LandingNav";
import { LandingFooter } from "@/src/components/landing/LandingFooter";

export const metadata = {
  title: "Privacy Policy — xBetsAI",
};

export default function PrivacyPage() {
  return (
    <div className="min-h-screen bg-[#060b12]">
      <LandingNav />
      <main className="mx-auto max-w-3xl px-6 py-16 sm:py-24">
        <h1 className="text-3xl font-[800] text-text-primary sm:text-4xl">
          Privacy Policy
        </h1>
        <p className="mt-2 text-sm text-text-tertiary">
          Last updated: March 20, 2026
        </p>

        <div className="mt-10 space-y-8 text-text-secondary leading-relaxed">
          <section>
            <h2 className="text-lg font-bold text-text-primary">
              1. Who We Are
            </h2>
            <p className="mt-2">
              xBetsAI (&ldquo;we,&rdquo; &ldquo;us,&rdquo; or &ldquo;our&rdquo;)
              operates xbets.ai, a sports analytics and information platform. We
              provide odds comparison data, statistical analysis, and
              informational tools. We are not a sportsbook, gambling operator, or
              betting platform, and we do not facilitate, process, or accept any
              wagers.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-bold text-text-primary">
              2. Information We Collect
            </h2>
            <p className="mt-2">We collect the following information:</p>
            <ul className="mt-3 list-disc space-y-2 pl-6">
              <li>
                <strong>Account information:</strong> Your name, email address,
                and password when you create an account.
              </li>
              <li>
                <strong>Billing information:</strong> Payment details are
                processed securely by Stripe. We do not store your full credit
                card number on our servers.
              </li>
              <li>
                <strong>Usage data:</strong> Pages you visit, features you use,
                and general interaction patterns to improve our service.
              </li>
              <li>
                <strong>Device information:</strong> Browser type, operating
                system, and IP address for security and analytics purposes.
              </li>
            </ul>
          </section>

          <section>
            <h2 className="text-lg font-bold text-text-primary">
              3. How We Use Your Information
            </h2>
            <ul className="mt-2 list-disc space-y-2 pl-6">
              <li>To provide and maintain our analytics platform</li>
              <li>To process your subscription payments via Stripe</li>
              <li>
                To send you transactional emails (account verification, payment
                receipts, subscription updates)
              </li>
              <li>To improve our platform based on usage patterns</li>
              <li>To respond to your support requests</li>
            </ul>
          </section>

          <section>
            <h2 className="text-lg font-bold text-text-primary">
              4. Third-Party Services
            </h2>
            <p className="mt-2">We use the following third-party services:</p>
            <ul className="mt-3 list-disc space-y-2 pl-6">
              <li>
                <strong>Stripe:</strong> For secure payment processing. Stripe&apos;s
                privacy policy is available at{" "}
                <a
                  href="https://stripe.com/privacy"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-neon-gold hover:underline"
                >
                  stripe.com/privacy
                </a>
                .
              </li>
              <li>
                <strong>Convex:</strong> For data storage and backend services.
              </li>
              <li>
                <strong>Resend:</strong> For transactional email delivery.
              </li>
            </ul>
            <p className="mt-3">
              We do not sell, trade, or rent your personal information to third
              parties.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-bold text-text-primary">
              5. Data Security
            </h2>
            <p className="mt-2">
              We implement industry-standard security measures to protect your
              personal information. Passwords are hashed and encrypted. Payment
              information is handled entirely by Stripe and never touches our
              servers. However, no method of transmission over the internet is
              100% secure, and we cannot guarantee absolute security.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-bold text-text-primary">
              6. Your Rights
            </h2>
            <p className="mt-2">You have the right to:</p>
            <ul className="mt-3 list-disc space-y-2 pl-6">
              <li>Access the personal data we hold about you</li>
              <li>Request correction of inaccurate data</li>
              <li>Request deletion of your account and associated data</li>
              <li>Cancel your subscription at any time through the Stripe customer portal</li>
            </ul>
            <p className="mt-3">
              To exercise any of these rights, contact us at{" "}
              <a
                href="mailto:support@xbets.ai"
                className="text-neon-gold hover:underline"
              >
                support@xbets.ai
              </a>
              .
            </p>
          </section>

          <section>
            <h2 className="text-lg font-bold text-text-primary">
              7. Cookies
            </h2>
            <p className="mt-2">
              We use essential cookies required for authentication and session
              management. We do not use advertising or tracking cookies.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-bold text-text-primary">
              8. Changes to This Policy
            </h2>
            <p className="mt-2">
              We may update this privacy policy from time to time. We will notify
              you of significant changes via email or a notice on our platform.
              Continued use of the service after changes constitutes acceptance of
              the updated policy.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-bold text-text-primary">
              9. Contact Us
            </h2>
            <p className="mt-2">
              If you have questions about this privacy policy, contact us at{" "}
              <a
                href="mailto:support@xbets.ai"
                className="text-neon-gold hover:underline"
              >
                support@xbets.ai
              </a>
              .
            </p>
          </section>
        </div>
      </main>
      <LandingFooter />
    </div>
  );
}
