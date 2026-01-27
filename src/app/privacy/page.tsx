import Link from "next/link";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Privacy Policy - Wisker",
  description: "Privacy Policy for Wisker",
};

export default function PrivacyPage() {
  return (
    <div
      className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8"
      style={{ fontFamily: "Fredoka, Arial, sans-serif" }}
    >
      <div className="max-w-4xl mx-auto bg-white shadow-lg rounded-lg p-8">
        <h1 className="text-4xl font-bold text-gray-900 mb-4">
          Privacy Policy for Wisker
        </h1>
        <p className="text-sm text-gray-500 mb-8">
          Effective Date: January 28, 2026
        </p>

        <div className="prose prose-lg max-w-none space-y-6 text-gray-700">
          <p>
            Acqron (&quot;Company,&quot; &quot;we,&quot; &quot;our,&quot; or
            &quot;us&quot;) respects your privacy. This Privacy Policy explains
            how we collect, use, and protect your information when you use
            Wisker.
          </p>

          <section>
            <h2 className="text-2xl font-bold text-gray-900 mt-8 mb-4">
              1. Information We Collect
            </h2>
            <ul className="list-disc pl-6 space-y-2">
              <li>
                <strong>Account Information:</strong> Name, email, password
              </li>
              <li>
                <strong>Usage Data:</strong> App activity, features used, time
                spent
              </li>
              <li>
                <strong>Device Data:</strong> IP address, device type, browser
                type
              </li>
              <li>
                <strong>Optional:</strong> Payment information for subscriptions
              </li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-gray-900 mt-8 mb-4">
              2. How We Use Your Information
            </h2>
            <ul className="list-disc pl-6 space-y-2">
              <li>To provide, maintain, and improve Wisker</li>
              <li>To process payments and subscriptions</li>
              <li>To communicate updates, promotions, or important notices</li>
              <li>To monitor usage and prevent fraud or abuse</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-gray-900 mt-8 mb-4">
              3. Information Sharing
            </h2>
            <p className="font-semibold">We do not sell your personal data.</p>
            <p className="mt-4">We may share information with:</p>
            <ul className="list-disc pl-6 space-y-2">
              <li>
                <strong>Service providers:</strong> Payment processors, hosting
                providers
              </li>
              <li>
                <strong>Legal authorities:</strong> If required by law
              </li>
              <li>
                <strong>Business transfers:</strong> During mergers,
                acquisitions, or business transfers
              </li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-gray-900 mt-8 mb-4">
              4. Data Security
            </h2>
            <ul className="list-disc pl-6 space-y-2">
              <li>
                We use industry-standard measures to protect your information.
              </li>
              <li>
                No system is completely secure; you use Wisker at your own risk.
              </li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-gray-900 mt-8 mb-4">
              5. Your Rights
            </h2>
            <ul className="list-disc pl-6 space-y-2">
              <li>Access, correct, or delete your personal information</li>
              <li>Opt-out of promotional communications</li>
              <li>Request data portability</li>
              <li>Withdraw consent where applicable</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-gray-900 mt-8 mb-4">
              6. Cookies & Tracking
            </h2>
            <ul className="list-disc pl-6 space-y-2">
              <li>
                Wisker may use cookies and analytics to improve the experience.
              </li>
              <li>
                You can manage cookie preferences through your device or browser
                settings.
              </li>
              <li>
                We use cookies for authentication, preferences, and analytics.
              </li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-gray-900 mt-8 mb-4">
              7. Data Retention
            </h2>
            <p>
              We retain your information as long as needed to provide Wisker and
              comply with legal obligations. You may request deletion of your
              account and data at any time.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-gray-900 mt-8 mb-4">
              8. Children&apos;s Privacy
            </h2>
            <p>
              Wisker is not intended for children under 13. We do not knowingly
              collect personal information from children under 13. If you
              believe we have collected such information, please contact us
              immediately.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-gray-900 mt-8 mb-4">
              9. International Data Transfers
            </h2>
            <p>
              Your information may be transferred to and processed in countries
              other than your own. We ensure appropriate safeguards are in place
              to protect your data.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-gray-900 mt-8 mb-4">
              10. Changes to Policy
            </h2>
            <p>
              We may update this Privacy Policy periodically. Continued use
              constitutes acceptance of changes. We will notify you of
              significant changes via email or through the app.
            </p>
          </section>

          <section className="mt-12 pt-8 border-t border-gray-200">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">
              Contact Us
            </h2>
            <p>
              If you have questions about this Privacy Policy or wish to
              exercise your rights, contact us at:
            </p>
            <p className="mt-4">
              <strong>Email:</strong> info@wisker.app
              <br />
              <strong>Company:</strong> Acqron
              <br />
              <strong>Address:</strong> Philippines
            </p>
          </section>

          <section className="mt-8 p-6 bg-orange-50 rounded-lg border border-orange-200">
            <h3 className="text-xl font-bold text-gray-900 mb-2">
              Your Privacy Matters
            </h3>
            <p>
              At Wisker, we are committed to protecting your privacy and being
              transparent about how we handle your data. If you have any
              concerns or questions, please don&apos;t hesitate to reach out to
              us.
            </p>
          </section>
        </div>

        <div className="mt-8 pt-6 border-t border-gray-200 text-center">
          <Link
            href="/signup"
            className="text-orange-500 hover:text-orange-600 font-medium transition-colors inline-block"
          >
            ← Back to Sign Up
          </Link>
        </div>
      </div>
    </div>
  );
}
