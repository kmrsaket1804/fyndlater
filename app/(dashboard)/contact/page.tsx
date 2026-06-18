import type { Metadata } from 'next';
import { Mail, MapPin, Phone, Clock } from 'lucide-react';
import { Footer } from '@/components/landing/footer';
import { company } from '@/lib/company';
import { ContactForm } from './contact-form';

export const metadata: Metadata = {
  title: 'Contact — FyndLater',
  description: 'Get in touch with the FyndLater team. We typically respond within 24 hours.',
};

const faqs = [
  {
    question: 'How quickly do you respond?',
    answer:
      'We typically respond to all inquiries within 24 hours during business days.',
  },
  {
    question: 'Do you offer support?',
    answer:
      'Yes. We provide email and phone support for all FyndLater users.',
  },
  {
    question: 'Can I get help setting up Faye on Instagram?',
    answer:
      'Absolutely. Contact us and we\'ll walk you through connecting with Faye and saving your first items.',
  },
  {
    question: 'What are your business hours?',
    answer: `${company.businessHours.weekdays}. ${company.businessHours.saturday}`,
  },
];

export default function ContactPage() {
  return (
    <>
      <div className="bg-gradient-to-b from-violet-50/50 to-white border-b border-gray-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-14 text-center">
          <p className="text-sm font-medium text-violet-600 mb-3">Get in Touch</p>
          <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-gray-900 tracking-tight">
            Let&apos;s make saving effortless
          </h1>
          <p className="mt-4 text-lg text-gray-600 max-w-2xl mx-auto">
            Questions about FyndLater or Faye? Our team is here to help you save
            now and find later.
          </p>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="grid lg:grid-cols-5 gap-12">
          <div className="lg:col-span-3">
            <h2 className="text-xl font-semibold text-gray-900 mb-6">
              Send us a message
            </h2>
            <ContactForm />
          </div>

          <div className="lg:col-span-2 space-y-8">
            <div>
              <h2 className="text-xl font-semibold text-gray-900 mb-5">
                Get in touch
              </h2>
              <div className="space-y-5">
                <ContactItem
                  icon={Mail}
                  title="Email"
                  value={company.email}
                  href={`mailto:${company.email}`}
                  note="We'll respond within 24 hours"
                />
                <ContactItem
                  icon={Phone}
                  title="Phone"
                  value={company.phone}
                  href={`tel:${company.phone.replace(/\s/g, '')}`}
                  note={company.businessHours.weekdays}
                />
                <ContactItem
                  icon={MapPin}
                  title="Office Address"
                  value={company.officeAddress}
                />
                <ContactItem
                  icon={Clock}
                  title="Business Hours"
                  value={[
                    company.businessHours.weekdays,
                    company.businessHours.saturday,
                    company.businessHours.sunday,
                  ]}
                />
              </div>
            </div>

            <div className="rounded-2xl border border-gray-100 bg-gray-50/50 p-5">
              <h3 className="font-semibold text-gray-900 mb-3">
                Company Information
              </h3>
              <dl className="space-y-2 text-sm text-gray-600">
                <div>
                  <dt className="font-medium text-gray-700">Legal Name</dt>
                  <dd>{company.legalName}</dd>
                </div>
                <div>
                  <dt className="font-medium text-gray-700">Registration</dt>
                  <dd>{company.registration}</dd>
                </div>
                <div>
                  <dt className="font-medium text-gray-700">Registered Address</dt>
                  <dd>{company.registeredAddress}</dd>
                </div>
              </dl>
            </div>
          </div>
        </div>

        <div className="mt-20">
          <h2 className="text-2xl font-bold text-gray-900 text-center mb-10">
            Frequently Asked Questions
          </h2>
          <div className="grid sm:grid-cols-2 gap-5 max-w-4xl mx-auto">
            {faqs.map((faq) => (
              <div
                key={faq.question}
                className="rounded-2xl border border-gray-100 bg-white p-5"
              >
                <h3 className="font-semibold text-gray-900">{faq.question}</h3>
                <p className="mt-2 text-sm text-gray-600 leading-relaxed">
                  {faq.answer}
                </p>
              </div>
            ))}
          </div>
        </div>
      </div>

      <Footer />
    </>
  );
}

function ContactItem({
  icon: Icon,
  title,
  value,
  href,
  note,
}: {
  icon: React.ComponentType<{ className?: string }>;
  title: string;
  value: string | string[];
  href?: string;
  note?: string;
}) {
  const content = Array.isArray(value) ? (
    <div className="space-y-0.5">
      {value.map((line) => (
        <p key={line}>{line}</p>
      ))}
    </div>
  ) : href ? (
    <a href={href} className="hover:text-violet-600 transition-colors">
      {value}
    </a>
  ) : (
    <p>{value}</p>
  );

  return (
    <div className="flex gap-3">
      <div className="w-10 h-10 rounded-xl bg-violet-100 flex items-center justify-center shrink-0">
        <Icon className="w-5 h-5 text-violet-600" />
      </div>
      <div>
        <p className="font-medium text-gray-900">{title}</p>
        <div className="mt-0.5 text-sm text-gray-600">{content}</div>
        {note && <p className="mt-1 text-xs text-gray-400">{note}</p>}
      </div>
    </div>
  );
}
