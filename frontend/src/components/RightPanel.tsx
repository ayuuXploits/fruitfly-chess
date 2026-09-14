import type { FlyStats } from '../types'
import BrainCanvas from './BrainCanvas'

interface Props {
  flyStats: FlyStats | null
  isThinking: boolean
}

function fmt(n: number): string {
  return n >= 1000 ? `${(n / 1000).toFixed(1)}k` : String(Math.round(n))
}

function StatRow({ label, value, color }: { label: string; value: string; color?: string }) {
  return (
    <div className="flex items-center justify-between py-0.5">
      <span className="text-[10px] text-slate-500">{label}</span>
      <span className={`text-[11px] font-mono ${color || 'text-slate-300'}`}>{value}</span>
    </div>
  )
}

function FiringBar({ label, value, color }: { label: string; value: number; color: string }) {
  const pct = Math.min(100, Math.max(0, value * 100))
  return (
    <div className="space-y-0.5">
      <div className="flex justify-between text-[10px]">
        <span className="text-slate-500">{label}</span>
        <span className="font-mono" style={{ color }}>{pct.toFixed(0)}%</span>
      </div>
      <div className="h-1.5 bg-white/[0.04] rounded-full overflow-hidden">
        <div
          className="h-full rounded-full transition-[width] duration-500"
          style={{ width: `${pct}%`, background: color }}
        />
      </div>
    </div>
  )
}

export default function RightPanel({ flyStats, isThinking }: Props) {
  return (
    <div className="w-[280px] shrink-0 flex flex-col gap-2 h-full overflow-y-auto p-2">
      {/* ── Brain Visualization ── */}
      <div className="glass-card p-3">
        <div className="text-[10px] text-slate-500 font-mono uppercase tracking-wider mb-2">
          CNS Activity
        </div>
        <BrainCanvas flyStats={flyStats} isActive={isThinking || !!flyStats} />
      </div>

      {/* ── Neural Firing ── */}
      <div className="glass-card p-3 space-y-2">
        <div className="text-[10px] text-slate-500 font-mono uppercase tracking-wider">
          Neural Firing
        </div>
        <FiringBar label="Optic Lobe" value={flyStats?.sensory_firing ?? 0} color="#00f0ff" />
        <FiringBar label="Central Complex" value={flyStats?.inter_firing ?? 0} color="#bd00ff" />
        <FiringBar label="Motor DNs" value={flyStats?.motor_firing ?? 0} color="#00ff66" />
      </div>

      {/* ── Engine Telemetry ── */}
      <div className="glass-card p-3 space-y-1">
        <div className="text-[10px] text-slate-500 font-mono uppercase tracking-wider mb-1">
          Engine Telemetry
        </div>
        <StatRow label="Depth" value={String(flyStats?.search_depth ?? '—')} />
        <StatRow label="Nodes" value={flyStats ? fmt(flyStats.nodes_searched) : '—'} />
        <StatRow label="Time" value={flyStats ? `${flyStats.search_time_ms.toFixed(0)}ms` : '—'} />
        <StatRow label="Eval" value={flyStats ? `${flyStats.eval_value >= 0 ? '+' : ''}${flyStats.eval_value.toFixed(2)}` : '—'} color={
          flyStats ? (flyStats.eval_value > 0.5 ? '#00ff88' : flyStats.eval_value < -0.5 ? '#ef4444' : '#f59e0b') : undefined
        } />
        <div className="pt-1 border-t border-white/[0.04]">
          <div className="text-[9px] text-slate-500 truncate">
            {flyStats?.engine_type ?? '—'}
          </div>
        </div>
      </div>

      {/* ── Last Move ── */}
      {flyStats && (
        <div className="glass-card p-3 text-center">
          <div className="text-[10px] text-slate-500 font-mono mb-1">Last Move</div>
          <div className="text-2xl font-bold text-cyan-400 font-mono">
            {flyStats.chosen_san}
          </div>
        </div>
      )}
    </div>
  )
}
