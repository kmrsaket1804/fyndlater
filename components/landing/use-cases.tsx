import Image from 'next/image';
import {
  Briefcase,
  ChefHat,
  Plane,
  ShoppingBag,
} from 'lucide-react';

const useCases = [
  {
    title: 'Recipes',
    quote: 'Show me the pasta recipes I saved last week',
    icon: ChefHat,
    gradient: 'from-pink-400 to-rose-500',
  },
  {
    title: 'Business',
    quote: 'Find that reel about premium packaging',
    icon: Briefcase,
    gradient: 'from-violet-400 to-purple-600',
  },
  {
    title: 'Travel',
    quote: 'What did I save for my Japan trip?',
    icon: Plane,
    gradient: 'from-sky-400 to-blue-500',
  },
  {
    title: 'Shopping',
    quote: 'Show me the Costco finds I saved',
    icon: ShoppingBag,
    gradient: 'from-amber-400 to-orange-500',
  },
];

export function UseCases() {
  return (
    <section id="use-cases" className="py-12 lg:py-16 bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-2xl mx-auto mb-8">
          <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 tracking-tight">
            Save anything worth coming back to.
          </h2>
          <p className="mt-4 text-lg text-gray-600">
            Whether you&apos;re building a brand or planning dinner, Faye keeps
            track so you don&apos;t have to.
          </p>
        </div>

        <div className="grid sm:grid-cols-2 gap-5 max-w-4xl mx-auto">
          {useCases.map((useCase) => (
            <div
              key={useCase.title}
              className="flex gap-5 rounded-2xl border border-gray-100 bg-white p-5 sm:p-6 shadow-sm"
            >
              <div
                className={`flex h-[72px] w-[72px] shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br ${useCase.gradient} shadow-sm`}
              >
                <useCase.icon className="h-8 w-8 text-white" strokeWidth={1.75} />
              </div>

              <div className="min-w-0 flex-1">
                <h3 className="text-lg font-bold text-gray-900">
                  {useCase.title}
                </h3>
                <p className="mt-1.5 text-sm text-gray-600 leading-relaxed">
                  &ldquo;{useCase.quote}&rdquo;
                </p>
                <div className="mt-3 overflow-hidden rounded-full h-9 w-9 border-2 border-white shadow-sm">
                  <Image
                    src="/assets/faye-avatar.png"
                    alt=""
                    width={36}
                    height={36}
                    className="h-full w-full object-cover object-top scale-150"
                  />
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
