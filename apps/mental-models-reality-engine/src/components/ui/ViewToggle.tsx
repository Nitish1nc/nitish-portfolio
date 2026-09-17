import { motion } from 'motion/react';

interface ViewToggleProps {
  mode: 'intuition' | 'reality';
  onChange: (mode: 'intuition' | 'reality') => void;
}

export function ViewToggle({ mode, onChange }: ViewToggleProps) {
  const baseBtn =
    'relative z-10 px-4 sm:px-5 py-2.5 text-sm font-medium rounded-lg transition-all border min-w-[7.5rem] sm:min-w-0';
  const inactiveBtn =
    'border-zinc-600 bg-zinc-800/90 text-zinc-200 hover:border-zinc-500 hover:bg-zinc-700 hover:text-zinc-50';
  const activeIntuitionBtn = 'border-zinc-400 bg-zinc-700 text-white shadow-sm';
  const activeRealityBtn = 'border-teal-500/70 bg-teal-950/50 text-teal-200 shadow-sm shadow-teal-900/30';

  return (
    <div className="flex flex-col items-stretch md:items-end gap-2 w-full md:w-auto">
      <p className="text-xs text-zinc-400 md:text-right max-w-sm leading-relaxed">
        Flip the lens: gut feeling on the left, actual math on the right.
      </p>
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 bg-zinc-900/95 p-3 rounded-2xl border border-zinc-700 w-full md:w-auto">
        <span className="text-xs font-mono text-zinc-400 uppercase tracking-wider px-1 shrink-0">
          Lens
        </span>
        <div className="flex gap-2 flex-1">
          <button
            type="button"
            onClick={() => onChange('intuition')}
            className={`${baseBtn} flex-1 sm:flex-none ${
              mode === 'intuition' ? activeIntuitionBtn : inactiveBtn
            }`}
          >
            Intuition
          </button>
          <button
            type="button"
            onClick={() => onChange('reality')}
            className={`${baseBtn} flex-1 sm:flex-none ${
              mode === 'reality' ? activeRealityBtn : inactiveBtn
            }`}
          >
            Statistical Reality
          </button>
        </div>
      </div>
      <motion.p
        key={mode}
        initial={{ opacity: 0, y: 4 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-xs text-zinc-500 md:text-right pr-1"
      >
        {mode === 'intuition'
          ? 'This is what it feels like. Tap Statistical Reality to see the numbers.'
          : 'This is what the math says. Tap Intuition to compare.'}
      </motion.p>
    </div>
  );
}
