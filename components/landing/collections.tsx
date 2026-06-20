import { Briefcase, Plane, ShoppingBag, UtensilsCrossed } from 'lucide-react';

const collections = [
  {
    name: 'Recipes',
    icon: UtensilsCrossed,
    color: 'from-orange-400 to-amber-400',
    bg: 'bg-orange-50',
    emoji: ['🍝', '🥗', '🍰', '🍳', '🥑', '🍕'],
  },
  {
    name: 'Business ideas',
    icon: Briefcase,
    color: 'from-violet-400 to-purple-500',
    bg: 'bg-violet-50',
    emoji: ['📈', '💡', '🚀', '📊', '💰', '🎯'],
  },
  {
    name: 'Travel',
    icon: Plane,
    color: 'from-blue-400 to-cyan-400',
    bg: 'bg-blue-50',
    emoji: ['🏔️', '🏖️', '✈️', '🗼', '🌅', '🏝️'],
  },
  {
    name: 'Shopping',
    icon: ShoppingBag,
    color: 'from-pink-400 to-rose-400',
    bg: 'bg-pink-50',
    emoji: ['👗', '👟', '👜', '💄', '🛍️', '✨'],
  },
];

export function Collections() {
  return (
    <section className="py-12 lg:py-16 bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-2xl mx-auto mb-8">
          <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 tracking-tight">
            Your saved posts are where good ideas go to disappear.
          </h2>
          <p className="mt-4 text-lg text-gray-600">
            You save recipes, founder advice, travel ideas, tutorials, and
            inspiration — but when you need them, they&apos;re impossible to
            find.
          </p>
        </div>

        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-5">
          {collections.map((collection) => (
            <div
              key={collection.name}
              className="rounded-3xl bg-white border border-gray-100 shadow-sm hover:shadow-md transition-shadow p-5"
            >
              <div className="flex items-center gap-2.5 mb-4">
                <div
                  className={`w-9 h-9 rounded-xl bg-gradient-to-br ${collection.color} flex items-center justify-center`}
                >
                  <collection.icon className="w-4.5 h-4.5 text-white" />
                </div>
                <span className="font-semibold text-gray-900">
                  {collection.name}
                </span>
              </div>
              <div className="grid grid-cols-3 gap-2">
                {collection.emoji.map((emoji, i) => (
                  <div
                    key={i}
                    className={`aspect-square rounded-xl ${collection.bg} flex items-center justify-center text-xl`}
                  >
                    {emoji}
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
