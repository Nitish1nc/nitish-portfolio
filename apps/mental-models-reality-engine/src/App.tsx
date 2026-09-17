import { useState } from 'react';
import { AssumptionCollapse } from './components/AssumptionCollapse';
import { CompoundEffect } from './components/CompoundEffect';
import { ParetoGravity } from './components/ParetoGravity';
import { Takeaway } from './components/Takeaway';
import { Welcome } from './components/Welcome';
import { Layers, TrendingUp, Target, Sparkles } from 'lucide-react';
import { AnimatePresence } from 'motion/react';

type ModelId = 'assumption' | 'compound' | 'pareto';
type ActiveView = 'welcome' | ModelId | 'takeaway';

export default function App() {
  const [activeModel, setActiveModel] = useState<ActiveView>('welcome');

  const models = [
    { id: 'assumption' as const, num: '01', name: 'Assumption Stacks', icon: Layers, desc: 'First Principles Thinking' },
    { id: 'compound' as const, num: '02', name: 'Compound Effect', icon: TrendingUp, desc: 'Non-Linearity Bias' },
    { id: 'pareto' as const, num: '03', name: 'Pareto Gravity', icon: Target, desc: '80/20 Rule' },
    { id: 'takeaway' as const, num: '04', name: 'Takeaway', icon: Sparkles, desc: 'Synthesis' },
  ];

  return (
    <div className="min-h-screen bg-zinc-950 text-slate-300 font-sans selection:bg-teal-500/30 flex flex-col">
      <header className="border-b border-zinc-800/50 bg-zinc-950/80 backdrop-blur-xl sticky top-0 z-50">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-4 flex items-center justify-between gap-4 sm:gap-8">
          <div className="flex items-center gap-4 sm:gap-6 min-w-0">
            <a
              href="/"
              className="shrink-0 text-sm font-medium text-zinc-300 hover:text-teal-400 transition-colors whitespace-nowrap rounded-lg border border-zinc-700/80 bg-zinc-900/60 px-3 py-1.5"
            >
              NitishLabs
            </a>
            <div className="w-px h-9 bg-zinc-800 shrink-0" aria-hidden="true" />
            <button
              type="button"
              onClick={() => setActiveModel('welcome')}
              className="flex items-center gap-3 text-left group min-w-0"
            >
              <div className="w-9 h-9 rounded-lg bg-teal-500/10 flex items-center justify-center border border-teal-500/20 group-hover:bg-teal-500/20 transition-colors shrink-0">
                <span className="text-teal-400 font-bold text-lg">∑</span>
              </div>
              <h1 className="text-zinc-100 font-medium leading-tight group-hover:text-teal-400 transition-colors truncate">
                Mental Models
              </h1>
            </button>
          </div>
          
          {activeModel !== 'welcome' && (
            <nav className="flex gap-1 bg-zinc-900/80 p-1 rounded-xl border border-zinc-700 overflow-x-auto">
            {models.map((m) => {
              const Icon = m.icon;
              const isActive = activeModel === m.id;
              return (
                <button
                  key={m.id}
                  type="button"
                  onClick={() => setActiveModel(m.id)}
                  className={`flex items-center gap-2 px-3 sm:px-4 py-2 rounded-lg text-sm transition-all whitespace-nowrap border ${
                    isActive 
                      ? 'bg-zinc-800 border-zinc-500 text-teal-400 shadow-sm' 
                      : 'border-transparent text-zinc-300 hover:text-zinc-100 hover:bg-zinc-800/70 hover:border-zinc-600'
                  }`}
                >
                  <span className={`font-mono text-xs ${isActive ? 'text-teal-500' : 'text-zinc-500'}`}>{m.num}</span>
                  <Icon className="w-4 h-4 shrink-0" />
                  <span className="hidden sm:inline font-medium">{m.name}</span>
                </button>
              );
            })}
          </nav>
          )}
        </div>
      </header>

      <main className="flex-1 flex flex-col max-w-6xl mx-auto w-full p-4 md:p-8 overflow-hidden">
        {activeModel !== 'welcome' && activeModel !== 'takeaway' && (
          <div className="mb-6 rounded-2xl border border-zinc-700 bg-zinc-900/60 p-4 text-sm text-zinc-400 leading-relaxed">
            <p className="text-zinc-200 font-medium mb-1">Quick guide</p>
            <p>
              Drag the sliders on the left, watch the visualization update, then flip to{' '}
              <span className="text-teal-400 font-medium">Statistical Reality</span> to see what the math says.
            </p>
          </div>
        )}
        <AnimatePresence mode="wait">
          {activeModel === 'welcome' && <Welcome key="welcome" onStart={() => setActiveModel('assumption')} />}
          {activeModel === 'assumption' && <AssumptionCollapse key="assumption" />}
          {activeModel === 'compound' && <CompoundEffect key="compound" />}
          {activeModel === 'pareto' && (
            <ParetoGravity key="pareto" onViewTakeaway={() => setActiveModel('takeaway')} />
          )}
          {activeModel === 'takeaway' && (
            <Takeaway key="takeaway" onReplayModel={(model) => setActiveModel(model)} />
          )}
        </AnimatePresence>
      </main>
    </div>
  );
}
