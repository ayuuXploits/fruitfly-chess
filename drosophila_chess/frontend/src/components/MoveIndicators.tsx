import type { PieceSymbol } from '../types'

interface Props {
  legalMoves: string[]
  selectedSquare: string | null
  fen: string
}

/** Convert algebraic square name → 3D world position. */
export function squareTo3D(sq: string): [number, number, number] {
  const file = sq.charCodeAt(0) - 97 // a=0 … h=7
  const rank = parseInt(sq[1]) - 1   // 1=0 … 8=7
  return [file - 3.5, 0.101, -(rank - 3.5)]
}

/** Parse FEN occupied squares. */
function parseFenSquare(fen: string, sq: string): { type: PieceSymbol; color: 'w' | 'b' } | null {
  const file = sq.charCodeAt(0) - 97
  const rank = parseInt(sq[1]) - 1
  const rows = fen.split(' ')[0].split('/')
  const row = rows[7 - rank]
  let col = 0
  for (const ch of row) {
    if (col > file) break
    const n = parseInt(ch)
    if (!isNaN(n)) { col += n; continue }
    if (col === file) {
      const lower = ch.toLowerCase()
      return { type: lower as PieceSymbol, color: ch === lower ? 'b' : 'w' }
    }
    col++
  }
  return null
}

export default function MoveIndicators({ legalMoves, selectedSquare, fen }: Props) {
  if (!selectedSquare || legalMoves.length === 0) return null

  return (
    <group>
      {legalMoves.map((uci) => {
        const target = uci.slice(2, 4)
        const [x, , z] = squareTo3D(target)
        const isCapture = parseFenSquare(fen, target) !== null

        if (isCapture) {
          /* Capture: subtle ring */
          return (
            <mesh key={uci} position={[x, 0.12, z]} rotation={[-Math.PI / 2, 0, 0]}>
              <torusGeometry args={[0.38, 0.04, 8, 24]} />
              <meshStandardMaterial
                color="#00f0ff"
                transparent
                opacity={0.5}
                emissive="#00f0ff"
                emissiveIntensity={0.3}
              />
            </mesh>
          )
        }

        /* Quiet move: small dot */
        return (
          <mesh key={uci} position={[x, 0.14, z]}>
            <sphereGeometry args={[0.12, 12, 12]} />
            <meshStandardMaterial
              color="#00f0ff"
              transparent
              opacity={0.35}
              emissive="#00f0ff"
              emissiveIntensity={0.2}
            />
          </mesh>
        )
      })}
    </group>
  )
}
