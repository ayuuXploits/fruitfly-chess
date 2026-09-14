interface Props {
  evaluation: number
  isThinking: boolean
}

export default function EvalBar({ evaluation, isThinking }: Props) {
  /* Clamp eval to [-5, +5] and convert to white-fill percentage (50% = equal) */
  const clamped = Math.max(-5, Math.min(5, evaluation))
  const whitePct = 50 + (clamped / 5) * 50

  const label =
    evaluation >= 0
      ? `+${Math.abs(evaluation).toFixed(1)}`
      : `-${Math.abs(evaluation).toFixed(1)}`

  return (
    <div className="flex flex-col items-center gap-1.5 select-none" title={`Eval: ${label}`}>
      {/* Numeric label */}
      <span className="text-[10px] font-mono text-slate-400">{label}</span>

      {/* Bar */}
      <div className="relative w-4 flex-1 min-h-0 rounded-full overflow-hidden bg-[#1c1c2e] border border-white/[0.06]">
        {/* White fill from bottom */}
        <div
          className="absolute bottom-0 left-0 right-0 transition-[height] duration-700 ease-out rounded-full"
          style={{
            height: `${whitePct}%`,
            background: 'linear-gradient(to top, #f0ead6, #d4c9b0)',
          }}
        />

        {/* Thinking pulse */}
        {isThinking && (
          <div className="absolute inset-0 bg-cyan-400/10 animate-pulse rounded-full" />
        )}

        {/* Center line */}
        <div className="absolute top-1/2 left-0 right-0 h-px bg-slate-600/50" />
      </div>
    </div>
  )
}
