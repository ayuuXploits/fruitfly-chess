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
  onReset: () => void
}

export default function GameControls({ mode, setMode, isThinking, onReset }: Props) {
  return (
    <div className="hud-panel p-2 flex items-center gap-2">
      <select
        value={mode}
        onChange={(e) => setMode(e.target.value as DifficultyMode)}
        disabled={isThinking}
        className="bg-white/[0.04] border border-white/[0.08] rounded-lg px-2.5 py-1.5 text-[11px] text-slate-300 font-mono focus:outline-none focus:border-cyan-500/40 disabled:opacity-40 cursor-pointer"
      >
        {MODES.map((m) => (
          <option key={m.value} value={m.value}>{m.label}</option>
        ))}
      </select>

      <button
        onClick={onReset}
        disabled={isThinking}
        className="px-3 py-1.5 text-[11px] font-medium border border-cyan-500/30 text-cyan-400 rounded-lg hover:bg-cyan-500/10 transition-colors disabled:opacity-40 whitespace-nowrap"
      >
        New Game
      </button>
    </div>
  )
}
