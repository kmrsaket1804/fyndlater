import Image from 'next/image';

const features = [
  {
    title: 'Save anything',
    description: 'Reels, posts, links, screenshots, notes & more.',
    image: '/assets/send-to-faye.png',
    alt: 'Save reels, links, screenshots, and notes to Faye',
  },
  {
    title: 'Faye understands',
    description: 'AI that reads, summarizes and tags for you.',
    image: '/assets/faye-understands.png',
    alt: 'Faye reads your saves and adds tags and summaries',
  },
  {
    title: 'Smart organization',
    description: 'Automatically sorted into collections that make sense.',
    image: '/assets/smart-organisation.png',
    alt: 'Saves organized into smart collections automatically',
  },
  {
    title: 'Find instantly',
    description: 'Ask naturally. Get exactly what you saved.',
    image: '/assets/find-instantly.png',
    alt: 'Ask Faye and find your saved content instantly',
  },
];

export function Features() {
  return (
    <section className="py-20 lg:py-28 bg-gray-50/80">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <p className="text-xs font-semibold uppercase tracking-widest text-gray-400 mb-10">
          Feature illustrations
        </p>

        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-5 lg:gap-6">
          {features.map((feature) => (
            <article
              key={feature.title}
              className="flex flex-col rounded-2xl border border-gray-100 bg-white p-4 shadow-sm sm:p-5"
            >
              <div className="mb-5 flex aspect-square items-center justify-center overflow-hidden rounded-xl bg-white">
                <Image
                  src={feature.image}
                  alt={feature.alt}
                  width={600}
                  height={600}
                  className="h-full w-full object-contain"
                />
              </div>

              <div className="mt-auto text-center">
                <h3 className="text-base font-bold text-gray-900 sm:text-lg">
                  {feature.title}
                </h3>
                <p className="mt-2 text-sm text-gray-600 leading-relaxed">
                  {feature.description}
                </p>
              </div>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
