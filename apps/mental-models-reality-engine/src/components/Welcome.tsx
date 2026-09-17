import { motion } from 'motion/react';
import { Layers, TrendingUp, Target, ArrowRight } from 'lucide-react';

interface WelcomeProps {
  onStart: () => void;
  key?: string;
}

const modelCards = [
  {
    icon: Layers,
    title: 'Assumption Stacks',
    line: 'Certainty, stacked, quantified.',
  },
  {
    icon: TrendingUp,
    title: 'Compound Effect',
    line: 'Non-linearity, felt in real time.',
  },
  {
    icon: Target,
    title: 'Pareto Gravity',
    line: 'Unequal distribution, made visible.',
  },
] as const;

export function Welcome({ onStart }: WelcomeProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      className="flex flex-col items-center justify-center h-full max-w-3xl mx-auto text-center gap-8 py-12 lg:py-20"
    >
      <div className="w-16 h-16 rounded-2xl bg-teal-500/10 flex items-center justify-center border border-teal-500/20 mb-2">
        <span className="text-teal-400 font-bold text-4xl">∑</span>
      </div>

      <h1 className="text-4xl md:text-5xl font-light text-zinc-100 tracking-tight leading-snug">
        <span className="block">What feels true.</span>
        <span className="block text-teal-400 font-medium">What&apos;s actually true.</span>
        <span className="block text-zinc-400 mt-1">Rarely the same.</span>
      </h1>

      <p className="text-lg md:text-xl text-zinc-400 leading-relaxed max-w-2xl">
        Three mental models. First principles, compounding, the 80/20 rule. Simulated so you feel the gap
        instead of reading about it. Drag a slider. Flip intuition against statistical reality. Watch them
        diverge. That&apos;s the rewiring.
      </p>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 w-full text-left">
        {modelCards.map((card) => {
          const Icon = card.icon;
          return (
            <div
              key={card.title}
              className="bg-zinc-900/50 border border-zinc-800/50 p-6 rounded-3xl flex flex-col items-center text-center"
            >
              <Icon className="w-8 h-8 text-zinc-500 mb-3" />
              <h3 className="font-medium text-zinc-200 mb-2">{card.title}</h3>
              <p className="text-sm text-zinc-500 leading-relaxed">{card.line}</p>
            </div>
          );
        })}
      </div>

      <button
        type="button"
        onClick={onStart}
        className="mt-2 flex items-center gap-3 bg-teal-600 hover:bg-teal-500 text-white px-8 py-4 rounded-2xl font-medium transition-all hover:scale-105 active:scale-95 border border-teal-500/30"
      >
        Start the Simulation
        <ArrowRight className="w-5 h-5" />
      </button>
    </motion.div>
  );
}
