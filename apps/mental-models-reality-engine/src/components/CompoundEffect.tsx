import { useState, useEffect, useRef } from 'react';
import { motion, useAnimation } from 'motion/react';
import { ViewToggle } from './ui/ViewToggle';
import { SliderGuide } from './ui/SliderGuide';
import { Play, Pause, AlertTriangle } from 'lucide-react';

export function CompoundEffect() {
  const [mode, setMode] = useState<'intuition' | 'reality'>('intuition');
  const [dailyRate, setDailyRate] = useState(1);
  const [currentDay, setCurrentDay] = useState(365);
  const [isPlaying, setIsPlaying] = useState(false);

  // Auto-play logic
  useEffect(() => {
    let interval: number;
    if (isPlaying) {
      interval = window.setInterval(() => {
        setCurrentDay(prev => {
          if (prev >= 365) {
            setIsPlaying(false);
            return 365;
          }
          return prev + 2; // speed it up slightly
        });
      }, 30);
    }
    return () => clearInterval(interval);
  }, [isPlaying]);

  const togglePlay = () => {
    if (currentDay >= 365) setCurrentDay(0);
    setIsPlaying(!isPlaying);
  };

  // Math
  const rateDec = dailyRate / 100;
  
  // Max possible value for scaling the Y axis (at 365 days, 5% max rate)
  // Wait, 1.05^365 is 54,000,000. That breaks the graph.
  // Let's cap the visual scale dynamically based on the CURRENT selected rate at day 365.
  const maxGeometric = Math.pow(1 + rateDec, 365);
  const maxLinear = 1 + (rateDec * 365);
  const maxVisualValue = Math.max(maxGeometric, maxLinear, 2); // ensure at least 2 for negatives
  
  const currentLinear = 1 + (rateDec * currentDay);
  const currentGeometric = Math.pow(1 + rateDec, currentDay);
  
  const currentValue = mode === 'intuition' ? currentLinear : currentGeometric;

  // SVG Drawing Math
  const width = 800;
  const height = 400;
  
  const getLinearPath = () => {
    let path = `M 0 ${height}`;
    for(let d = 0; d <= 365; d+=5) {
      const x = (d / 365) * width;
      const v = 1 + (rateDec * d);
      const y = height - (v / maxVisualValue) * height;
      path += ` L ${x} ${y}`;
    }
    return path;
  };

  const getGeometricPath = () => {
    let path = `M 0 ${height}`;
    for(let d = 0; d <= 365; d+=5) {
      const x = (d / 365) * width;
      const v = Math.pow(1 + rateDec, d);
      const y = height - (v / maxVisualValue) * height;
      path += ` L ${x} ${y}`;
    }
    return path;
  };

  // Current dot position
  const dotX = (currentDay / 365) * width;
  const dotY = height - (currentValue / maxVisualValue) * height;
  
  // Base size of dot is 10px, scales up with value but capped visually
  const dotScale = Math.min(Math.max(currentValue, 0.1), 30);

  return (
    <motion.div 
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      className="flex flex-col h-full gap-8"
    >
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6">
        <div>
          <p className="text-xs font-mono uppercase tracking-wider text-emerald-400 mb-2">Model 02</p>
          <h2 className="text-3xl font-light text-zinc-100 tracking-tight">02 · The Compound Effect</h2>
          <p className="text-zinc-400 mt-2 max-w-xl">
            We expect progress to be a straight line. But true growth starts invisibly slow before exploding upwards.
          </p>
        </div>
        <ViewToggle mode={mode} onChange={setMode} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 flex-1">
        {/* Controls */}
        <div className="bg-zinc-900/40 border border-zinc-800/50 rounded-3xl p-6 flex flex-col gap-6">
          <SliderGuide
            step={1}
            title="Set the daily change, then scrub time"
            hint="Top slider = daily % change. Bottom slider (or play button) = days elapsed. Watch the curve and return multiplier."
          />

          <div className="space-y-4">
            <div className="flex justify-between items-end">
              <label className="text-sm font-medium text-zinc-300">Daily Improvement</label>
              <span className="text-2xl font-mono text-emerald-400">+{dailyRate}%</span>
            </div>
            <input 
              type="range" 
              min="0" max="3" step="0.1"
              value={dailyRate} 
              onChange={(e) => setDailyRate(Number(e.target.value))}
              className="w-full h-2 bg-zinc-800 rounded-lg appearance-none cursor-pointer accent-emerald-500"
            />
            <p className="text-xs text-zinc-500">A tiny, seemingly invisible daily change.</p>
          </div>

          <div className="space-y-4">
            <div className="flex justify-between items-end">
              <label className="text-sm font-medium text-zinc-300">Time (Days)</label>
              <span className="text-2xl font-mono text-zinc-100">Day {currentDay}</span>
            </div>
            <div className="flex items-center gap-4">
              <button 
                onClick={togglePlay}
                className="w-10 h-10 rounded-full bg-zinc-800 flex items-center justify-center text-zinc-300 hover:bg-zinc-700 hover:text-white transition-colors border border-zinc-700"
              >
                {isPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4 ml-1" />}
              </button>
              <input 
                type="range" 
                min="0" max="365" 
                value={currentDay} 
                onChange={(e) => {
                  setCurrentDay(Number(e.target.value));
                  setIsPlaying(false);
                }}
                className="flex-1 h-3 bg-zinc-700 rounded-lg appearance-none cursor-pointer accent-emerald-500"
              />
            </div>
            <p className="text-xs text-zinc-400">Scrub from Day 0 to 365, or press play to animate a year.</p>
          </div>

          <SliderGuide
            step={2}
            title="Flip the lens"
            hint="Intuition draws a straight line. Statistical Reality shows geometric compounding."
          />

          <div className="mt-auto pt-6 border-t border-zinc-800/50">
            <div className="flex items-start gap-3 text-sm text-zinc-400">
              <AlertTriangle className="w-5 h-5 text-amber-400 shrink-0" />
              {currentDay < 30 ? (
                <p>
                  <strong>The Horizon Deficit:</strong> Notice how flat the curve is right now? People quit here because the visual difference is statistically invisible.
                </p>
              ) : (
                <p>
                  <strong>The Hockey Stick:</strong> Past the inflection point, the terminal value of the equation takes over. It's mathematically guaranteed.
                </p>
              )}
            </div>
          </div>
        </div>

        {/* Visualization */}
        <div className="lg:col-span-2 bg-zinc-900/20 border border-zinc-800/50 rounded-3xl p-8 flex flex-col relative overflow-hidden h-[400px] lg:h-auto min-h-[400px]">
          
          <div className="absolute top-8 left-8 z-20">
            <div className="text-xs font-mono text-zinc-500 mb-1 uppercase tracking-wider">Total Return</div>
            <div className="text-5xl font-light text-zinc-100 flex items-baseline gap-2">
              <motion.span
                className="text-emerald-400 font-medium"
              >
                {currentValue.toFixed(2)}x
              </motion.span>
            </div>
            <div className="text-sm font-mono text-zinc-500 mt-2">
              {mode === 'reality' ? `(1 + ${rateDec})^${currentDay}` : `1 + (${rateDec} × ${currentDay})`}
            </div>
          </div>

          {/* SVG Canvas for curves */}
          <div className="absolute inset-8 right-16 top-32 bottom-12 border-l border-b border-zinc-800/50">
            <svg viewBox={`0 0 ${width} ${height}`} className="w-full h-full overflow-visible" preserveAspectRatio="none">
              
              {/* Grid lines */}
              <line x1="0" y1={height/2} x2={width} y2={height/2} stroke="rgba(63, 63, 70, 0.2)" strokeDasharray="4 4" />
              
              {/* Reality Ghost Path (shown in intuition mode for comparison) */}
              {mode === 'intuition' && (
                <path 
                  d={getGeometricPath()} 
                  fill="none" 
                  stroke="rgba(255, 255, 255, 0.05)" 
                  strokeWidth="2" 
                />
              )}

              {/* Linear Ghost Path (shown in reality mode for comparison) */}
              {mode === 'reality' && (
                <path 
                  d={getLinearPath()} 
                  fill="none" 
                  stroke="rgba(255, 255, 255, 0.1)" 
                  strokeWidth="2" 
                  strokeDasharray="4 4"
                />
              )}

              {/* Active Path */}
              <motion.path 
                initial={false}
                animate={{ d: mode === 'intuition' ? getLinearPath() : getGeometricPath() }}
                transition={{ type: "spring", bounce: 0, duration: 0.8 }}
                fill="none" 
                stroke="rgba(52, 211, 153, 0.5)" // emerald
                strokeWidth="4" 
              />
              
              {/* Traveling Orb */}
              <motion.circle
                initial={false}
                animate={{ cx: dotX, cy: dotY, r: 4 + dotScale }}
                transition={{ type: "spring", bounce: 0, duration: 0.1 }}
                fill="rgba(16, 185, 129, 0.8)"
                stroke="rgba(52, 211, 153, 1)"
                strokeWidth="2"
                style={{ filter: `drop-shadow(0 0 ${dotScale * 2}px rgba(52, 211, 153, 0.6))` }}
              />
            </svg>
            
            {/* Axis labels */}
            <div className="absolute -bottom-6 left-0 text-xs text-zinc-600 font-mono">Day 0</div>
            <div className="absolute -bottom-6 right-0 text-xs text-zinc-600 font-mono">Day 365</div>
          </div>

        </div>
      </div>
    </motion.div>
  );
}
