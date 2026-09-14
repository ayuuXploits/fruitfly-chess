import { useMemo } from 'react'
import Piece3D from './Piece3D'
import MoveIndicators, { squareTo3D } from './MoveIndicators'
import type { PieceSymbol } from '../types'

/* ─── Luxury Handcrafted Board Palette ─── */
const LIGHT_SQ = '#f4eedb'     // warm pearlescent maple
const DARK_SQ = '#38281d'      // smoked French walnut
const SELECTED_SQ = '#00f0ff'  // glowing electric cyan
const LAST_MOVE_SQ = '#22c55e' // emerald green highlight
const CHECK_SQ = '#ef4444'     // ruby red check alert
const FRAME_COLOR = '#140d08'  // dark lacquered mahogany frame
const INLAY_COLOR = '#d4af37'  // polished brass metallic inlay

interface Props {
  fen: string
  selectedSquare: string | null
  legalMoves: string[]
  lastMove: { from: string; to: string } | null
  isCheck: boolean
  checkSquare: string | null
  hiddenSquare?: string | null
  onSquareClick: (square: string) => void
}

interface PieceInfo {
  square: string
  type: PieceSymbol
  color: 'w' | 'b'
  pos: [number, number, number]
}

function parsePieces(fen: string): PieceInfo[] {
  const pieces: PieceInfo[] = []
  const rows = fen.split(' ')[0].split('/')
  for (let r = 0; r < 8; r++) {
    let file = 0
    for (const ch of rows[r]) {
      const n = parseInt(ch)
      if (!isNaN(n)) { file += n; continue }
      const rank = 7 - r
      const sq = String.fromCharCode(97 + file) + (rank + 1)
      const lower = ch.toLowerCase() as PieceSymbol
      pieces.push({
        square: sq,
        type: lower,
        color: ch === lower ? 'b' : 'w',
        pos: [file - 3.5, 0.082, -(rank - 3.5)],
      })
      file++
    }
  }
  return pieces
}

export default function Board3D({
  fen, selectedSquare, legalMoves, lastMove, isCheck, checkSquare, hiddenSquare, onSquareClick,
}: Props) {
  const pieces = useMemo(() => {
    const all = parsePieces(fen)
    if (!hiddenSquare) return all
    return all.filter((p) => p.square !== hiddenSquare)
  }, [fen, hiddenSquare])

  const lastMoveSet = useMemo(() => {
    if (!lastMove) return new Set<string>()
    return new Set([lastMove.from, lastMove.to])
  }, [lastMove])

  return (
    <group>
      {/* ── Outer Mahogany Beveled Table Frame ── */}
      <mesh position={[0, -0.04, 0]} receiveShadow>
        <boxGeometry args={[9.4, 0.16, 9.4]} />
        <meshStandardMaterial color={FRAME_COLOR} roughness={0.35} metalness={0.15} />
      </mesh>

      {/* ── Polished Brass Inlay Perimeter ── */}
      <mesh position={[0, 0.042, 0]}>
        <boxGeometry args={[8.18, 0.008, 8.18]} />
        <meshStandardMaterial color={INLAY_COLOR} metalness={0.85} roughness={0.2} />
      </mesh>

      {/* ── 64 Handcrafted Wood Inlay Tiles ── */}
      {Array.from({ length: 64 }, (_, i) => {
        const file = i % 8
        const rank = Math.floor(i / 8)
        const sq = String.fromCharCode(97 + file) + (rank + 1)
        const isLight = (file + rank) % 2 === 1
        const x = file - 3.5
        const z = -(rank - 3.5)

        let color = isLight ? LIGHT_SQ : DARK_SQ
        let emissive = '#000000'
        let emissiveIntensity = 0

        if (sq === selectedSquare) {
          color = SELECTED_SQ
          emissive = SELECTED_SQ
          emissiveIntensity = 0.25
        } else if (lastMoveSet.has(sq)) {
          emissive = LAST_MOVE_SQ
          emissiveIntensity = 0.15
        }

        if (sq === checkSquare && isCheck) {
          emissive = CHECK_SQ
          emissiveIntensity = 0.35
        }

        return (
          <mesh
            key={sq}
            position={[x, 0.045, z]}
            receiveShadow
            onClick={(e) => { e.stopPropagation(); onSquareClick(sq) }}
          >
            {/* 0.985 tile size leaves microscopic realistic seam joints */}
            <boxGeometry args={[0.985, 0.08, 0.985]} />
            <meshStandardMaterial
              color={color}
              roughness={isLight ? 0.38 : 0.28}
              metalness={0.03}
              emissive={emissive}
              emissiveIntensity={emissiveIntensity}
            />
          </mesh>
        )
      })}

      {/* ── Mastercraft Pieces with Selection Lift ── */}
      {pieces.map((p) => (
        <Piece3D
          key={p.square}
          type={p.type}
          color={p.color}
          position={p.pos}
          isSelected={p.square === selectedSquare}
          onClick={() => onSquareClick(p.square)}
        />
      ))}

      {/* ── Legal move indicators ── */}
      <MoveIndicators
        legalMoves={legalMoves}
        selectedSquare={selectedSquare}
        fen={fen}
      />
    </group>
  )
}
