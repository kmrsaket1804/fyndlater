import Image from 'next/image';
import { Play, Shield } from 'lucide-react';
import { GradientButton } from './gradient-button';

export function Hero() {
  return (
    <section className="relative overflow-hidden pt-10 pb-12 lg:pt-12 lg:pb-16">
      <div className="absolute inset-0 -z-10 bg-gradient-to-b from-violet-50/60 via-white to-white" />
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="lg:grid lg:grid-cols-2 lg:gap-12 lg:items-center">
          <div className="max-w-xl">
            <div className="inline-flex items-center gap-1.5 rounded-full bg-violet-100 px-4 py-1.5 text-sm font-medium text-violet-700 mb-6">
              ✨ Meet Faye ✨
            </div>
            <h1 className="text-4xl sm:text-5xl lg:text-[3.25rem] font-bold tracking-tight text-gray-900 leading-[1.1]">
              Your AI memory for everything you save.
            </h1>
            <p className="mt-5 text-lg text-gray-600 leading-relaxed">
              Send Faye reels, posts, screenshots, links, and ideas. She
              organizes them automatically so you can find them later by simply
              asking.
            </p>
            <div className="mt-8 flex flex-col sm:flex-row items-start sm:items-center gap-4">
              <GradientButton href="/login?mode=signup" size="lg">
                Start saving with Faye
              </GradientButton>
              <a
                href="#how-it-works"
                className="inline-flex items-center gap-2 text-sm font-medium text-violet-600 hover:text-violet-700 transition-colors"
              >
                <span className="flex items-center justify-center w-8 h-8 rounded-full bg-violet-100">
                  <Play className="w-3.5 h-3.5 fill-violet-600 text-violet-600 ml-0.5" />
                </span>
                See how it works
              </a>
            </div>
            <div className="mt-8 flex items-center gap-2 text-sm text-gray-500">
              <Shield className="w-4 h-4 text-violet-400 shrink-0" />
              <span>
                No folders. No scrolling. No &ldquo;where did I save that?&rdquo;
                again.
              </span>
            </div>
          </div>

          <div className="mt-10 lg:mt-0 relative">
            <div className="relative mx-auto max-w-md lg:max-w-none">
              <PhoneMockup />
              <RetrievalCard />
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

function PhoneMockup() {
  return (
    <div className="relative mx-auto w-[280px] sm:w-[300px]">
      <div className="rounded-[2.5rem] border-[6px] border-gray-900 bg-gray-900 shadow-2xl shadow-violet-200/40 overflow-hidden">
        <div className="bg-white">
          <div className="flex items-center justify-between px-5 py-3 border-b border-gray-100">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-full bg-gradient-to-br from-violet-400 to-pink-400 flex items-center justify-center text-white text-xs font-bold">
                F
              </div>
              <span className="text-sm font-semibold text-gray-900">Faye</span>
            </div>
            <div className="text-xs text-gray-400">Instagram</div>
          </div>
          <div className="p-4 space-y-3 min-h-[340px] bg-gray-50">
            <div className="flex justify-end">
              <div className="max-w-[75%] rounded-2xl rounded-br-sm bg-violet-500 text-white px-3.5 py-2.5 text-sm">
                Save this reel 🎬
              </div>
            </div>
            <div className="flex justify-start">
              <div className="max-w-[85%] rounded-2xl rounded-bl-sm bg-white border border-gray-100 shadow-sm px-3.5 py-2.5 text-sm text-gray-700">
                <p className="font-medium text-gray-900">Saved ✨</p>
                <p className="mt-1 text-xs text-gray-500 leading-relaxed">
                  Business Ideas → D2C Marketing → Packaging Inspiration
                </p>
              </div>
            </div>
            <div className="flex justify-end">
              <div className="rounded-2xl overflow-hidden border border-gray-200 shadow-sm w-[70%]">
                <div className="h-24 bg-gradient-to-br from-amber-100 via-orange-50 to-rose-100 flex items-center justify-center">
                  <span className="text-2xl">📦</span>
                </div>
                <div className="px-2.5 py-2 bg-white">
                  <p className="text-xs font-medium text-gray-800 truncate">
                    Premium D2C Packaging Ideas
                  </p>
                </div>
              </div>
            </div>
            <div className="flex justify-start">
              <div className="max-w-[85%] rounded-2xl rounded-bl-sm bg-white border border-gray-100 shadow-sm px-3.5 py-2.5 text-sm text-gray-600">
                Got it! I&apos;ll remember this for when you need packaging
                inspo later 💜
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function RetrievalCard() {
  return (
    <div className="absolute -right-2 sm:right-0 top-8 sm:top-12 w-[220px] sm:w-[240px] rounded-2xl bg-white border border-gray-100 shadow-xl shadow-violet-100/50 p-3.5 hidden sm:block">
      <p className="text-[10px] font-semibold uppercase tracking-wider text-violet-500 mb-2">
        Retrieved for you
      </p>
      <div className="rounded-xl overflow-hidden border border-gray-100">
        <div className="h-28 bg-gradient-to-br from-amber-50 via-orange-50 to-rose-100 relative">
          <Image
            src="/assets/hero-mockup.png"
            alt="Packaging inspiration"
            fill
            className="object-cover object-right-top opacity-30"
          />
          <div className="absolute inset-0 flex items-center justify-center">
            <span className="text-3xl">📦</span>
          </div>
        </div>
        <div className="p-2.5">
          <p className="text-xs font-semibold text-gray-900">
            Premium D2C Packaging Ideas
          </p>
          <div className="flex flex-wrap gap-1 mt-1.5">
            {['packaging', 'D2C', 'marketing'].map((tag) => (
              <span
                key={tag}
                className="text-[10px] px-1.5 py-0.5 rounded-full bg-violet-50 text-violet-600"
              >
                {tag}
              </span>
            ))}
          </div>
          <p className="text-[10px] text-gray-500 mt-1.5 leading-relaxed">
            Saved 3 days ago · Packaging reel with premium unboxing ideas
          </p>
        </div>
      </div>
    </div>
  );
}
