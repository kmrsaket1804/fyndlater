import type { Metadata } from 'next';
import Link from 'next/link';
import { Check } from 'lucide-react';
import { LegalLayout, LegalSection, LegalList } from '@/components/landing/legal-layout';
import { company } from '@/lib/company';
import { formatInrPrice, products } from '@/lib/products';
import { plans } from '@/lib/payments/plans';

export const metadata: Metadata = {
  title: 'Refunds & Cancellations — FyndLater',
  description:
    'Refund and cancellation policy for FyndLater Pro subscriptions paid via Cashfree.',
};

const lastUpdated = 'June 18, 2026';

export default function RefundsPage() {
  return (
    <LegalLayout title="Refunds & Cancellations" lastUpdated={lastUpdated}>
      <LegalSection title="1. Overview">
        <p>
          This Refunds &amp; Cancellations Policy applies to paid subscriptions
          for FyndLater Pro purchased through our website. All prices are
          displayed and charged in <strong>Indian Rupees (INR)</strong>. Payments
          are processed securely by{' '}
          <strong>Cashfree Payments India Pvt. Ltd.</strong>
        </p>
      </LegalSection>

      <LegalSection title="2. Products Covered">
        <p>The following paid product is subject to this policy:</p>
        <LegalList
          items={products
            .filter((p) => p.priceInr > 0)
            .map(
              (p) =>
                `${p.name} — ${formatInrPrice(p.priceInr)} per month (${p.currency})`
            )}
        />
        <p>
          See our{' '}
          <Link href="/services" className="text-violet-600 hover:text-violet-700">
            Products &amp; Services
          </Link>{' '}
          page for full product descriptions and pricing.
        </p>
      </LegalSection>

      <LegalSection title="3. Free Trial">
        <p>
          FyndLater offers a {plans.free.trialDays}-day free trial on the Free
          plan. No payment is collected during the trial. If you upgrade to Pro,
          you will be charged {formatInrPrice(plans.pro.amountInr)} per month in
          INR at checkout.
        </p>
      </LegalSection>

      <LegalSection title="4. Cancellation">
        <p>You may cancel your Pro subscription at any time by:</p>
        <LegalList
          items={[
            'Emailing us at hello@fyndlater.com with your account email',
            'Using the billing section in your FyndLater dashboard',
            'Calling us at +91 8969330953 during business hours',
          ]}
        />
        <p>
          Upon cancellation, your subscription remains active until the end of
          the current billing period. You will not be charged for subsequent
          months. Access to Pro features continues until the paid period expires,
          after which your account reverts to the Free plan limits.
        </p>
      </LegalSection>

      <LegalSection title="5. Refund Policy">
        <p>
          Because FyndLater Pro is a digital subscription service delivered
          immediately upon payment, refunds are generally not provided once a
          billing period has started. However, we may issue a refund at our
          discretion in the following cases:
        </p>
        <LegalList
          items={[
            'Duplicate or erroneous charges',
            'Technical failure preventing access to paid features for more than 48 hours',
            'Unauthorized transactions reported within 7 days of the charge',
            'Refund requests made within 7 days of first Pro purchase if you have not materially used Pro features',
          ]}
        />
        <p>
          Approved refunds are processed to the original payment method within
          7–10 business days, subject to Cashfree and your bank&apos;s processing
          timelines.
        </p>
      </LegalSection>

      <LegalSection title="6. Failed or Disputed Payments">
        <p>
          If a payment fails or is disputed, your Pro subscription may be suspended
          until payment is resolved. Contact us promptly at {company.email} so we
          can assist.
        </p>
      </LegalSection>

      <LegalSection title="7. Contact for Refunds & Cancellations">
        <p>To request a cancellation or refund, contact:</p>
        <LegalList
          items={[
            `Email: ${company.email}`,
            `Phone: ${company.phone}`,
            `Address: ${company.officeAddress}`,
            company.businessHours.weekdays,
          ]}
        />
        <p>
          Please include your registered email, date of payment, and transaction
          reference (if available). We aim to respond within 2 business days.
        </p>
      </LegalSection>

      <LegalSection title="8. Related Policies">
        <p>
          This policy should be read together with our{' '}
          <Link href="/terms" className="text-violet-600 hover:text-violet-700">
            Terms &amp; Conditions
          </Link>
          ,{' '}
          <Link href="/privacy" className="text-violet-600 hover:text-violet-700">
            Privacy Policy
          </Link>
          , and{' '}
          <Link href="/contact" className="text-violet-600 hover:text-violet-700">
            Contact Us
          </Link>{' '}
          page.
        </p>
      </LegalSection>
    </LegalLayout>
  );
}
