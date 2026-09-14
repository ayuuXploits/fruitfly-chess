import { useRef, useEffect } from 'react'
import type { MoveEntry } from '../types'

interface Props {
  moves: MoveEntry[]
}

export default function MoveHistory({ moves }: Props) {
  const endRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [moves.length])

  if (moves.length === 0) {
    return (
      <div className="text-[11px] text-slate-500 font-mono px-3 py-4 text-center italic">
        No moves yet
      </div>
    )
  }

  /* Pair moves: white (odd index) + black (even index) */
  const rows: { num: number; white?: MoveEntry; black?: MoveEntry }[] = []
  for (let i = 0; i < moves.length; i += 2) {
    rows.push({
      num: Math.floor(i / 2) + 1,
      white: moves[i],
      black: moves[i + 1],
    })
  }

  return (
    <div className="overflow-y-auto flex-1 min-h-0 px-1">
      <table className="w-full text-[11px] font-mono">
        <tbody>
          {rows.map((row) => (
            <tr
              key={row.num}
              className={row.num % 2 === 0 ? 'bg-white/[0.015]' : ''}
            >
              <td className="text-slate-500 pr-2 py-0.5 text-right w-6 select-none">
                {row.num}.
              </td>
              <td className="text-slate-200 py-0.5 w-16">
                {row.white?.san || ''}
              </td>
              <td className="text-slate-400 py-0.5 w-16">
                {row.black?.san || ''}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      <div ref={endRef} />
    </div>
  )
}
