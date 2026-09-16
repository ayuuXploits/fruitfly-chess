import type { FlyStats, MoveEntry } from '../types'
import EvalBar from './EvalBar'
import MoveHistory from './MoveHistory'

interface Props {
  flyStats: FlyStats | null
  isThinking: boolean
  evalHistory: number[]
  moves: MoveEntry[]
  turn: string
  moveCount: number
}

function fmt(n: number): string {
  return n >= 1000 ? `${(n / 1000).toFixed(1)}k` : String(Math.round(n))
}

export default function RightPanel({ flyStats, isThinking, evalHistory, moves, turn, moveCount }: Props) {
  const evaluation = flyStats?.eval_value ?? 0

  return (
    <div className="flex flex-col gap-1.5 w-[240px]">
      {/* Move History */}
      <div className="hud-panel p-2.5 flex flex-col max-h-[200px]">
        <div className="hud-title mb-1.5">Move History</div>
        <MoveHistory moves={moves} />
        <div className="text-[10px] text-slate-400 font-mono mt-1.5 pt-1.5 border-t border-white/[0.06]">
          {turn === 'white' ? 'White (fly)' : 'Black'} to move
        </div>
      </div>

      {/* Evaluation Bar */}
      <div className="hud-panel p-2.5">
        <EvalBar
          evaluation={evaluation}
          evalHistory={evalHistory}
          isThinking={isThinking}
        />
      </div>

      {/* Game State */}
      <div className="hud-panel p-2.5">
        <div className="hud-title mb-1.5">Game State</div>
        <div className="space-y-0.5">
          <div className="flex justify-between text-[11px]">
            <span className="text-slate-500">Time</span>
            <span className="text-white font-mono">{flyStats ? `${flyStats.search_time_ms.toFixed(0)}ms` : '\u2014'}</span>
          </div>
          <div className="flex justify-between text-[11px]">
            <span className="text-slate-500">Eval</span>
            <span className={`font-mono font-semibold ${
              evaluation > 0.5 ? 'text-emerald-400' : evaluation < -0.5 ? 'text-red-400' : 'text-amber-400'
            }`}>
              {evaluation >= 0 ? '+' : ''}{evaluation.toFixed(1)}
            </span>
          </div>
          <div className="flex justify-between text-[11px]">
            <span className="text-slate-500">Moves</span>
            <span className="text-white font-mono">{moveCount}</span>
          </div>
          {flyStats && (
            <>
              <div className="pt-0.5 mt-0.5 border-t border-white/[0.06]">
                <div className="flex justify-between text-[11px]">
                  <span className="text-slate-500">Depth</span>
                  <span className="text-white font-mono">{flyStats.search_depth}</span>
                </div>
              </div>
              <div className="flex justify-between text-[11px]">
                <span className="text-slate-500">Nodes</span>
                <span className="text-white font-mono">{fmt(flyStats.nodes_searched)}</span>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  )
}
