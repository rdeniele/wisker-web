import Link from "next/link";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Terms and Conditions - Wisker",
  description: "Terms and Conditions for using Wisker",
};

export default function TermsPage() {
  return (
    <div
      className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8"
      style={{ fontFamily: "Fredoka, Arial, sans-serif" }}
    >
      <div className="max-w-4xl mx-auto bg-white shadow-lg rounded-lg p-8">
        <h1 className="text-4xl font-bold text-gray-900 mb-4">
          Terms and Conditions for Wisker
        </h1>
        <p className="text-sm text-gray-500 mb-8">
          Effective Date: January 28, 2026
        </p>

        <div className="prose prose-lg max-w-none space-y-6 text-gray-700">
          <p>
            Welcome to Wisker, a product of Acqron (&quot;Company,&quot; &quot;we,&quot; &quot;our,&quot; or &quot;us&quot;).
            By accessing or using Wisker, you (&quot;User,&quot; &quot;you,&quot; or &quot;your&quot;) agree to these Terms
            and Conditions.
          </p>

          <section>
            <h2 className="text-2xl font-bold text-gray-900 mt-8 mb-4">
              1. Acceptance of Terms
            </h2>
            <p>
              By using Wisker, you agree to comply with these Terms. If you do
              not agree, do not use Wisker.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-gray-900 mt-8 mb-4">
              2. Eligibility
            </h2>
            <p>
              You must be at least 13 years old (or older if required by local
              law) to use Wisker.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-gray-900 mt-8 mb-4">
              3. Account Responsibility
            </h2>
            <ul className="list-disc pl-6 space-y-2">
              <li>
                You are responsible for maintaining the confidentiality of your
                account information.
              </li>
              <li>
                You agree to provide accurate, current, and complete information
                when registering.
              </li>
              <li>
                You are responsible for all activities under your account.
              </li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-gray-900 mt-8 mb-4">
              4. Use of Wisker
            </h2>
            <p>Wisker is for educational and personal use only.</p>
            <p className="font-semibold mt-4">You may not use Wisker to:</p>
            <ul className="list-disc pl-6 space-y-2">
              <li>Violate laws or regulations</li>
              <li>Infringe on intellectual property rights</li>
              <li>Harm, harass, or threaten others</li>
              <li>
                Access the service through unauthorized methods (scraping, bots,
                etc.)
              </li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-gray-900 mt-8 mb-4">
              5. Subscriptions and Payments
            </h2>
            <ul className="list-disc pl-6 space-y-2">
              <li>
                All subscription payments are billed in PHP (Philippine Peso) and are
                non-refundable unless required by law.
              </li>
              <li>
                Prices are subject to change, but changes will not affect active
                subscriptions without notice.
              </li>
              <li>
                Overuse of credits may incur additional charges as outlined in
                the plan.
              </li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-gray-900 mt-8 mb-4">
              6. Intellectual Property
            </h2>
            <ul className="list-disc pl-6 space-y-2">
              <li>
                All content, features, and technology in Wisker are owned by
                Acqron.
              </li>
              <li>
                Users may not copy, distribute, sell, or modify any content or
                software.
              </li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-gray-900 mt-8 mb-4">
              7. Termination
            </h2>
            <ul className="list-disc pl-6 space-y-2">
              <li>
                We may suspend or terminate your account if you violate these
                Terms.
              </li>
              <li>
                You may cancel your subscription at any time, subject to our
                cancellation policies.
              </li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-gray-900 mt-8 mb-4">
              8. Disclaimers
            </h2>
            <ul className="list-disc pl-6 space-y-2">
              <li>
                Wisker is provided &quot;as is&quot; without warranties of any kind.
              </li>
              <li>
                We do not guarantee accuracy, completeness, or availability of
                content.
              </li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-gray-900 mt-8 mb-4">
              9. Limitation of Liability
            </h2>
            <ul className="list-disc pl-6 space-y-2">
              <li>
                Acqron is not liable for indirect, incidental, or consequential
                damages arising from your use of Wisker.
              </li>
              <li>Your use is at your own risk.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-gray-900 mt-8 mb-4">
              10. Governing Law
            </h2>
            <p>
              These Terms are governed by the laws of the Philippines.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-gray-900 mt-8 mb-4">
              11. Changes to Terms
            </h2>
            <p>
              We may update these Terms periodically. Continued use of Wisker
              constitutes acceptance of any changes.
            </p>
          </section>

          <section className="mt-12 pt-8 border-t border-gray-200">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">
              Contact Us
            </h2>
            <p>
              If you have questions about these Terms and Conditions, please
              contact us at:
            </p>
            <p className="mt-4">
              <strong>Email:</strong> info@wisker.app
              <br />
              <strong>Company:</strong> Acqron
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
