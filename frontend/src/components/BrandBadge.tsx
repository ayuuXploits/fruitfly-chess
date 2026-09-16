interface Props {
  elapsedSeconds: number
  moveCount: number
}

export default function BrandBadge({ elapsedSeconds, moveCount }: Props) {
  const mins = Math.floor(elapsedSeconds / 60)
  const secs = elapsedSeconds % 60
  const timeStr = `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`

  return (
    <div className="flex items-center gap-3">
      {/* Combined timer pill */}
      <div className="flex items-center gap-3 rounded-full bg-black/40 px-4 py-1.5 border border-white/[0.06]">
        <span className="text-[11px] text-slate-400 font-mono">Game: <span className="text-white font-semibold">{timeStr}</span></span>
        <span className="w-px h-3 bg-white/10" />
        <span className="text-[11px] text-slate-400 font-mono">Move <span className="text-white font-semibold">{moveCount}</span></span>
      </div>

      {/* Brand */}
      <div className="flex items-center gap-2">
        <div className="w-9 h-9 rounded bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center">
          <span className="text-lg">🪰</span>
        </div>
        <div className="leading-none">
          <div className="text-[15px] font-extrabold tracking-tight text-white">FRUITFLY</div>
          <div className="text-[15px] font-extrabold tracking-tight text-cyan-400">CHESS</div>
        </div>
      </div>
    </div>
  )
}
