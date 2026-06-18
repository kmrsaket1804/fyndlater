import type { Metadata } from 'next';
import { LegalLayout, LegalSection, LegalList } from '@/components/landing/legal-layout';
import { company } from '@/lib/company';

export const metadata: Metadata = {
  title: 'Privacy Policy — FyndLater',
  description:
    'Learn how FyndLater collects, uses, and protects your personal information.',
};

const lastUpdated = 'June 18, 2026';

export default function PrivacyPage() {
  return (
    <LegalLayout title="Privacy Policy" lastUpdated={lastUpdated}>
      <LegalSection title="1. Information We Collect">
        <p>
          We collect information you provide directly to us when you create a
          FyndLater account, connect with Faye on Instagram, save content, use
          our web app, or contact us for support.
        </p>
        <LegalList
          items={[
            'Account information: name, email address, and account credentials',
            'Saved content: links, posts, reels, screenshots, notes, and messages you send to Faye',
            'Usage data: how you interact with FyndLater and Faye, including search queries and retrieval requests',
            'Payment information: billing details processed securely through Stripe',
            'Technical data: IP address, browser type, device information, and usage patterns',
            'Instagram data: messages and media you share with Faye, as permitted by your authorization',
          ]}
        />
      </LegalSection>

      <LegalSection title="2. How We Use Your Information">
        <p>We use the information we collect to:</p>
        <LegalList
          items={[
            'Provide, maintain, and improve FyndLater and Faye',
            'Understand, summarize, tag, and organize content you save',
            'Enable natural-language search and retrieval of your saved items',
            'Process transactions and send related billing information',
            'Send technical notices, updates, security alerts, and support messages',
            'Respond to your comments, questions, and support requests',
            'Monitor and analyze usage patterns to improve our services',
            'Detect, prevent, and address technical issues, fraud, or abuse',
          ]}
        />
      </LegalSection>

      <LegalSection title="3. AI Processing of Your Content">
        <p>
          FyndLater uses artificial intelligence to understand and organize the
          content you save. Your saved items may be processed by AI models to
          generate summaries, tags, collections, and retrieval results. We do
          not use your personal saved content to train public AI models without
          your consent.
        </p>
      </LegalSection>

      <LegalSection title="4. Information Sharing and Disclosure">
        <p>
          We do not sell, trade, or otherwise transfer your personal information
          to third parties except:
        </p>
        <LegalList
          items={[
            'With your explicit consent',
            'To comply with legal obligations or valid legal requests',
            'To protect our rights, users, and prevent fraud or abuse',
            'With trusted service providers who assist in our operations (under strict confidentiality agreements), such as hosting, payment processing, and analytics providers',
            'In connection with a business transfer, merger, or acquisition',
          ]}
        />
      </LegalSection>

      <LegalSection title="5. Data Security">
        <p>
          We implement appropriate technical and organizational security measures
          to protect your personal information against unauthorized access,
          alteration, disclosure, or destruction. However, no method of
          transmission over the internet or electronic storage is 100% secure.
        </p>
      </LegalSection>

      <LegalSection title="6. Data Retention">
        <p>
          We retain your personal information and saved content for as long as
          your account is active or as needed to provide our services. You may
          request deletion of your account and associated data at any time by
          contacting us.
        </p>
      </LegalSection>

      <LegalSection title="7. Your Rights">
        <p>You have the right to:</p>
        <LegalList
          items={[
            'Access and update your personal information',
            'Request deletion of your personal information and saved content',
            'Object to processing of your personal information',
            'Request data portability',
            'Withdraw consent at any time where processing is based on consent',
          ]}
        />
      </LegalSection>

      <LegalSection title="8. Cookies and Tracking Technologies">
        <p>
          We use cookies and similar tracking technologies to keep you signed in,
          remember your preferences, analyze usage patterns, and improve your
          experience. You can control cookie settings through your browser
          preferences.
        </p>
      </LegalSection>

      <LegalSection title="9. Third-Party Services">
        <p>
          FyndLater integrates with third-party services including Instagram,
          Stripe, and cloud infrastructure providers. This Privacy Policy does
          not apply to those third-party services, and we encourage you to review
          their privacy policies.
        </p>
      </LegalSection>

      <LegalSection title="10. International Data Transfers">
        <p>
          Your information may be transferred to and processed in countries other
          than your own. We ensure appropriate safeguards are in place to protect
          your personal information in accordance with this Privacy Policy.
        </p>
      </LegalSection>

      <LegalSection title="11. Children's Privacy">
        <p>
          Our services are not intended for children under 13 years of age. We do
          not knowingly collect personal information from children under 13. If
          we become aware that we have collected personal information from a child
          under 13, we will take steps to delete such information.
        </p>
      </LegalSection>

      <LegalSection title="12. Changes to This Privacy Policy">
        <p>
          We may update this Privacy Policy from time to time. We will notify you
          of any material changes by posting the new Privacy Policy on this page
          and updating the &ldquo;Last updated&rdquo; date.
        </p>
      </LegalSection>

      <LegalSection title="13. Contact Us">
        <p>
          If you have any questions about this Privacy Policy, please contact us:
        </p>
        <LegalList
          items={[
            `Email: ${company.email}`,
            `Phone: ${company.phone}`,
            `Address: ${company.officeAddress}`,
            `Data Protection Officer: ${company.legalName}`,
          ]}
        />
      </LegalSection>
    </LegalLayout>
  );
}
