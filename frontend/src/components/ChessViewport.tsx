import { Suspense, useMemo } from 'react'
import { Canvas } from '@react-three/fiber'
import { OrbitControls } from '@react-three/drei'
import { CanvasTexture, RepeatWrapping } from 'three'
import Board3D from './Board3D'
import Fly3D, { ActiveFlyMove } from './Fly3D'

interface Props {
  fen: string
  selectedSquare: string | null
  legalMoves: string[]
  lastMove: { from: string; to: string } | null
  isThinking: boolean
  isCheck: boolean
  checkSquare: string | null
  activeFlyMove: ActiveFlyMove | null
  onPiecePlaced: () => void
  onSquareClick: (sq: string) => void
}

function createTableWoodTexture(): CanvasTexture {
  const canvas = document.createElement('canvas')
  canvas.width = 512
  canvas.height = 512
  const ctx = canvas.getContext('2d')
  if (ctx) {
    ctx.fillStyle = '#2c1e14'
    ctx.fillRect(0, 0, 512, 512)

    for (let y = 0; y < 512; y += 2.5) {
      const alpha = 0.12 + Math.sin(y * 0.05) * 0.06
      ctx.strokeStyle = y % 8 < 4 ? '#1d130c' : '#3e291b'
      ctx.globalAlpha = Math.max(0.04, Math.min(0.24, alpha))
      ctx.lineWidth = 1.5
      ctx.beginPath()
      ctx.moveTo(0, y)
      for (let x = 0; x < 512; x += 16) {
        const wave = Math.sin(x * 0.015 + y * 0.03) * 4
        ctx.lineTo(x, y + wave)
      }
      ctx.stroke()
    }
  }
  const tex = new CanvasTexture(canvas)
  tex.wrapS = RepeatWrapping
  tex.wrapT = RepeatWrapping
  tex.repeat.set(4, 4)
  return tex
}

export default function ChessViewport({
  fen, selectedSquare, legalMoves, lastMove,
  isThinking, isCheck, checkSquare, activeFlyMove, onPiecePlaced, onSquareClick,
}: Props) {
  const tableWoodTex = useMemo(() => (typeof document !== 'undefined' ? createTableWoodTexture() : null), [])

  return (
    <div className="relative w-full h-full select-none">
      <Canvas
        shadows
        camera={{ position: [0, 8.8, 8.0], fov: 37 }}
        gl={{
          antialias: true,
          alpha: false,
          powerPreference: 'high-performance',
        }}
        style={{ width: '100%', height: '100%', background: '#16191f' }}
      >
        <Suspense fallback={null}>
          {/* ── Studio Ambient & Hemisphere Fill Lighting ── */}
          <ambientLight intensity={0.65} color="#ffffff" />
          <hemisphereLight intensity={0.55} color="#e0f2fe" groundColor="#16191f" />

          {/* ── Key Light with Crisp PBR Shadow Mapping ── */}
          <directionalLight
            position={[6, 12, 6]}
            intensity={1.85}
            castShadow
            shadow-mapSize-width={2048}
            shadow-mapSize-height={2048}
            shadow-camera-left={-8}
            shadow-camera-right={8}
            shadow-camera-top={8}
            shadow-camera-bottom={-8}
            shadow-bias={-0.0001}
            color="#fff8ed"
          />

          {/* ── Specular Fill & Cool Rim Lights ── */}
          <directionalLight position={[-7, 8, -4]} intensity={0.7} color="#dbeafe" />
          <directionalLight position={[0, 6, -8]} intensity={0.55} color="#00f0ff" />
          <pointLight position={[0, 4, 0]} intensity={0.3} distance={10} color="#38bdf8" />

          {/* ── 3D Chess Board & Pieces ── */}
          <Board3D
            fen={fen}
            selectedSquare={selectedSquare}
            legalMoves={legalMoves}
            lastMove={lastMove}
            isCheck={isCheck}
            checkSquare={checkSquare}
            hiddenSquare={activeFlyMove?.from}
            onSquareClick={onSquareClick}
          />

          {/* ── Photorealistic 3D Drosophila Fly perched on left stand ── */}
          <Fly3D
            isThinking={isThinking}
            activeMove={activeFlyMove}
            onPiecePlaced={onPiecePlaced}
          />

          {/* ── Rustic Hardwood Tabletop Surface (from hero screenshot) ── */}
          <mesh position={[0, -0.32, 0]} receiveShadow>
            <boxGeometry args={[32, 0.4, 32]} />
            <meshStandardMaterial
              color="#2a1d13"
              map={tableWoodTex}
              roughness={0.75}
              metalness={0.04}
            />
          </mesh>

          {/* ── Damped Camera Orbit Controls ── */}
          <OrbitControls
            enablePan={false}
            minDistance={6.5}
            maxDistance={17}
            minPolarAngle={Math.PI / 10}
            maxPolarAngle={Math.PI / 2.35}
            enableDamping
            dampingFactor={0.06}
            target={[0, 0.4, -0.6]}
          />
        </Suspense>
      </Canvas>
    </div>
  )
}
