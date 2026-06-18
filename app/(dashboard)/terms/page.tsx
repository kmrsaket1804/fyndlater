import type { Metadata } from 'next';
import Link from 'next/link';
import { LegalLayout, LegalSection, LegalList } from '@/components/landing/legal-layout';
import { company } from '@/lib/company';

export const metadata: Metadata = {
  title: 'Terms & Conditions — FyndLater',
  description: 'Terms and conditions for using FyndLater and Faye.',
};

const lastUpdated = 'June 18, 2026';

export default function TermsPage() {
  return (
    <LegalLayout title="Terms & Conditions" lastUpdated={lastUpdated}>
      <LegalSection title="1. Acceptance of Terms">
        <p>
          By accessing and using FyndLater services, including the FyndLater web
          app and Faye on Instagram, you accept and agree to be bound by these
          Terms &amp; Conditions. If you do not agree, please do not use our
          services.
        </p>
      </LegalSection>

      <LegalSection title="2. Service Description">
        <p>
          FyndLater is an AI-powered memory assistant that helps you save,
          organize, and retrieve content from social media and other sources.
          Faye, our personified assistant, allows you to send reels, posts,
          screenshots, links, and notes via Instagram, automatically organizes
          them into smart collections, and enables natural-language retrieval
          later through chat.
        </p>
      </LegalSection>

      <LegalSection title="3. User Responsibilities">
        <LegalList
          items={[
            'Provide accurate and complete information when creating your account',
            'Maintain the confidentiality of your account credentials',
            'Only save content you have the right to store and retrieve',
            'Use our services in compliance with applicable laws and platform terms (including Instagram\'s terms)',
            'Not use FyndLater for unlawful, harmful, or abusive purposes',
            'Not attempt to disrupt, reverse-engineer, or misuse our services',
            'Respect the intellectual property rights of content creators and third parties',
          ]}
        />
      </LegalSection>

      <LegalSection title="4. Content You Save">
        <p>
          You retain ownership of the content you save through FyndLater. By
          using our services, you grant us a limited license to process, store,
          summarize, tag, and organize your content solely to provide the
          services described. You are responsible for ensuring you have the
          right to save and access any content you send to Faye.
        </p>
      </LegalSection>

      <LegalSection title="5. AI-Generated Outputs">
        <p>
          FyndLater uses AI to summarize, tag, and retrieve your saved content.
          AI-generated summaries, tags, and search results may not always be
          perfectly accurate. You should verify important information
          independently. We are not liable for decisions made based on
          AI-generated outputs.
        </p>
      </LegalSection>

      <LegalSection title="6. Payment Terms">
        <p>
          Paid subscription fees are billed in advance on a monthly or annual
          basis through Stripe. All payments are processed securely. Free trial
          terms, if offered, will be described at checkout. Refunds are subject
          to our refund policy and applicable law.
        </p>
      </LegalSection>

      <LegalSection title="7. Limitation of Liability">
        <p>
          To the maximum extent permitted by law, {company.legalName} shall not
          be liable for any indirect, incidental, special, consequential, or
          punitive damages, including without limitation, loss of profits, data,
          saved content, use, goodwill, or other intangible losses resulting from
          your use of our services.
        </p>
      </LegalSection>

      <LegalSection title="8. Intellectual Property">
        <p>
          The FyndLater service, Faye brand, software, design, and original
          content are the exclusive property of {company.legalName} and its
          licensors. The service is protected by copyright, trademark, and other
          laws. You may not copy, modify, or distribute our proprietary materials
          without written permission.
        </p>
      </LegalSection>

      <LegalSection title="9. Termination">
        <p>
          We may terminate or suspend your account and access to the service
          immediately, without prior notice, for any reason including breach of
          these Terms. You may cancel your account at any time by contacting us
          or through your account settings.
        </p>
      </LegalSection>

      <LegalSection title="10. Governing Law">
        <p>
          These Terms shall be interpreted and governed by the laws of India. Any
          disputes arising from these terms shall be subject to the exclusive
          jurisdiction of the courts in Bengaluru, Karnataka.
        </p>
      </LegalSection>

      <LegalSection title="11. Contact Information">
        <p>For questions about these Terms &amp; Conditions, contact us:</p>
        <LegalList
          items={[
            `Email: ${company.email}`,
            `Phone: ${company.phone}`,
            `Address: ${company.officeAddress}`,
          ]}
        />
      </LegalSection>

      <LegalSection title="12. Changes to Terms">
        <p>
          We reserve the right to modify or replace these Terms at any time. If a
          revision is material, we will provide at least 30 days notice before
          new terms take effect. Continued use of FyndLater after changes
          constitutes acceptance of the updated Terms. See also our{' '}
          <Link href="/privacy" className="text-violet-600 hover:text-violet-700">
            Privacy Policy
          </Link>
          .
        </p>
      </LegalSection>
    </LegalLayout>
  );
}
