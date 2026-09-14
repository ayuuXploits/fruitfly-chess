import { Suspense } from 'react'
import { Canvas } from '@react-three/fiber'
import { OrbitControls, Environment, ContactShadows } from '@react-three/drei'
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

export default function ChessViewport({
  fen, selectedSquare, legalMoves, lastMove,
  isThinking, isCheck, checkSquare, activeFlyMove, onPiecePlaced, onSquareClick,
}: Props) {
  return (
    <div className="relative w-full h-full select-none">
      <Canvas
        shadows
        camera={{ position: [0, 8.4, 7.4], fov: 39 }}
        gl={{
          antialias: true,
          alpha: false,
          powerPreference: 'high-performance',
        }}
        style={{ background: '#0a0e17' }}
      >
        <Suspense fallback={null}>
          {/* ── Ambient Studio Baseline ── */}
          <ambientLight intensity={0.55} />

          {/* ── Key Light (Warm Sun / Studio Spot) ── */}
          <directionalLight
            position={[6, 12, 6]}
            intensity={1.8}
            castShadow
            shadow-mapSize-width={2048}
            shadow-mapSize-height={2048}
            shadow-camera-left={-7}
            shadow-camera-right={7}
            shadow-camera-top={7}
            shadow-camera-bottom={-7}
            shadow-bias={-0.0005}
            color="#fff8ed"
          />

          {/* ── Soft Fill Light (Cool Diffuse) ── */}
          <directionalLight position={[-6, 7, -4]} intensity={0.65} color="#dbeafe" />

          {/* ── Back / Rim Light for Specular Edges ── */}
          <directionalLight position={[0, 6, -8]} intensity={0.5} color="#00f0ff" />

          {/* ── Center subtle accent ── */}
          <pointLight position={[0, 4, 0]} intensity={0.25} distance={10} color="#38bdf8" />

          {/* ── HDRI Environment Reflections for Glossy Finishes ── */}
          <Environment preset="city" />

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

          {/* ── Photorealistic 3D Drosophila Fly Moving Pieces by Hand ── */}
          <Fly3D
            isThinking={isThinking}
            activeMove={activeFlyMove}
            onPiecePlaced={onPiecePlaced}
          />

          {/* ── Soft Contact Ambient Occlusion Shadows ── */}
          <ContactShadows
            position={[0, -0.041, 0]}
            opacity={0.8}
            scale={14}
            blur={1.6}
            far={5}
            resolution={1024}
            color="#000000"
          />

          {/* ── Studio Floor Plane ── */}
          <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.045, 0]} receiveShadow>
            <planeGeometry args={[30, 30]} />
            <meshStandardMaterial color="#080c14" roughness={0.95} metalness={0.05} />
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
            target={[0, 0.4, -0.5]}
          />
        </Suspense>
      </Canvas>

      {/* Thinking overlay */}
      {isThinking && (
        <div className="absolute top-4 left-1/2 -translate-x-1/2 pointer-events-none z-10">
          <div className="glass-card px-4 py-2 flex items-center gap-2.5 text-xs text-cyan-400 border border-cyan-500/30 shadow-[0_0_20px_rgba(0,240,255,0.2)]">
            <span className="text-base animate-pulse">🪰</span>
            <span className="font-semibold tracking-wide">Drosophila is calculating move</span>
            <span className="flex gap-1">
              <span className="thinking-dot text-sm">•</span>
              <span className="thinking-dot text-sm">•</span>
              <span className="thinking-dot text-sm">•</span>
            </span>
          </div>
        </div>
      )}
    </div>
  )
}
