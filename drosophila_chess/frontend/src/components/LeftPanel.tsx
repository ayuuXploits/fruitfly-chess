import { useMemo } from 'react'
import type { GameState, FlyStats } from '../types'
import EvalBar from './EvalBar'
import MoveHistory from './MoveHistory'

/* Unicode chess piece symbols */
const PIECE_ICONS: Record<string, string> = {
  p: '♟', n: '♞', b: '♝', r: '♜', q: '♛', k: '♚',
  P: '♙', N: '♘', B: '♗', R: '♖', Q: '♕', K: '♔',
}

function getCapturedPieces(fen: string) {
  const initial: Record<string, number> = {
    P: 8, N: 2, B: 2, R: 2, Q: 1, K: 1,
    p: 8, n: 2, b: 2, r: 2, q: 1, k: 1,
  }
  const board = fen.split(' ')[0]
  for (const ch of board) {
    if (initial[ch] !== undefined) initial[ch]--
  }

  const whiteCaptured: string[] = [] // Black pieces captured by white
  const blackCaptured: string[] = [] // White pieces captured by black
  for (const [piece, count] of Object.entries(initial)) {
    if (piece === 'K' || piece === 'k') continue
    const icon = PIECE_ICONS[piece]
    for (let i = 0; i < count; i++) {
      if (piece === piece.toLowerCase()) {
        whiteCaptured.push(icon) // Black piece was captured
      } else {
        blackCaptured.push(icon) // White piece was captured
      }
    }
  }
  return { whiteCaptured, blackCaptured }
}

interface Props {
  gameState: GameState | null
  flyStats: FlyStats | null
  isThinking: boolean
}

export default function LeftPanel({ gameState, flyStats, isThinking }: Props) {
  const evaluation = flyStats?.eval_value ?? 0
  const { whiteCaptured, blackCaptured } = useMemo(
    () => getCapturedPieces(gameState?.fen || 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR'),
    [gameState?.fen]
  )

  const isFlyTurn = gameState?.turn !== gameState?.player_color

  return (
    <div className="w-[260px] shrink-0 flex gap-2 h-full overflow-hidden p-2">
      {/* ── Eval bar ── */}
      <EvalBar evaluation={evaluation} isThinking={isThinking} />

      {/* ── Main column ── */}
      <div className="flex-1 flex flex-col gap-2 min-h-0">
        {/* Fly player card */}
        <div className={`glass-card p-3 transition-colors ${isFlyTurn ? 'border-l-2 !border-l-cyan-500' : ''}`}>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="text-base">🪰</span>
              <div>
                <div className="text-xs font-semibold text-slate-200">Drosophila</div>
                <div className="text-[9px] text-slate-500 font-mono">Connectome Engine</div>
              </div>
            </div>
            {isThinking && (
              <div className="flex gap-0.5 text-cyan-400 text-sm">
                <span className="thinking-dot">•</span>
                <span className="thinking-dot">•</span>
                <span className="thinking-dot">•</span>
              </div>
            )}
          </div>
          {whiteCaptured.length > 0 && (
            <div className="mt-2 text-sm leading-tight tracking-wide text-slate-400">
              {whiteCaptured.join(' ')}
            </div>
          )}
        </div>

        {/* Move history */}
        <div className="glass-card flex-1 flex flex-col min-h-0 overflow-hidden">
          <div className="text-[10px] text-slate-500 font-mono px-3 pt-2 pb-1 uppercase tracking-wider">
            Moves
          </div>
          <MoveHistory moves={gameState?.move_history ?? []} />
        </div>

        {/* Human player card */}
        <div className={`glass-card p-3 transition-colors ${!isFlyTurn ? 'border-l-2 !border-l-cyan-500' : ''}`}>
          <div className="flex items-center gap-2">
            <span className="text-base">👤</span>
            <div>
              <div className="text-xs font-semibold text-slate-200">Human</div>
              <div className="text-[9px] text-slate-500 font-mono">Player</div>
            </div>
          </div>
          {blackCaptured.length > 0 && (
            <div className="mt-2 text-sm leading-tight tracking-wide text-slate-400">
              {blackCaptured.join(' ')}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
