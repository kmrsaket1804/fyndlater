import {
  BookOpen,
  Lightbulb,
  ShoppingBag,
  Smartphone,
  TrendingUp,
} from 'lucide-react';

const useCases = [
  {
    title: 'Creators',
    description: 'hooks, captions, trends',
    icon: Smartphone,
    gradient: 'from-pink-400 to-rose-500',
    visual: '📱',
  },
  {
    title: 'Founders',
    description: 'ideas, competitors, growth tactics',
    icon: TrendingUp,
    gradient: 'from-violet-400 to-purple-500',
    visual: '📈',
  },
  {
    title: 'Everyday life',
    description: 'recipes, outfits, travel, shopping',
    icon: ShoppingBag,
    gradient: 'from-blue-400 to-cyan-400',
    visual: '🧳',
  },
  {
    title: 'Learners',
    description: 'threads, explainers, frameworks',
    icon: BookOpen,
    gradient: 'from-amber-400 to-orange-400',
    visual: '📚',
  },
];

export function UseCases() {
  return (
    <section id="use-cases" className="py-20 lg:py-28 bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-2xl mx-auto mb-14">
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
              className="group rounded-3xl bg-white border border-gray-100 shadow-sm hover:shadow-md transition-all p-6 flex gap-5"
            >
              <div
                className={`w-14 h-14 rounded-2xl bg-gradient-to-br ${useCase.gradient} flex items-center justify-center shrink-0 shadow-sm`}
              >
                <useCase.icon className="w-6 h-6 text-white" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-gray-900">
                  {useCase.title}
                </h3>
                <p className="mt-1 text-sm text-gray-500">
                  {useCase.description}
                </p>
                <div className="mt-3 text-2xl">{useCase.visual}</div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
