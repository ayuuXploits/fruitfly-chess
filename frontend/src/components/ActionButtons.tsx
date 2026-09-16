interface Props {
  onFlipBoard: () => void
  onResign: () => void
  isThinking: boolean
  isGameOver: boolean
}

export default function ActionButtons({ onFlipBoard, onResign, isThinking, isGameOver }: Props) {
  return (
    <div className="flex items-center gap-1.5">
      <button
        onClick={onFlipBoard}
        className="flex items-center gap-1.5 rounded-md border border-white/[0.08] bg-white/[0.03] px-3 py-1.5 text-[11px] text-slate-400 font-mono hover:text-cyan-400 hover:border-cyan-500/30 transition-colors"
      >
        <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <polyline points="17 1 21 5 17 9" />
          <path d="M3 11V9a4 4 0 0 1 4-4h14" />
          <polyline points="7 23 3 19 7 15" />
          <path d="M21 13v2a4 4 0 0 1-4 4H3" />
        </svg>
        Flip Board
      </button>
      <button
        onClick={onResign}
        disabled={isThinking || isGameOver}
        className="flex items-center gap-1.5 rounded-md border border-white/[0.08] bg-white/[0.03] px-3 py-1.5 text-[11px] text-slate-400 font-mono hover:text-red-400 hover:border-red-500/30 transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
      >
        <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M4 15s1-1 4-1 5 2 8 2 4-1 4-1V3s-1 1-4 1-5-2-8-2-4 1-4 1z" />
          <line x1="4" y1="22" x2="4" y2="15" />
        </svg>
        Resign
      </button>
    </div>
  )
}
