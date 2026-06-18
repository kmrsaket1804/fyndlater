import { GradientButton } from './gradient-button';

export function FinalCTA() {
  return (
    <section className="py-20 lg:py-28">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="relative rounded-[2rem] overflow-hidden bg-gradient-to-r from-violet-100 via-purple-50 to-pink-100 border border-violet-100/50">
          <div className="grid lg:grid-cols-2 items-center gap-8 p-8 sm:p-12 lg:p-16">
            <div className="flex justify-center lg:justify-start">
              <FayeCharacter />
            </div>
            <div className="text-center lg:text-left">
              <h2 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-gray-900 tracking-tight leading-tight">
                Stop losing the things you saved.
              </h2>
              <p className="mt-3 text-lg text-gray-600">
                Send it to Faye.{' '}
                <span className="font-semibold bg-gradient-to-r from-violet-600 to-pink-600 bg-clip-text text-transparent">
                  Fynd it later.
                </span>
              </p>
              <div className="mt-8">
                <GradientButton href="/sign-up" size="lg">
                  Get started
                </GradientButton>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

function FayeCharacter() {
  return (
    <div className="relative w-48 h-48 sm:w-56 sm:h-56">
      <div className="absolute inset-0 rounded-full bg-gradient-to-br from-violet-200/40 to-pink-200/40 blur-2xl" />
      <div className="relative w-full h-full flex items-end justify-center">
        <div className="relative">
          <div className="w-32 h-32 sm:w-36 sm:h-36 rounded-full bg-gradient-to-br from-amber-100 to-orange-100 border-4 border-white shadow-lg flex items-center justify-center overflow-hidden">
            <div className="text-center">
              <div className="text-5xl sm:text-6xl">👩</div>
            </div>
          </div>
          <div className="absolute -bottom-2 left-1/2 -translate-x-1/2 w-28 sm:w-32 h-16 sm:h-20 rounded-t-3xl bg-gradient-to-b from-violet-500 to-violet-600 shadow-md" />
          <div className="absolute -top-1 left-1/2 -translate-x-1/2 w-24 h-12 bg-amber-800/80 rounded-full" />
        </div>
      </div>
    </div>
  );
}
