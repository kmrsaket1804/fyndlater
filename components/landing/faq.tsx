'use client';

import { useState } from 'react';
import { ChevronDown } from 'lucide-react';
import { cn } from '@/lib/utils';

const faqs = [
  {
    question: 'What can I send to Faye?',
    answer:
      'Instagram reels, posts, screenshots, links, screen recordings, and quick text notes. If it\'s worth remembering, Faye can save it.',
  },
  {
    question: 'How does Faye organize my saves?',
    answer:
      'Faye automatically understands your content, writes a summary, adds relevant tags, and places it in smart collections like recipes, business ideas, travel, or shopping — no manual filing needed.',
  },
  {
    question: 'How do I find things later?',
    answer:
      'Just message Faye in natural language. Ask things like "Find that packaging reel" or "Show me recipes I saved last week" and she\'ll retrieve exactly what you need.',
  },
  {
    question: 'Is FyndLater just a bookmark manager?',
    answer:
      'No — it\'s a personal AI retrieval layer for social content. Instead of scrolling through saved folders, you simply ask Faye and she finds it for you.',
  },
  {
    question: 'Do I need the FyndLater app too?',
    answer:
      'Faye lives on Instagram for saving and finding. The FyndLater web app is where you sign up, manage your account, view your collections, and subscribe.',
  },
];

export function FAQ() {
  const [openIndex, setOpenIndex] = useState<number | null>(0);

  return (
    <section id="faq" className="py-12 lg:py-16 bg-white">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-8">
          <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 tracking-tight">
            Frequently asked questions
          </h2>
        </div>

        <div className="space-y-3">
          {faqs.map((faq, i) => (
            <div
              key={faq.question}
              className="rounded-2xl border border-gray-100 bg-white overflow-hidden"
            >
              <button
                type="button"
                onClick={() => setOpenIndex(openIndex === i ? null : i)}
                className="w-full flex items-center justify-between px-5 py-4 text-left hover:bg-gray-50/50 transition-colors"
              >
                <span className="font-medium text-gray-900 pr-4">
                  {faq.question}
                </span>
                <ChevronDown
                  className={cn(
                    'w-5 h-5 text-gray-400 shrink-0 transition-transform',
                    openIndex === i && 'rotate-180'
                  )}
                />
              </button>
              {openIndex === i && (
                <div className="px-5 pb-4 text-sm text-gray-600 leading-relaxed">
                  {faq.answer}
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
