import {
  Camera,
  FolderOpen,
  Instagram,
  Link2,
  MessageCircle,
  Search,
  Send,
} from 'lucide-react';

const steps = [
  {
    title: 'Send it to Faye',
    description: 'Share anything worth remembering.',
    visual: <SendVisual />,
  },
  {
    title: 'Faye organizes it',
    description: 'Titles, tags, summaries, and collections — automatically.',
    visual: <OrganizeVisual />,
  },
  {
    title: 'Ask for it later',
    description: 'Search naturally and get the exact thing back.',
    visual: <RetrieveVisual />,
  },
];

export function HowItWorks() {
  return (
    <section id="how-it-works" className="py-20 lg:py-28 bg-gray-50/80">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-2xl mx-auto mb-14">
          <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 tracking-tight">
            How it works
          </h2>
          <p className="mt-4 text-lg text-gray-600">
            Three simple steps from save to find — no folders required.
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-8">
          {steps.map((step, i) => (
            <div key={step.title} className="text-center">
              <div className="mb-5">{step.visual}</div>
              <div className="inline-flex items-center justify-center w-7 h-7 rounded-full bg-violet-100 text-violet-600 text-sm font-bold mb-3">
                {i + 1}
              </div>
              <h3 className="text-lg font-semibold text-gray-900">
                {step.title}
              </h3>
              <p className="mt-2 text-sm text-gray-600">{step.description}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function SendVisual() {
  return (
    <div className="mx-auto w-full max-w-[220px] h-40 rounded-3xl bg-white border border-gray-100 shadow-sm flex flex-col items-center justify-center gap-3 p-4">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-pink-500 to-purple-600 flex items-center justify-center">
          <Instagram className="w-5 h-5 text-white" />
        </div>
        <div className="w-10 h-10 rounded-xl bg-blue-50 flex items-center justify-center">
          <Link2 className="w-5 h-5 text-blue-500" />
        </div>
        <div className="w-10 h-10 rounded-xl bg-violet-50 flex items-center justify-center">
          <Camera className="w-5 h-5 text-violet-500" />
        </div>
      </div>
      <div className="w-12 h-12 rounded-full bg-gradient-to-r from-violet-500 to-pink-500 flex items-center justify-center shadow-md">
        <Send className="w-5 h-5 text-white" />
      </div>
      <p className="text-xs text-gray-400">Reels · Links · Screenshots</p>
    </div>
  );
}

function OrganizeVisual() {
  return (
    <div className="mx-auto w-full max-w-[220px] h-40 rounded-3xl bg-white border border-gray-100 shadow-sm flex flex-col items-center justify-center p-4 relative">
      <FolderOpen className="w-10 h-10 text-violet-500 mb-2" />
      <p className="text-sm font-semibold text-gray-900">D2C Marketing</p>
      <div className="flex flex-wrap gap-1.5 mt-2 justify-center">
        {['marketing', 'packaging', 'ideas'].map((tag) => (
          <span
            key={tag}
            className="text-[10px] px-2 py-0.5 rounded-full bg-violet-50 text-violet-600 border border-violet-100"
          >
            {tag}
          </span>
        ))}
      </div>
    </div>
  );
}

function RetrieveVisual() {
  return (
    <div className="mx-auto w-full max-w-[220px] rounded-3xl bg-white border border-gray-100 shadow-sm p-4">
      <div className="flex items-center gap-2 rounded-full bg-gray-50 border border-gray-100 px-3 py-2">
        <Search className="w-3.5 h-3.5 text-gray-400" />
        <span className="text-[11px] text-gray-500 truncate">
          Find that packaging reel I saved
        </span>
      </div>
      <div className="mt-3 rounded-xl border border-violet-100 bg-violet-50/50 p-2 flex items-center gap-2">
        <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-amber-100 to-rose-100 flex items-center justify-center text-lg shrink-0">
          📦
        </div>
        <div className="text-left min-w-0">
          <p className="text-[11px] font-medium text-gray-900 truncate">
            Premium D2C Packaging
          </p>
          <p className="text-[10px] text-violet-500">Found in 0.3s</p>
        </div>
      </div>
      <MessageCircle className="w-4 h-4 text-violet-300 mx-auto mt-2" />
    </div>
  );
}
