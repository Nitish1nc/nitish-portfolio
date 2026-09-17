import { motion } from 'motion/react';
import { Layers, TrendingUp, Target, Sparkles, ArrowRight, ExternalLink, RotateCcw } from 'lucide-react';

interface TakeawayProps {
  onReplayModel: (model: 'assumption' | 'compound' | 'pareto') => void;
  key?: string;
}

const modelTakeaways = [
  {
    num: '01',
    icon: Layers,
    title: 'Assumption Stacks',
    felt: 'Five steps at 90% each does not feel like a 59% plan. It feels like a sure thing.',
    line: 'Trust the product of probabilities, not the vibe of each step.',
    accent: 'text-teal-400',
    border: 'border-teal-500/20',
    bg: 'bg-teal-500/5',
  },
  {
    num: '02',
    icon: TrendingUp,
    title: 'Compound Effect',
    felt: 'Early days look flat. Your gut calls it "not working." The curve was just warming up.',
    line: 'Trust the exponent over the early flat stretch.',
    accent: 'text-emerald-400',
    border: 'border-emerald-500/20',
    bg: 'bg-emerald-500/5',
  },
  {
    num: '03',
    icon: Target,
    title: 'Pareto Gravity',
    felt: 'Finishing everything feels responsible. Most of the yield was already in the first slice.',
    line: 'Trust the power law, not the checklist completion bar.',
    accent: 'text-amber-400',
    border: 'border-amber-500/20',
    bg: 'bg-amber-500/5',
  },
] as const;

const LIBRARY_URL =
  'https://library.nitishchauhan.com/How-systems-grow-when-nobody-is-watching/Final---Mental-Models-Visceral-Math';

export function Takeaway({ onReplayModel }: TakeawayProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      className="flex flex-col gap-10 py-4 md:py-8"
    >
      <div className="text-center max-w-2xl mx-auto">
        <p className="text-xs font-mono uppercase tracking-wider text-teal-400 mb-3">04 · Takeaway</p>
        <div className="w-14 h-14 rounded-2xl bg-teal-500/10 flex items-center justify-center border border-teal-500/20 mx-auto mb-5">
          <Sparkles className="w-7 h-7 text-teal-400" />
        </div>
        <h2 className="text-3xl md:text-4xl font-light text-zinc-100 tracking-tight leading-tight">
          You felt the gap. <span className="text-teal-400 font-medium">That is the point.</span>
        </h2>
        <p className="text-zinc-400 mt-4 leading-relaxed">
          Three models, same story: your intuition is a fast storyteller. Basic math is slower, but it
          keeps score honestly. Here is what each sim was really showing you.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        {modelTakeaways.map((m) => {
          const Icon = m.icon;
          return (
            <div
              key={m.num}
              className={`rounded-3xl border ${m.border} ${m.bg} p-6 flex flex-col gap-4`}
            >
              <div className="flex items-center gap-3">
                <span className={`text-xs font-mono ${m.accent}`}>{m.num}</span>
                <Icon className="w-5 h-5 text-zinc-500" />
              </div>
              <h3 className="font-medium text-zinc-100">{m.title}</h3>
              <p className="text-sm text-zinc-400 leading-relaxed flex-1">{m.felt}</p>
              <p className={`text-sm font-medium ${m.accent} leading-snug`}>{m.line}</p>
            </div>
          );
        })}
      </div>

      <div className="rounded-3xl border border-zinc-800/80 bg-zinc-900/40 p-6 md:p-8 max-w-3xl mx-auto w-full text-center">
        <p className="text-lg text-zinc-200 font-light leading-relaxed">
          The rewiring moment is not memorizing formulas. It is noticing when your gut and the math
          disagree, and having the patience to check which one is right.
        </p>
      </div>

      <div className="max-w-3xl mx-auto w-full">
        <p className="text-xs uppercase tracking-[0.14em] text-zinc-500 font-medium mb-4 text-center">
          What to do next
        </p>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <a
            href={LIBRARY_URL}
            target="_blank"
            rel="noreferrer"
            className="group flex items-center gap-3 rounded-2xl border border-zinc-800 bg-zinc-900/50 p-4 hover:border-teal-500/30 hover:bg-zinc-900 transition-all"
          >
            <ExternalLink className="w-5 h-5 text-teal-500 shrink-0" />
            <div className="text-left min-w-0">
              <p className="text-sm font-medium text-zinc-200 group-hover:text-teal-400 transition-colors">
                Read the write-up
              </p>
              <p className="text-xs text-zinc-500 truncate">Mental Models Visceral Math</p>
            </div>
          </a>

          <button
            type="button"
            onClick={() => onReplayModel('assumption')}
            className="group flex items-center gap-3 rounded-2xl border border-zinc-800 bg-zinc-900/50 p-4 hover:border-zinc-600 hover:bg-zinc-900 transition-all text-left"
          >
            <RotateCcw className="w-5 h-5 text-zinc-500 group-hover:text-zinc-300 shrink-0 transition-colors" />
            <div>
              <p className="text-sm font-medium text-zinc-200">Replay a model</p>
              <p className="text-xs text-zinc-500">Start back at 01</p>
            </div>
          </button>

          <a
            href="/"
            className="group flex items-center gap-3 rounded-2xl border border-zinc-800 bg-zinc-900/50 p-4 hover:border-zinc-600 hover:bg-zinc-900 transition-all"
          >
            <ArrowRight className="w-5 h-5 text-zinc-500 group-hover:text-zinc-300 shrink-0 transition-colors" />
            <div className="text-left">
              <p className="text-sm font-medium text-zinc-200">NitishLabs home</p>
              <p className="text-xs text-zinc-500">More experiments</p>
            </div>
          </a>
        </div>
      </div>
    </motion.div>
  );
}
