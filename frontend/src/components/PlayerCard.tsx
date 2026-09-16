import { useMemo } from 'react'

const PIECE_ICONS: Record<string, string> = {
  p: '♟', n: '♞', b: '♝', r: '♜', q: '♛', k: '♚',
  P: '♙', N: '♘', B: '♗', R: '♖', Q: '♕', K: '♔',
}

function getCapturedPieces(fen: string, side: 'white' | 'black') {
  const initial: Record<string, number> = {
    P: 8, N: 2, B: 2, R: 2, Q: 1, p: 8, n: 2, b: 2, r: 2, q: 1,
  }
  const board = fen.split(' ')[0]
  for (const ch of board) {
    if (initial[ch] !== undefined) initial[ch]--
  }
  const captured: string[] = []
  for (const [piece, count] of Object.entries(initial)) {
    const isBlackPiece = piece === piece.toLowerCase()
    if ((side === 'white' && isBlackPiece) || (side === 'black' && !isBlackPiece)) {
      for (let i = 0; i < count; i++) captured.push(PIECE_ICONS[piece])
    }
  }
  return captured
}

interface Props {
  name: string
  subtitle: string
  rating: number
  avatar: string
  isActive: boolean
  isThinking?: boolean
  fen: string
  capturedSide: 'white' | 'black'
}

export default function PlayerCard({ name, subtitle, rating, avatar, isActive, isThinking, fen, capturedSide }: Props) {
  const captured = useMemo(() => getCapturedPieces(fen, capturedSide), [fen, capturedSide])

  return (
    <div className={`hud-panel px-3 py-2 min-w-[240px] ${isActive ? 'turn-active' : ''}`}>
      <div className="flex items-center gap-2.5">
        <div className="w-8 h-8 rounded bg-slate-800/60 border border-white/[0.08] flex items-center justify-center text-lg">
          {avatar}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <span className="text-[11px] font-bold text-slate-100 uppercase tracking-wide truncate">{name}</span>
            {isThinking && (
              <span className="flex gap-0.5 text-cyan-400 text-xs">
                <span className="thinking-dot">•</span>
                <span className="thinking-dot">•</span>
                <span className="thinking-dot">•</span>
              </span>
            )}
          </div>
          <div className="text-[9px] text-slate-500 font-mono">{subtitle}</div>
        </div>
        <div className="text-right">
          <div className="text-[9px] text-slate-500 font-mono">Rating</div>
          <div className="text-sm font-bold text-slate-200 font-mono">{rating}</div>
        </div>
      </div>
      {captured.length > 0 && (
        <div className="mt-1.5 text-sm leading-tight tracking-wide text-slate-400">
          {captured.join(' ')}
        </div>
      )}
    </div>
  )
}
