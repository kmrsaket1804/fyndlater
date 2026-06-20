import Image from 'next/image';
import { Instagram } from 'lucide-react';
import { fayeInstagramUrl } from '@/lib/config';

export function FinalCTA() {
  return (
    <section className="py-12 lg:py-16">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="relative overflow-hidden rounded-[1.75rem] bg-gradient-to-r from-violet-100 via-purple-50/80 to-pink-50 border border-violet-100/50">
          <div className="relative flex flex-col items-center gap-8 px-6 py-10 sm:px-10 sm:py-12 md:flex-row md:items-end md:justify-between md:gap-4 md:px-8 md:py-0 md:min-h-[240px] lg:min-h-[260px]">
            <div className="order-2 md:order-1 shrink-0 md:w-[30%] md:self-end">
              <Image
                src="/assets/box-magic.png"
                alt="Reels, links, and screenshots organized by Faye"
                width={340}
                height={300}
                className="mx-auto h-auto w-44 object-contain object-bottom sm:w-52 md:mx-0 md:w-full md:max-w-[300px]"
              />
            </div>

            <div className="order-1 md:order-2 z-10 flex-1 text-center md:pb-10 md:pt-12">
              <h2 className="text-2xl sm:text-3xl lg:text-[2rem] font-bold text-gray-900 tracking-tight leading-tight">
                Ready to Fynd everything you save?
              </h2>
              <p className="mt-2 text-base sm:text-lg text-gray-600">
                Chat with Faye on Instagram
              </p>
              <a
                href={fayeInstagramUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="mt-6 inline-flex items-center justify-center gap-2.5 rounded-full bg-gradient-to-r from-violet-500 to-pink-500 px-7 py-3.5 text-base font-semibold text-white shadow-md shadow-violet-200/50 transition-all hover:from-violet-600 hover:to-pink-600 hover:shadow-lg hover:shadow-violet-200/60"
              >
                <Instagram className="h-5 w-5 shrink-0" />
                Send it to Faye
              </a>
            </div>

            <div className="order-3 shrink-0 md:w-[24%] md:self-end">
              <Image
                src="/assets/faye-avatar.png"
                alt="Faye waving hello"
                width={280}
                height={340}
                className="mx-auto h-auto w-36 object-contain object-bottom sm:w-44 md:mx-0 md:ml-auto md:w-full md:max-w-[240px]"
              />
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
