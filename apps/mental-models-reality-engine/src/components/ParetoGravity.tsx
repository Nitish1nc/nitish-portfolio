import { useState, useMemo } from 'react';
import type { SVGProps } from 'react';
import { motion } from 'motion/react';
import { ViewToggle } from './ui/ViewToggle';
import { SliderGuide } from './ui/SliderGuide';
import { MousePointer2, ArrowRight } from 'lucide-react';

interface ParetoGravityProps {
  onViewTakeaway?: () => void;
}

export function ParetoGravity({ onViewTakeaway }: ParetoGravityProps) {
  const [mode, setMode] = useState<'intuition' | 'reality'>('intuition');
  const [selectedTasks, setSelectedTasks] = useState(20);
  const [hasInteracted, setHasInteracted] = useState(false);

  // Generate 100 tasks with Zipf's Law (Power Law) distribution
  const tasks = useMemo(() => {
    const arr = [];
    let sumReality = 0;
    const s = 1.16; // Power law exponent tailored to approximate 80/20

    for (let i = 1; i <= 100; i++) {
      const val = 1 / Math.pow(i, s);
      arr.push({ id: i, raw: val });
      sumReality += val;
    }

    // Normalize so sum is 100 for percentage
    return arr.map((t, index) => ({
      id: t.id,
      realityValue: (t.raw / sumReality) * 100,
      intuitionValue: 1, // 100 / 100 = 1% each
    }));
  }, []);

  const totalYield = tasks.slice(0, selectedTasks).reduce((acc, t) => {
    return acc + (mode === 'intuition' ? t.intuitionValue : t.realityValue);
  }, 0);

  return (
    <motion.div 
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      className="flex flex-col h-full gap-8"
    >
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6">
        <div>
          <p className="text-xs font-mono uppercase tracking-wider text-amber-400 mb-2">Model 03</p>
          <h2 className="text-3xl font-light text-zinc-100 tracking-tight">03 · Pareto Gravity</h2>
          <p className="text-zinc-400 mt-2 max-w-xl">
            We assume all effort yields equal results. In reality, a tiny fraction of your work produces almost all of your outcomes.
          </p>
        </div>
        <ViewToggle
          mode={mode}
          onChange={(next) => {
            setHasInteracted(true);
            setMode(next);
          }}
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 flex-1">
        {/* Controls */}
        <div className="bg-zinc-900/40 border border-zinc-800/50 rounded-3xl p-6 flex flex-col gap-6">
          <SliderGuide
            step={1}
            title="Drag the slider below"
            hint="How many of the 100 tasks have you finished? The yield % and tile grid update live. Flip the lens to see equal vs power-law output."
          />
          <div className="space-y-4">
            <div className="flex justify-between items-end">
              <label className="text-sm font-medium text-zinc-300">Tasks Completed</label>
              <span className="text-2xl font-mono text-zinc-100">{selectedTasks}/100</span>
            </div>
            <input 
              type="range" 
              min="1" max="100" 
              value={selectedTasks} 
              onChange={(e) => {
                setHasInteracted(true);
                setSelectedTasks(Number(e.target.value));
              }}
              className="w-full h-3 bg-zinc-700 rounded-lg appearance-none cursor-pointer accent-amber-500"
            />
            <p className="text-xs text-zinc-400">Try 20 tasks first. Then slide to 100 and feel the completionist trap.</p>
          </div>

          <SliderGuide
            step={2}
            title="Flip the lens"
            hint="Intuition treats every task equally. Statistical Reality shows a few tasks dominate output."
          />

          <div className="bg-zinc-950 border border-zinc-800 rounded-2xl p-6 relative overflow-hidden">
            <div className="absolute top-0 right-0 p-4 opacity-5">
              <TargetIcon className="w-24 h-24" />
            </div>
            <div className="text-sm text-zinc-400 mb-2">Total Output Yield</div>
            <div className="text-5xl font-light text-amber-400 tabular-nums">
              {totalYield.toFixed(1)}%
            </div>
            {selectedTasks === 100 && (
              <div className="mt-4 text-xs text-rose-400 bg-rose-500/10 p-2 rounded border border-rose-500/20">
                Warning: The Completionist Fallacy. You spent 80% of your time chasing the final {mode === 'reality' ? '20%' : '80%'} of results.
              </div>
            )}
          </div>

          <div className="mt-auto pt-6 border-t border-zinc-800/50">
            <div className="flex items-start gap-3 text-sm text-zinc-400">
              <MousePointer2 className="w-5 h-5 text-amber-500 shrink-0" />
              {mode === 'intuition' ? (
                <p>
                  <strong>The Linear Illusion:</strong> We treat 100 syllabus chapters or checklist items identically, assuming 1 hour equals 1 unit of progress.
                </p>
              ) : (
                <p>
                  <strong>Asymmetric Resource Allocation:</strong> The top 20% of inputs contain almost all the expected value. The bottom 80% is dead weight.
                </p>
              )}
            </div>
          </div>
        </div>

        {/* Visualization */}
        <div className="lg:col-span-2 bg-zinc-900/20 border border-zinc-800/50 rounded-3xl p-8 flex items-center justify-center relative overflow-hidden min-h-[400px]">
          
          <div className="absolute top-8 left-8">
            <div className="text-xs font-mono text-zinc-500 uppercase tracking-wider">Expected Value Map</div>
          </div>

          <div className="grid grid-cols-10 gap-1.5 sm:gap-2 w-full max-w-lg mt-8">
            {tasks.map((task, index) => {
              const isSelected = index < selectedTasks;
              const val = mode === 'intuition' ? task.intuitionValue : task.realityValue;
              
              // Scale height/brightness based on value. 
              // Max reality value is ~18%, min is ~0.08%.
              // We map this to opacity or scale for visual impact.
              const maxVal = 18;
              const normalizedVal = mode === 'intuition' ? 0.3 : Math.min(val / maxVal, 1);
              
              return (
                <motion.div
                  key={task.id}
                  layout
                  initial={false}
                  animate={{
                    backgroundColor: isSelected 
                      ? `rgba(245, 158, 11, ${mode === 'reality' ? 0.2 + (normalizedVal * 0.8) : 0.5})` // amber-500
                      : 'rgba(63, 63, 70, 0.2)', // zinc-700
                    scale: isSelected && mode === 'reality' ? 0.8 + (normalizedVal * 0.4) : 1,
                    borderColor: isSelected 
                      ? `rgba(252, 211, 77, ${mode === 'reality' ? 0.4 + (normalizedVal * 0.6) : 0.4})`
                      : 'rgba(82, 82, 91, 0.3)',
                    boxShadow: isSelected && mode === 'reality' && normalizedVal > 0.1
                      ? `0 0 ${normalizedVal * 20}px rgba(245, 158, 11, ${normalizedVal * 0.5})`
                      : 'none'
                  }}
                  transition={{ type: "spring", bounce: 0, duration: 0.5 }}
                  className="aspect-square rounded border"
                  title={`Task ${task.id} (EV: ${val.toFixed(2)}%)`}
                />
              );
            })}
          </div>

        </div>
      </div>

      {hasInteracted && onViewTakeaway && (
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex justify-center pt-2"
        >
          <button
            type="button"
            onClick={onViewTakeaway}
            className="flex items-center gap-3 bg-teal-600 hover:bg-teal-500 text-white px-8 py-4 rounded-2xl font-medium transition-all hover:scale-[1.02] active:scale-[0.98] border border-teal-500/30"
          >
            See the takeaway
            <ArrowRight className="w-5 h-5" />
          </button>
        </motion.div>
      )}
    </motion.div>
  );
}

function TargetIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg
      {...props}
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <circle cx="12" cy="12" r="10" />
      <circle cx="12" cy="12" r="6" />
      <circle cx="12" cy="12" r="2" />
    </svg>
  );
}
