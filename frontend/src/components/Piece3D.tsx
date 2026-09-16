/**
 * 3D Chess Pieces — Mastercraft Staunton-style composite geometry.
 *
 * Utilizes MeshPhysicalMaterial with high clearcoat, roughness tuning,
 * realistic felt base pads, accurate tournament proportions,
 * and dynamic selection lift animations.
 */
import { useRef, useState, useMemo } from 'react'
import { useFrame } from '@react-three/fiber'
import { MeshPhysicalMaterial, MeshStandardMaterial, Group, CanvasTexture, RepeatWrapping } from 'three'
import { getKnightGeometry } from './PieceGeometries'
import type { PieceSymbol } from '../types'

/* ─── Procedural Turned-Wood Grain Textures ─── */
function createPieceWoodTexture(isWhite: boolean): CanvasTexture {
  const canvas = document.createElement('canvas')
  canvas.width = 512
  canvas.height = 512
  const ctx = canvas.getContext('2d')
  if (ctx) {
    const base = isWhite ? '#e6d3b8' : '#2b1a10'
    const darkRing = isWhite ? '#caa67c' : '#1a0e07'
    const lightRing = isWhite ? '#f4e5cf' : '#3e2618'

    ctx.fillStyle = base
    ctx.fillRect(0, 0, 512, 512)

    // Turned wood grain lines
    for (let y = 0; y < 512; y += 1.8) {
      const alpha = 0.14 + Math.sin(y * 0.12) * 0.08
      ctx.strokeStyle = y % 6 < 3 ? darkRing : lightRing
      ctx.globalAlpha = Math.max(0.04, Math.min(0.3, alpha))
      ctx.lineWidth = 1.0 + (y % 4 === 0 ? 0.7 : 0)
      ctx.beginPath()
      ctx.moveTo(0, y)
      for (let x = 0; x < 512; x += 16) {
        const wave = Math.sin(x * 0.02 + y * 0.04) * 3 + Math.sin(x * 0.06) * 1.5
        ctx.lineTo(x, y + wave)
      }
      ctx.stroke()
    }

    // Fine wood pores
    ctx.globalAlpha = 0.035
    ctx.fillStyle = isWhite ? '#7d5c38' : '#000000'
    for (let i = 0; i < 400; i++) {
      const rx = Math.random() * 512
      const ry = Math.random() * 512
      ctx.fillRect(rx, ry, 1.2, 3 + Math.random() * 4)
    }
  }

  const tex = new CanvasTexture(canvas)
  tex.wrapS = RepeatWrapping
  tex.wrapT = RepeatWrapping
  tex.repeat.set(1, 2)
  return tex
}

const whiteWoodTex = typeof document !== 'undefined' ? createPieceWoodTexture(true) : null
const blackWoodTex = typeof document !== 'undefined' ? createPieceWoodTexture(false) : null

/* ─── Handcrafted Turned-Wood PBR Materials ─── */
const whiteMat = new MeshPhysicalMaterial({
  color: '#edd7bd',
  map: whiteWoodTex,
  roughness: 0.32,
  metalness: 0.02,
  clearcoat: 0.45,
  clearcoatRoughness: 0.22,
  reflectivity: 0.65,
})

const blackMat = new MeshPhysicalMaterial({
  color: '#342217',
  map: blackWoodTex,
  roughness: 0.28,
  metalness: 0.04,
  clearcoat: 0.48,
  clearcoatRoughness: 0.18,
  reflectivity: 0.7,
})

const feltMat = new MeshStandardMaterial({
  color: '#1a3b22',
  roughness: 0.95,
  metalness: 0.0,
})

function getPieceMaterial(c: 'w' | 'b') {
  return c === 'w' ? whiteMat : blackMat
}

interface Props {
  type: PieceSymbol
  color: 'w' | 'b'
  position: [number, number, number]
  isSelected?: boolean
  onClick?: () => void
}

/* ═══════════════════════════════════════════════
   PAWN  (h ≈ 0.48 * 1.5 = 0.72)
   ═══════════════════════════════════════════════ */
function PawnMesh({ m }: { m: MeshPhysicalMaterial }) {
  return (
    <group>
      {/* Felt base bottom */}
      <mesh material={feltMat} position={[0, 0.005, 0]}>
        <cylinderGeometry args={[0.185, 0.185, 0.01, 32]} />
      </mesh>
      {/* Stepped Pedestal Base */}
      <mesh material={m} position={[0, 0.025, 0]} castShadow receiveShadow>
        <cylinderGeometry args={[0.18, 0.195, 0.04, 32]} />
      </mesh>
      <mesh material={m} position={[0, 0.05, 0]} rotation={[Math.PI / 2, 0, 0]}>
        <torusGeometry args={[0.18, 0.014, 12, 32]} />
      </mesh>
      {/* Scotia pedestal curve */}
      <mesh material={m} position={[0, 0.09, 0]} castShadow>
        <cylinderGeometry args={[0.08, 0.155, 0.08, 28]} />
      </mesh>
      {/* Column Stem */}
      <mesh material={m} position={[0, 0.22, 0]} castShadow>
        <cylinderGeometry args={[0.055, 0.078, 0.18, 24]} />
      </mesh>
      {/* Astragal Neck Collar */}
      <mesh material={m} position={[0, 0.31, 0]} rotation={[Math.PI / 2, 0, 0]}>
        <torusGeometry args={[0.065, 0.012, 10, 24]} />
      </mesh>
      <mesh material={m} position={[0, 0.33, 0]} castShadow>
        <cylinderGeometry args={[0.048, 0.065, 0.04, 20]} />
      </mesh>
      {/* Head Sphere */}
      <mesh material={m} position={[0, 0.41, 0]} castShadow>
        <sphereGeometry args={[0.075, 28, 28]} />
      </mesh>
    </group>
  )
}

/* ═══════════════════════════════════════════════
   ROOK (Castle) (h ≈ 0.60 * 1.5 = 0.90)
   ═══════════════════════════════════════════════ */
function RookMesh({ m }: { m: MeshPhysicalMaterial }) {
  return (
    <group>
      {/* Felt base */}
      <mesh material={feltMat} position={[0, 0.005, 0]}>
        <cylinderGeometry args={[0.21, 0.21, 0.01, 32]} />
      </mesh>
      {/* Stepped Pedestal */}
      <mesh material={m} position={[0, 0.025, 0]} castShadow receiveShadow>
        <cylinderGeometry args={[0.20, 0.22, 0.04, 32]} />
      </mesh>
      <mesh material={m} position={[0, 0.05, 0]} rotation={[Math.PI / 2, 0, 0]}>
        <torusGeometry args={[0.20, 0.015, 12, 32]} />
      </mesh>
      <mesh material={m} position={[0, 0.09, 0]} castShadow>
        <cylinderGeometry args={[0.125, 0.175, 0.08, 28]} />
      </mesh>
      {/* Tower Stem */}
      <mesh material={m} position={[0, 0.26, 0]} castShadow>
        <cylinderGeometry args={[0.11, 0.125, 0.26, 28]} />
      </mesh>
      {/* Cornice Collar */}
      <mesh material={m} position={[0, 0.40, 0]} rotation={[Math.PI / 2, 0, 0]}>
        <torusGeometry args={[0.125, 0.015, 12, 32]} />
      </mesh>
      {/* Parapet Platform */}
      <mesh material={m} position={[0, 0.43, 0]} castShadow>
        <cylinderGeometry args={[0.145, 0.13, 0.05, 32]} />
      </mesh>
      {/* Hollow Interior Center */}
      <mesh material={m} position={[0, 0.46, 0]}>
        <cylinderGeometry args={[0.075, 0.075, 0.06, 24]} />
      </mesh>
      {/* 4 Crenellations (Merlons) */}
      {Array.from({ length: 4 }, (_, i) => {
        const θ = (i / 4) * Math.PI * 2 + Math.PI / 4
        return (
          <mesh
            key={i}
            material={m}
            position={[Math.cos(θ) * 0.105, 0.49, Math.sin(θ) * 0.105]}
            rotation={[0, -θ, 0]}
            castShadow
          >
            <boxGeometry args={[0.065, 0.07, 0.055]} />
          </mesh>
        )
      })}
    </group>
  )
}

/* ═══════════════════════════════════════════════
   KNIGHT (Steed) (h ≈ 0.65 * 1.5 = 0.98)
   ═══════════════════════════════════════════════ */
function KnightMesh({ m, color }: { m: MeshPhysicalMaterial; color: 'w' | 'b' }) {
  const knightGeo = useMemo(() => getKnightGeometry(), [])
  // White faces towards black (-Z), Black faces towards white (+Z)
  const faceAngle = color === 'w' ? -Math.PI / 2 : Math.PI / 2

  return (
    <group>
      {/* Felt base */}
      <mesh material={feltMat} position={[0, 0.005, 0]}>
        <cylinderGeometry args={[0.20, 0.20, 0.01, 32]} />
      </mesh>
      {/* Pedestal Base */}
      <mesh material={m} position={[0, 0.025, 0]} castShadow receiveShadow>
        <cylinderGeometry args={[0.19, 0.21, 0.04, 32]} />
      </mesh>
      <mesh material={m} position={[0, 0.05, 0]} rotation={[Math.PI / 2, 0, 0]}>
        <torusGeometry args={[0.19, 0.015, 12, 32]} />
      </mesh>
      {/* Mounting Collar */}
      <mesh material={m} position={[0, 0.08, 0]} castShadow>
        <cylinderGeometry args={[0.13, 0.17, 0.06, 28]} />
      </mesh>
      {/* Sculpted Staunton Horse Head */}
      <mesh
        material={m}
        geometry={knightGeo}
        position={[0, 0.08, 0]}
        rotation={[0, faceAngle, 0]}
        scale={[1.15, 1.15, 1.15]}
        castShadow
      />
    </group>
  )
}

/* ═══════════════════════════════════════════════
   BISHOP (Mitre) (h ≈ 0.75 * 1.5 = 1.12)
   ═══════════════════════════════════════════════ */
function BishopMesh({ m }: { m: MeshPhysicalMaterial }) {
  return (
    <group>
      {/* Felt base */}
      <mesh material={feltMat} position={[0, 0.005, 0]}>
        <cylinderGeometry args={[0.20, 0.20, 0.01, 32]} />
      </mesh>
      {/* Stepped Pedestal Base */}
      <mesh material={m} position={[0, 0.025, 0]} castShadow receiveShadow>
        <cylinderGeometry args={[0.19, 0.21, 0.04, 32]} />
      </mesh>
      <mesh material={m} position={[0, 0.05, 0]} rotation={[Math.PI / 2, 0, 0]}>
        <torusGeometry args={[0.19, 0.015, 12, 32]} />
      </mesh>
      <mesh material={m} position={[0, 0.09, 0]} castShadow>
        <cylinderGeometry args={[0.09, 0.16, 0.08, 28]} />
      </mesh>
      {/* Stem */}
      <mesh material={m} position={[0, 0.24, 0]} castShadow>
        <cylinderGeometry args={[0.055, 0.085, 0.22, 24]} />
      </mesh>
      {/* Mid Astragal Collar */}
      <mesh material={m} position={[0, 0.35, 0]} rotation={[Math.PI / 2, 0, 0]}>
        <torusGeometry args={[0.065, 0.012, 10, 24]} />
      </mesh>
      <mesh material={m} position={[0, 0.38, 0]} castShadow>
        <cylinderGeometry args={[0.045, 0.06, 0.06, 20]} />
      </mesh>
      {/* Mitre Body (Elongated teardrop egg) */}
      <mesh material={m} position={[0, 0.50, 0]} scale={[1, 1.45, 1]} castShadow>
        <sphereGeometry args={[0.075, 28, 28]} />
      </mesh>
      {/* Mitre Cut (Cross slit) */}
      <mesh material={feltMat} position={[0, 0.53, 0]} rotation={[0, 0, 0.45]}>
        <boxGeometry args={[0.13, 0.008, 0.04]} />
      </mesh>
      {/* Finial Ball */}
      <mesh material={m} position={[0, 0.62, 0]} castShadow>
        <sphereGeometry args={[0.025, 20, 20]} />
      </mesh>
    </group>
  )
}

/* ═══════════════════════════════════════════════
   QUEEN (Coronet) (h ≈ 0.85 * 1.5 = 1.28)
   ═══════════════════════════════════════════════ */
function QueenMesh({ m }: { m: MeshPhysicalMaterial }) {
  return (
    <group>
      {/* Felt base */}
      <mesh material={feltMat} position={[0, 0.005, 0]}>
        <cylinderGeometry args={[0.22, 0.22, 0.01, 32]} />
      </mesh>
      {/* Stepped Pedestal Base */}
      <mesh material={m} position={[0, 0.025, 0]} castShadow receiveShadow>
        <cylinderGeometry args={[0.21, 0.23, 0.04, 32]} />
      </mesh>
      <mesh material={m} position={[0, 0.05, 0]} rotation={[Math.PI / 2, 0, 0]}>
        <torusGeometry args={[0.21, 0.016, 12, 32]} />
      </mesh>
      <mesh material={m} position={[0, 0.10, 0]} castShadow>
        <cylinderGeometry args={[0.10, 0.18, 0.10, 28]} />
      </mesh>
      {/* Graceful Fluted Stem */}
      <mesh material={m} position={[0, 0.31, 0]} castShadow>
        <cylinderGeometry args={[0.055, 0.095, 0.32, 28]} />
      </mesh>
      {/* Upper Collar */}
      <mesh material={m} position={[0, 0.48, 0]} rotation={[Math.PI / 2, 0, 0]}>
        <torusGeometry args={[0.068, 0.014, 10, 28]} />
      </mesh>
      {/* Flared Crown Calyx */}
      <mesh material={m} position={[0, 0.54, 0]} castShadow>
        <cylinderGeometry args={[0.095, 0.06, 0.10, 28]} />
      </mesh>
      {/* Crown Rim Torus */}
      <mesh material={m} position={[0, 0.59, 0]} rotation={[Math.PI / 2, 0, 0]}>
        <torusGeometry args={[0.095, 0.012, 10, 28]} />
      </mesh>
      {/* 8 Pearl Coronet Points */}
      {Array.from({ length: 8 }, (_, i) => {
        const θ = (i / 8) * Math.PI * 2
        return (
          <mesh
            key={i}
            material={m}
            position={[Math.cos(θ) * 0.082, 0.62, Math.sin(θ) * 0.082]}
            castShadow
          >
            <sphereGeometry args={[0.022, 16, 16]} />
          </mesh>
        )
      })}
      {/* Royal Crown Orb */}
      <mesh material={m} position={[0, 0.66, 0]} castShadow>
        <sphereGeometry args={[0.032, 20, 20]} />
      </mesh>
    </group>
  )
}

/* ═══════════════════════════════════════════════
   KING (Cross Pattée) (h ≈ 0.95 * 1.5 = 1.42)
   ═══════════════════════════════════════════════ */
function KingMesh({ m }: { m: MeshPhysicalMaterial }) {
  return (
    <group>
      {/* Felt base */}
      <mesh material={feltMat} position={[0, 0.005, 0]}>
        <cylinderGeometry args={[0.23, 0.23, 0.01, 32]} />
      </mesh>
      {/* Heavy Pedestal Base */}
      <mesh material={m} position={[0, 0.025, 0]} castShadow receiveShadow>
        <cylinderGeometry args={[0.22, 0.24, 0.04, 32]} />
      </mesh>
      <mesh material={m} position={[0, 0.05, 0]} rotation={[Math.PI / 2, 0, 0]}>
        <torusGeometry args={[0.22, 0.016, 12, 32]} />
      </mesh>
      <mesh material={m} position={[0, 0.10, 0]} castShadow>
        <cylinderGeometry args={[0.11, 0.19, 0.10, 28]} />
      </mesh>
      {/* Regal Column Stem */}
      <mesh material={m} position={[0, 0.35, 0]} castShadow>
        <cylinderGeometry args={[0.06, 0.105, 0.40, 28]} />
      </mesh>
      {/* Astragal Collar */}
      <mesh material={m} position={[0, 0.56, 0]} rotation={[Math.PI / 2, 0, 0]}>
        <torusGeometry args={[0.075, 0.014, 10, 28]} />
      </mesh>
      {/* Crown Calyx */}
      <mesh material={m} position={[0, 0.62, 0]} castShadow>
        <cylinderGeometry args={[0.105, 0.07, 0.10, 28]} />
      </mesh>
      {/* Crown Ring */}
      <mesh material={m} position={[0, 0.67, 0]} rotation={[Math.PI / 2, 0, 0]}>
        <torusGeometry args={[0.105, 0.014, 10, 28]} />
      </mesh>
      {/* Cross Finial Pad */}
      <mesh material={m} position={[0, 0.70, 0]} castShadow>
        <cylinderGeometry args={[0.045, 0.08, 0.04, 20]} />
      </mesh>
      {/* 3D Latin Cross */}
      {/* Vertical Mast */}
      <mesh material={m} position={[0, 0.79, 0]} castShadow>
        <boxGeometry args={[0.032, 0.15, 0.032]} />
      </mesh>
      {/* Horizontal Crossbar */}
      <mesh material={m} position={[0, 0.81, 0]} castShadow>
        <boxGeometry args={[0.105, 0.032, 0.032]} />
      </mesh>
    </group>
  )
}

/* ═══════════════════════════════════════════════
   Main Piece3D Component
   ═══════════════════════════════════════════════ */
const PIECE_MAP: Record<PieceSymbol, React.FC<{ m: MeshPhysicalMaterial; color: 'w' | 'b' }>> = {
  p: ({ m }) => <PawnMesh m={m} />,
  r: ({ m }) => <RookMesh m={m} />,
  n: ({ m, color }) => <KnightMesh m={m} color={color} />,
  b: ({ m }) => <BishopMesh m={m} />,
  q: ({ m }) => <QueenMesh m={m} />,
  k: ({ m }) => <KingMesh m={m} />,
}

export default function Piece3D({ type, color, position, isSelected, onClick }: Props) {
  const groupRef = useRef<Group>(null)
  const [hovered, setHovered] = useState(false)
  const m = getPieceMaterial(color)

  /* Smooth lift & hover animations */
  useFrame((state) => {
    if (!groupRef.current) return
    let targetY = position[1]

    if (isSelected) {
      // Picked up piece floats up and bobs slightly
      const bob = Math.sin(state.clock.elapsedTime * 4) * 0.03
      targetY = position[1] + 0.35 + bob
    } else if (hovered) {
      targetY = position[1] + 0.08
    }

    // Spring damping
    groupRef.current.position.y += (targetY - groupRef.current.position.y) * 0.15
  })

  const Mesh = PIECE_MAP[type]

  return (
    <group
      ref={groupRef}
      position={position}
      scale={[1.5, 1.5, 1.5]}
      onClick={(e) => {
        e.stopPropagation()
        onClick?.()
      }}
      onPointerOver={(e) => {
        e.stopPropagation()
        setHovered(true)
        document.body.style.cursor = 'pointer'
      }}
      onPointerOut={() => {
        setHovered(false)
        document.body.style.cursor = 'auto'
      }}
    >
      <Mesh m={m} color={color} />
      {/* Subtle selection ring under lifted piece */}
      {isSelected && (
        <pointLight
          position={[0, 0.4, 0]}
          intensity={0.8}
          distance={1.5}
          color="#00f0ff"
        />
      )}
    </group>
  )
}
