import type { DifficultyMode } from '../types'

const MODES: { value: DifficultyMode; label: string }[] = [
  { value: 'undefeatable', label: '👑 Undefeatable (3500+)' },
  { value: 'grandmaster_2300', label: '🌟 Grandmaster (2300)' },
  { value: 'tactical', label: '⚡ Tactical (1600)' },
  { value: 'policy', label: '🪰 Pure Connectome (700)' },
]

interface Props {
  mode: DifficultyMode
  setMode: (m: DifficultyMode) => void
  isThinking: boolean
  turn: string
  onReset: () => void
  isGameOver: boolean
  result?: string
}

export default function Header({ mode, setMode, isThinking, turn, onReset, isGameOver, result }: Props) {
  const statusText = isGameOver
    ? result || 'Game Over'
    : isThinking
      ? '🪰 Drosophila is thinking…'
      : turn === 'white'
        ? '⬜ Your move'
        : '⬛ Your move'

  return (
    <header className="h-14 flex items-center justify-between px-5 border-b border-white/[0.06] bg-[#0a0e17]/90 backdrop-blur-md shrink-0 z-20">
      {/* ── Brand ── */}
      <div className="flex items-center gap-3">
        <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-cyan-500/20 to-purple-500/20 border border-cyan-500/30 flex items-center justify-center text-lg shadow-[0_0_12px_rgba(0,240,255,0.15)]">
          🪰
        </div>
        <span className="text-lg font-bold tracking-tight">
          Fli<span className="text-cyan-400">Py</span>
        </span>
        <span className="text-[10px] text-slate-500 font-mono ml-1 hidden sm:inline">
          CONNECTOME CHESS ENGINE
        </span>
      </div>

      {/* ── Status ── */}
      <div className="text-sm text-slate-300 font-medium">
        {statusText}
      </div>

      {/* ── Controls ── */}
      <div className="flex items-center gap-3">
        <select
          value={mode}
          onChange={(e) => setMode(e.target.value as DifficultyMode)}
          disabled={isThinking}
          className="bg-white/[0.04] border border-white/[0.08] rounded-lg px-3 py-1.5 text-xs text-slate-300 font-mono focus:outline-none focus:border-cyan-500/40 disabled:opacity-40 cursor-pointer"
        >
          {MODES.map((m) => (
            <option key={m.value} value={m.value}>{m.label}</option>
          ))}
        </select>

        <button
          onClick={onReset}
          disabled={isThinking}
          className="px-3 py-1.5 text-xs font-medium border border-cyan-500/30 text-cyan-400 rounded-lg hover:bg-cyan-500/10 transition-colors disabled:opacity-40"
        >
          New Game
        </button>
      </div>
    </header>
  )
}
