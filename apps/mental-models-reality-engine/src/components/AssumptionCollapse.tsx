import { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { ViewToggle } from './ui/ViewToggle';
import { SliderGuide } from './ui/SliderGuide';
import { AlertCircle } from 'lucide-react';

export function AssumptionCollapse() {
  const [mode, setMode] = useState<'intuition' | 'reality'>('intuition');
  const [confidence, setConfidence] = useState(90);
  const [assumptions, setAssumptions] = useState(5);

  const totalDots = 100;
  
  const passingIntuition = confidence;
  const passingReality = Math.round(Math.pow(confidence / 100, assumptions) * 100);
  
  const currentPassing = mode === 'intuition' ? passingIntuition : passingReality;

  // Generate a stable array of dots
  const dots = useMemo(() => {
    return Array.from({ length: totalDots }).map((_, i) => ({ id: i }));
  }, []);

  return (
    <motion.div 
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      className="flex flex-col h-full gap-8"
    >
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6">
        <div>
          <p className="text-xs font-mono uppercase tracking-wider text-teal-400 mb-2">Model 01</p>
          <h2 className="text-3xl font-light text-zinc-100 tracking-tight">The Assumption Stack</h2>
          <p className="text-zinc-400 mt-2 max-w-xl">
            We tend to think that if we're mostly sure of each step in a plan, we're mostly sure of the whole plan. The math says otherwise.
          </p>
        </div>
        <ViewToggle mode={mode} onChange={setMode} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 flex-1">
        {/* Controls */}
        <div className="bg-zinc-900/40 border border-zinc-800/50 rounded-3xl p-6 flex flex-col gap-6">
          <SliderGuide
            step={1}
            title="Drag the sliders below"
            hint="Left slider = how sure you are per step. Right slider = how many chained steps. The big number and grid on the right update live."
          />

          <div className="space-y-4">
            <div className="flex justify-between items-end">
              <label className="text-sm font-medium text-zinc-300">Confidence per assumption</label>
              <span className="text-2xl font-mono text-zinc-100">{confidence}%</span>
            </div>
            <input 
              type="range" 
              min="50" max="99" 
              value={confidence} 
              onChange={(e) => setConfidence(Number(e.target.value))}
              className="w-full h-3 bg-zinc-700 rounded-lg appearance-none cursor-pointer accent-teal-500"
            />
            <p className="text-xs text-zinc-400">How sure are you of each individual step? Try 90% first.</p>
          </div>

          <div className="space-y-4">
            <div className="flex justify-between items-end">
              <label className="text-sm font-medium text-zinc-300">Number of assumptions</label>
              <span className="text-2xl font-mono text-zinc-100">{assumptions}</span>
            </div>
            <input 
              type="range" 
              min="1" max="10" 
              value={assumptions} 
              onChange={(e) => setAssumptions(Number(e.target.value))}
              className="w-full h-3 bg-zinc-700 rounded-lg appearance-none cursor-pointer accent-teal-500"
            />
            <p className="text-xs text-zinc-400">How many sequential "ifs" are in your plan? Each one multiplies risk.</p>
          </div>

          <SliderGuide
            step={2}
            title="Flip the lens"
            hint="Start on Intuition (what feels true). Then tap Statistical Reality to see cumulative probability collapse."
          />

          <div className="mt-auto pt-6 border-t border-zinc-800/50">
            <div className="flex items-start gap-3 text-sm text-zinc-400">
              <AlertCircle className="w-5 h-5 text-teal-400 shrink-0" />
              {mode === 'intuition' ? (
                <p>
                  <strong>Reasoning by Analogy:</strong> The brain averages risk. You feel like if you are mostly sure about the parts, you are mostly sure about the whole.
                </p>
              ) : (
                <p>
                  <strong>Deconstructive Reductionism:</strong> The math is multiplicative. Even a 90% confidence rate crumbles when stacked {assumptions} times.
                </p>
              )}
            </div>
          </div>
        </div>

        {/* Visualization */}
        <div className="lg:col-span-2 bg-zinc-900/20 border border-zinc-800/50 rounded-3xl p-8 flex flex-col items-center justify-center relative overflow-hidden">
          
          <div className="absolute top-8 left-8">
            <div className="text-xs font-mono text-zinc-500 mb-1 uppercase tracking-wider">Cumulative Probability</div>
            <div className="text-5xl font-light text-zinc-100 flex items-baseline gap-2">
              <motion.span
                key={currentPassing}
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className={mode === 'reality' && currentPassing < 50 ? 'text-rose-400' : 'text-teal-400'}
              >
                {currentPassing}%
              </motion.span>
            </div>
            {mode === 'reality' && (
              <div className="text-sm font-mono text-zinc-500 mt-2">
                {Array.from({length: Math.min(assumptions, 5)}).map(() => (confidence/100).toFixed(2)).join(' × ')}
                {assumptions > 5 && ' ...'}
              </div>
            )}
          </div>

          {/* Grid */}
          <div className="grid grid-cols-10 gap-2 sm:gap-3 mt-24">
            {dots.map((dot, index) => {
              const isPassing = index < currentPassing;
              return (
                <motion.div
                  key={dot.id}
                  layout
                  initial={false}
                  animate={{
                    backgroundColor: isPassing 
                      ? 'rgba(45, 212, 191, 0.85)' // indigo-500
                      : mode === 'reality' ? 'rgba(244, 63, 94, 0.2)' : 'rgba(63, 63, 70, 0.3)', // rose-400 / zinc-700
                    scale: isPassing ? 1 : 0.8,
                    borderColor: isPassing 
                      ? 'rgba(129, 140, 248, 0.5)'
                      : mode === 'reality' ? 'rgba(244, 63, 94, 0.3)' : 'rgba(82, 82, 91, 0.5)',
                  }}
                  transition={{ 
                    duration: 0.4, 
                    delay: index * 0.005, // ripple effect
                    ease: "easeOut"
                  }}
                  className="w-4 h-4 sm:w-6 sm:h-6 rounded-md border"
                />
              );
            })}
          </div>

        </div>
      </div>
    </motion.div>
  );
}
