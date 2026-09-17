interface SliderGuideProps {
  step: number;
  title: string;
  hint: string;
}

export function SliderGuide({ step, title, hint }: SliderGuideProps) {
  return (
    <div className="rounded-2xl border border-zinc-700/80 bg-zinc-950/60 p-4">
      <p className="text-xs font-mono uppercase tracking-wider text-teal-400 mb-1">Step {step}</p>
      <p className="text-sm font-medium text-zinc-200">{title}</p>
      <p className="text-xs text-zinc-400 mt-1 leading-relaxed">{hint}</p>
    </div>
  );
}
