import Image from 'next/image';
import { ChevronRight } from 'lucide-react';

const steps = [
  {
    number: 1,
    title: 'Send to Faye',
    description: 'Share anything on Instagram, Faye receives it.',
    image: '/assets/send-to-faye.png',
    alt: 'Send reels, links, and screenshots to Faye on Instagram',
  },
  {
    number: 2,
    title: 'Faye does the work',
    description: 'She understands, summarizes, tags & organizes.',
    image: '/assets/faye-does-the-work.png',
    alt: 'Faye organizes your saves with tags and summaries',
  },
  {
    number: 3,
    title: 'You find it later',
    description: 'Ask anything. Faye finds it instantly.',
    image: '/assets/find-later.png',
    alt: 'Search your collections and find saved content instantly',
  },
];

export function HowItWorks() {
  return (
    <section id="how-it-works" className="py-20 lg:py-28 bg-gray-50/80">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="max-w-2xl mb-14">
          <p className="text-xs font-semibold uppercase tracking-widest text-gray-400">
            How it works — steps
          </p>
          <h2 className="mt-3 text-3xl sm:text-4xl font-bold text-gray-900 tracking-tight">
            How it works
          </h2>
          <p className="mt-4 text-lg text-gray-600">
            Three simple steps from save to find — no folders required.
          </p>
        </div>

        <div className="flex flex-col items-stretch gap-12 md:flex-row md:items-start md:justify-center md:gap-3 lg:gap-6">
          {steps.map((step, index) => (
            <div key={step.title} className="flex flex-col md:flex-row md:items-start">
              <div className="flex-1 max-w-sm mx-auto md:max-w-none md:mx-0 w-full">
                <div className="rounded-2xl bg-gray-100/80 p-4 sm:p-5">
                  <Image
                    src={step.image}
                    alt={step.alt}
                    width={1254}
                    height={1254}
                    className="h-auto w-full object-contain"
                  />
                </div>

                <div className="mt-5 px-1">
                  <div className="flex h-7 w-7 items-center justify-center rounded-full bg-violet-500 text-sm font-bold text-white">
                    {step.number}
                  </div>
                  <h3 className="mt-3 text-lg font-bold text-gray-900">
                    {step.title}
                  </h3>
                  <p className="mt-1.5 text-sm text-gray-600 leading-relaxed">
                    {step.description}
                  </p>
                </div>
              </div>

              {index < steps.length - 1 && (
                <div
                  className="hidden md:flex shrink-0 items-center self-center px-1 lg:px-3 pt-16"
                  aria-hidden
                >
                  <ChevronRight className="h-6 w-6 text-violet-400 lg:h-7 lg:w-7" />
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
