import Link from 'next/link';
import { Logo } from './logo';
import { company } from '@/lib/company';

const legalLinks = [
  { href: '/privacy', label: 'Privacy Policy' },
  { href: '/terms', label: 'Terms & Conditions' },
  { href: '/refunds', label: 'Refunds & Cancellations' },
  { href: '/services', label: 'Products & Services' },
  { href: '/contact', label: 'Contact Us' },
];

export function Footer() {
  return (
    <footer className="border-t border-gray-100 bg-white py-10">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col lg:flex-row items-start justify-between gap-8">
          <div>
            <Logo />
            <p className="mt-2 text-xs text-gray-400 max-w-xs">
              Send it to Faye. Fynd it later. Built by {company.legalName}.
            </p>
            <p className="mt-2 text-xs text-gray-400">
              {company.email} · {company.phone}
            </p>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-x-8 gap-y-3 text-sm">
            {legalLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className="text-gray-500 hover:text-gray-900 transition-colors"
              >
                {link.label}
              </Link>
            ))}
            <Link
              href="/pricing"
              className="text-gray-500 hover:text-gray-900 transition-colors"
            >
              Pricing (INR)
            </Link>
          </div>
        </div>
        <p className="mt-8 text-center text-xs text-gray-400">
          © {new Date().getFullYear()} {company.legalName}. All rights reserved.
          · Prices in Indian Rupees (INR)
        </p>
      </div>
    </footer>
  );
}
