/** @type {import('tailwindcss').Config} */
const path = require('path');
module.exports = {
  content: [
    path.join(__dirname, '**/*.{html,js}')
  ],
  theme: { extend: {} },
  plugins: [],
  corePlugins: { preflight: false },
  safelist: [
    'hidden','flex','block','inline-flex','grid','fixed','relative',
    'md:flex','md:hidden','md:flex-row','md:grid-cols-2','md:text-5xl','md:text-7xl','md:text-xl',
    'lg:grid-cols-3','sm:flex-row','sm:items-center',
    'grid-cols-1','grid-cols-2','flex-col','flex-wrap','flex-shrink-0','items-center','items-start','justify-between','justify-center',
    'gap-2','gap-3','gap-3.5','gap-4','gap-6','gap-7','gap-8',
    'space-y-2','space-y-3','space-y-6',
    'w-full','w-8','w-1.5','h-8','h-16','h-1.5',
    'max-w-7xl','max-w-3xl','max-w-2xl','max-w-xl','mx-auto',
    'px-2.5','px-3','px-6','py-1','py-1.5','py-4','py-10','pt-24','pb-24','pb-28','p-4',
    'mt-1.5','mt-2','mt-2.5','mt-4','mb-2.5','mb-3','mb-3.5','mb-4','mb-5','mb-6','mb-8',
    'text-xs','text-sm','text-base','text-lg','text-xl','text-4xl','text-5xl','text-center',
    'text-white','text-zinc-200','text-zinc-300','text-zinc-400','text-zinc-500','text-zinc-600',
    'font-medium','font-semibold','font-bold',
    'leading-relaxed','leading-snug','leading-tight','leading-[1.08]','leading-[1.15]',
    'tracking-tight','tracking-tighter','whitespace-nowrap','line-clamp-2','line-clamp-3',
    'rounded-full','rounded-xl','rounded-2xl','rounded-3xl',
    'border-b','border-t','border-zinc-800/60','border-zinc-800/80',
    'bg-zinc-950/70','bg-zinc-950/95','backdrop-blur-xl','antialiased','top-0','z-50','group',
    'group-hover:text-white','hover:text-white','hover:text-zinc-400','transition-colors'
  ]
};
