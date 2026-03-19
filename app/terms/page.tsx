import { LandingNav } from "@/src/components/landing/LandingNav";
import { LandingFooter } from "@/src/components/landing/LandingFooter";

export const metadata = {
  title: "Terms of Service — xBetsAI",
};

export default function TermsPage() {
  return (
    <div className="min-h-screen bg-[#060b12]">
      <LandingNav />
      <main className="mx-auto max-w-3xl px-6 py-16 sm:py-24">
        <h1 className="text-3xl font-[800] text-text-primary sm:text-4xl">
          Terms of Service
        </h1>
        <p className="mt-2 text-sm text-text-tertiary">
          Last updated: March 20, 2026
        </p>

        <div className="mt-10 space-y-8 text-text-secondary leading-relaxed">
          <section>
            <h2 className="text-lg font-bold text-text-primary">
              1. Agreement to Terms
            </h2>
            <p className="mt-2">
              By accessing or using xBetsAI (&ldquo;the Service&rdquo;), you
              agree to be bound by these Terms of Service. If you do not agree to
              these terms, do not use the Service.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-bold text-text-primary">
              2. Description of Service
            </h2>
            <p className="mt-2">
              xBetsAI is a <strong>sports analytics and information platform</strong>.
              We provide:
            </p>
            <ul className="mt-3 list-disc space-y-2 pl-6">
              <li>Odds comparison data from publicly available sportsbook lines</li>
              <li>Statistical analysis and informational tools</li>
              <li>Alerts and notifications about odds changes</li>
            </ul>
            <p className="mt-3 font-semibold text-text-primary">
              xBetsAI is NOT a sportsbook, gambling operator, or betting
              platform. We do not accept, facilitate, or process any wagers or
              bets. We do not hold customer funds. All betting activity occurs
              solely on third-party licensed sportsbook platforms at the user&apos;s
              own discretion.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-bold text-text-primary">
              3. Eligibility
            </h2>
            <p className="mt-2">
              You must be at least 18 years old (or the legal age in your
              jurisdiction) to use this Service. By using the Service, you
              represent that you meet this requirement. It is your responsibility
              to ensure that accessing sports betting information is legal in your
              jurisdiction.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-bold text-text-primary">
              4. User Accounts
            </h2>
            <ul className="mt-2 list-disc space-y-2 pl-6">
              <li>
                You are responsible for maintaining the security of your account
                credentials.
              </li>
              <li>
                You must provide accurate information when creating your account.
              </li>
              <li>
                You may not share your account or allow others to access the
                Service using your credentials.
              </li>
              <li>
                We reserve the right to suspend or terminate accounts that violate
                these terms.
              </li>
            </ul>
          </section>

          <section>
            <h2 className="text-lg font-bold text-text-primary">
              5. Subscriptions and Payments
            </h2>
            <ul className="mt-2 list-disc space-y-2 pl-6">
              <li>
                Access to premium features requires a paid subscription.
              </li>
              <li>
                Subscriptions are billed on a recurring basis (monthly or
                annually) through Stripe.
              </li>
              <li>
                You may cancel your subscription at any time through the customer
                billing portal. Cancellation takes effect at the end of your
                current billing period.
              </li>
              <li>
                We do not offer refunds for partial billing periods. If you
                cancel, you retain access until the end of your paid period.
              </li>
              <li>
                We reserve the right to change pricing with 30 days&apos; notice.
                Existing subscribers will be notified before any price changes
                take effect.
              </li>
            </ul>
          </section>

          <section>
            <h2 className="text-lg font-bold text-text-primary">
              6. Acceptable Use
            </h2>
            <p className="mt-2">You agree NOT to:</p>
            <ul className="mt-3 list-disc space-y-2 pl-6">
              <li>
                Scrape, copy, or redistribute data from the Service without
                written permission
              </li>
              <li>
                Use automated tools, bots, or scripts to access the Service in a
                manner that exceeds reasonable personal use
              </li>
              <li>
                Resell, sublicense, or commercially redistribute access to the
                Service
              </li>
              <li>
                Attempt to reverse-engineer, decompile, or interfere with the
                operation of the Service
              </li>
              <li>
                Use the Service for any purpose that is illegal in your
                jurisdiction
              </li>
            </ul>
          </section>

          <section>
            <h2 className="text-lg font-bold text-text-primary">
              7. Disclaimer — Not Financial or Betting Advice
            </h2>
            <p className="mt-2">
              The information provided by xBetsAI is for{" "}
              <strong>informational and entertainment purposes only</strong>. It
              does not constitute financial advice, gambling advice, or a
              recommendation to place any wager.
            </p>
            <p className="mt-3">
              Odds data is sourced from publicly available third-party APIs and
              may be delayed, incomplete, or inaccurate. We make no guarantees
              about the accuracy, completeness, or timeliness of any data
              displayed on the platform.
            </p>
            <p className="mt-3">
              <strong>
                Any decision to place a bet is made entirely at your own risk.
              </strong>{" "}
              Past performance, statistical models, and odds comparisons do not
              guarantee future results. You should never bet more than you can
              afford to lose.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-bold text-text-primary">
              8. Responsible Gambling
            </h2>
            <p className="mt-2">
              We encourage all users to gamble responsibly. If you or someone you
              know has a gambling problem, please contact:
            </p>
            <ul className="mt-3 list-disc space-y-2 pl-6">
              <li>
                <strong>National Council on Problem Gambling:</strong>{" "}
                1-800-522-4700 or{" "}
                <a
                  href="https://www.ncpgambling.org"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-neon-gold hover:underline"
                >
                  ncpgambling.org
                </a>
              </li>
              <li>
                <strong>Gamblers Anonymous:</strong>{" "}
                <a
                  href="https://www.gamblersanonymous.org"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-neon-gold hover:underline"
                >
                  gamblersanonymous.org
                </a>
              </li>
            </ul>
          </section>

          <section>
            <h2 className="text-lg font-bold text-text-primary">
              9. Limitation of Liability
            </h2>
            <p className="mt-2">
              To the maximum extent permitted by law, xBetsAI and its operators
              shall not be liable for any direct, indirect, incidental, special,
              or consequential damages arising from your use of the Service,
              including but not limited to financial losses from betting
              decisions made based on information provided by the Service.
            </p>
            <p className="mt-3">
              The Service is provided &ldquo;as is&rdquo; and &ldquo;as
              available&rdquo; without warranties of any kind, either express or
              implied.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-bold text-text-primary">
              10. Intellectual Property
            </h2>
            <p className="mt-2">
              All content, features, and functionality of the Service (including
              but not limited to text, graphics, logos, and software) are owned by
              xBetsAI and are protected by intellectual property laws. You may not
              reproduce, distribute, or create derivative works without our
              written consent.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-bold text-text-primary">
              11. Changes to Terms
            </h2>
            <p className="mt-2">
              We may update these terms from time to time. Material changes will
              be communicated via email or a notice on the platform at least 14
              days before taking effect. Continued use of the Service after
              changes constitutes acceptance of the updated terms.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-bold text-text-primary">
              12. Termination
            </h2>
            <p className="mt-2">
              We may terminate or suspend your access to the Service at any time,
              with or without cause, with or without notice. Upon termination,
              your right to use the Service ceases immediately. Any remaining
              subscription period will not be refunded unless required by
              applicable law.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-bold text-text-primary">
              13. Contact Us
            </h2>
            <p className="mt-2">
              If you have questions about these terms, contact us at{" "}
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
