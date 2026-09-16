import { useMemo } from 'react'
import { CanvasTexture, RepeatWrapping } from 'three'
import Piece3D from './Piece3D'
import MoveIndicators, { squareTo3D } from './MoveIndicators'
import type { PieceSymbol } from '../types'

const LIGHT_SQ = '#d4be9b'
const DARK_SQ = '#3a2517'
const FRAME_COLOR = '#24150d'
const INLAY_COLOR = '#c59b27'

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

/* Offline procedural board wood grain textures */
function createBoardWoodTexture(isLight: boolean): CanvasTexture {
  const canvas = document.createElement('canvas')
  canvas.width = 256
  canvas.height = 256
  const ctx = canvas.getContext('2d')
  if (ctx) {
    const base = isLight ? '#d6c09e' : '#3c2719'
    const ringDark = isLight ? '#be9f79' : '#27170c'
    const ringLight = isLight ? '#e6d3b3' : '#4d3322'

    ctx.fillStyle = base
    ctx.fillRect(0, 0, 256, 256)

    // Vertical longitudinal grain pattern
    for (let y = 0; y < 256; y += 2) {
      const alpha = 0.12 + Math.sin(y * 0.08) * 0.06
      ctx.strokeStyle = y % 6 < 3 ? ringDark : ringLight
      ctx.globalAlpha = Math.max(0.04, Math.min(0.25, alpha))
      ctx.lineWidth = 1.2
      ctx.beginPath()
      ctx.moveTo(0, y)
      for (let x = 0; x < 256; x += 16) {
        const wave = Math.sin(x * 0.03 + y * 0.05) * 2.5
        ctx.lineTo(x, y + wave)
      }
      ctx.stroke()
    }
  }
  const tex = new CanvasTexture(canvas)
  tex.wrapS = RepeatWrapping
  tex.wrapT = RepeatWrapping
  tex.repeat.set(1, 1)
  return tex
}

const lightSquareTex = typeof document !== 'undefined' ? createBoardWoodTexture(true) : null
const darkSquareTex = typeof document !== 'undefined' ? createBoardWoodTexture(false) : null

/* Offline procedural coordinate label */
function createLabelTexture(char: string, color: string = '#cbb38d') {
  const canvas = document.createElement('canvas')
  canvas.width = 128
  canvas.height = 128
  const ctx = canvas.getContext('2d')
  if (ctx) {
    ctx.clearRect(0, 0, 128, 128)
    ctx.font = 'bold 76px "Space Grotesk", sans-serif'
    ctx.fillStyle = color
    ctx.textAlign = 'center'
    ctx.textBaseline = 'middle'
    ctx.fillText(char, 64, 64)
  }
  const tex = new CanvasTexture(canvas)
  return tex
}

function CoordLabel({ text, position }: { text: string; position: [number, number, number] }) {
  const texture = useMemo(() => createLabelTexture(text), [text])
  return (
    <mesh position={position} rotation={[-Math.PI / 2, 0, 0]}>
      <planeGeometry args={[0.34, 0.34]} />
      <meshBasicMaterial
        map={texture}
        transparent
        opacity={0.88}
        depthWrite={false}
        polygonOffset
        polygonOffsetFactor={-2}
      />
    </mesh>
  )
}

/* Neon Cyan Square Highlight Box (matching hero screenshot) */
function CyanSquareHighlight({ x, z }: { x: number; z: number }) {
  return (
    <group position={[x, 0.086, z]}>
      {/* Outer luminous border frame */}
      <mesh rotation={[-Math.PI / 2, 0, 0]}>
        <ringGeometry args={[0.43, 0.49, 4, 1, Math.PI / 4]} />
        <meshBasicMaterial color="#00f0ff" transparent opacity={0.92} depthWrite={false} />
      </mesh>
      {/* Soft inner glow */}
      <mesh rotation={[-Math.PI / 2, 0, 0]}>
        <planeGeometry args={[0.88, 0.88]} />
        <meshBasicMaterial color="#00f0ff" transparent opacity={0.22} depthWrite={false} />
      </mesh>
    </group>
  )
}

/* Glowing Neon Cyan Directional Move Arrow (matching hero screenshot) */
function CyanMoveArrow({ from, to }: { from: string; to: string }) {
  const [fx, , fz] = squareTo3D(from)
  const [tx, , tz] = squareTo3D(to)
  const dx = tx - fx
  const dz = tz - fz
  const len = Math.sqrt(dx * dx + dz * dz)
  if (len < 0.1) return null
  const angle = Math.atan2(dx, -dz)
  const cx = (fx + tx) / 2
  const cz = (fz + tz) / 2

  return (
    <group position={[cx, 0.088, cz]} rotation={[-Math.PI / 2, 0, angle]}>
      {/* Arrow shaft */}
      <mesh position={[0, -len * 0.1, 0]}>
        <planeGeometry args={[0.18, len * 0.52]} />
        <meshBasicMaterial color="#00f0ff" transparent opacity={0.85} depthWrite={false} />
      </mesh>
      {/* Arrow pointer head */}
      <mesh position={[0, len * 0.22, 0]}>
        <circleGeometry args={[0.26, 3, Math.PI / 6]} />
        <meshBasicMaterial color="#00f0ff" transparent opacity={0.95} depthWrite={false} />
      </mesh>
    </group>
  )
}

export default function Board3D({
  fen, selectedSquare, legalMoves, lastMove, isCheck, checkSquare, hiddenSquare, onSquareClick,
}: Props) {
  const pieces = useMemo(() => {
    const all = parsePieces(fen)
    if (!hiddenSquare) return all
    return all.filter((p) => p.square !== hiddenSquare)
  }, [fen, hiddenSquare])

  return (
    <group>
      {/* ── Outer Beveled Mahogany Board Frame ── */}
      <mesh position={[0, -0.04, 0]} receiveShadow castShadow>
        <boxGeometry args={[9.4, 0.16, 9.4]} />
        <meshStandardMaterial color={FRAME_COLOR} roughness={0.35} metalness={0.15} />
      </mesh>

      {/* ── Polished Brass Inlay Perimeter ── */}
      <mesh position={[0, 0.042, 0]}>
        <boxGeometry args={[8.18, 0.008, 8.18]} />
        <meshStandardMaterial color={INLAY_COLOR} metalness={0.85} roughness={0.2} />
      </mesh>

      {/* ── Board Coordinates (Offline Canvas Textures with polygonOffset) ── */}
      {/* File labels (a-h) along bottom border */}
      {Array.from({ length: 8 }, (_, i) => (
        <CoordLabel
          key={`file-${i}`}
          text={String.fromCharCode(97 + i)}
          position={[i - 3.5, 0.05, 4.38]}
        />
      ))}
      {/* Rank labels (1-8) along left border */}
      {Array.from({ length: 8 }, (_, i) => (
        <CoordLabel
          key={`rank-${i}`}
          text={String(i + 1)}
          position={[-4.38, 0.05, -(i - 3.5)]}
        />
      ))}

      {/* ── 64 Handcrafted Wooden Tiles ── */}
      {Array.from({ length: 64 }, (_, i) => {
        const file = i % 8
        const rank = Math.floor(i / 8)
        const sq = String.fromCharCode(97 + file) + (rank + 1)
        const isLight = (file + rank) % 2 === 1
        const x = file - 3.5
        const z = -(rank - 3.5)

        const baseColor = isLight ? LIGHT_SQ : DARK_SQ
        const tex = isLight ? lightSquareTex : darkSquareTex
        let emissive = '#000000'
        let emissiveIntensity = 0

        if (sq === checkSquare && isCheck) {
          emissive = '#ef4444'
          emissiveIntensity = 0.35
        }

        return (
          <mesh
            key={sq}
            position={[x, 0.045, z]}
            receiveShadow
            onClick={(e) => { e.stopPropagation(); onSquareClick(sq) }}
          >
            <boxGeometry args={[0.985, 0.08, 0.985]} />
            <meshStandardMaterial
              color={baseColor}
              map={tex}
              roughness={isLight ? 0.38 : 0.28}
              metalness={0.03}
              emissive={emissive}
              emissiveIntensity={emissiveIntensity}
            />
          </mesh>
        )
      })}

      {/* ── Neon Cyan Square Highlight Rings (Selected & Last Move) ── */}
      {selectedSquare && (() => {
        const [x, , z] = squareTo3D(selectedSquare)
        return <CyanSquareHighlight key="selected-highlight" x={x} z={z} />
      })()}

      {lastMove && (
        <>
          {(() => {
            const [fx, , fz] = squareTo3D(lastMove.from)
            return <CyanSquareHighlight key="from-highlight" x={fx} z={fz} />
          })()}
          {(() => {
            const [tx, , tz] = squareTo3D(lastMove.to)
            return <CyanSquareHighlight key="to-highlight" x={tx} z={tz} />
          })()}
          <CyanMoveArrow from={lastMove.from} to={lastMove.to} />
        </>
      )}

      {/* ── Staunton Pieces ── */}
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
