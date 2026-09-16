/**
 * NeuroMechFly 3D Model & Kinematics
 *
 * Implemented directly from the biomechanical NeuroMechFly anatomy:
 * - Head: Cranium, lateral ruby compound eyes, antennae with aristae, proboscis
 * - Thorax: Arched scutum, posterior scutellum shield, lateral halteres
 * - Abdomen: 7 distinct anatomical tergite segments with melanin/honey bands & breathing
 * - Wings: NeuroMechFly wing profile with primary veins, resting V-angle and 200 Hz flutter
 * - 6 Multi-Jointed Legs: Coxa -> Trochanter & Femur -> Tibia -> 5-part Tarsus -> Claws
 *
 * Kinematics:
 * - Tripod standing stance elevated on surface
 * - Forelimb ("hand") grooming: front legs rub together in realistic insect behavior
 * - Physical piece movement: walks/swoops to piece, grasps with forelimbs, carries to
 *   destination, sets down squarely, and grooms hands in celebration.
 */
import { useRef, useMemo, useState, useEffect } from 'react'
import { useFrame } from '@react-three/fiber'
import {
  Group,
  MeshPhysicalMaterial,
  MeshStandardMaterial,
  Vector3,
  CatmullRomCurve3,
  Shape,
  ExtrudeGeometry,
  DoubleSide,
} from 'three'
import { squareTo3D } from './MoveIndicators'
import Piece3D from './Piece3D'
import type { PieceSymbol } from '../types'

/* ─── Photorealistic NeuroMechFly PBR Materials (matched to hero screenshot) ─── */
const chitinBodyMat = new MeshPhysicalMaterial({
  color: '#df9438', // Rich golden-amber thoracic and abdominal chitin
  roughness: 0.34,
  metalness: 0.08,
  clearcoat: 0.65,
  clearcoatRoughness: 0.16,
  reflectivity: 0.75,
})

const eyeRubyMat = new MeshPhysicalMaterial({
  color: '#c51b24', // Deep faceted ruby compound eyes
  emissive: '#881318',
  emissiveIntensity: 0.28,
  roughness: 0.10,
  metalness: 0.25,
  clearcoat: 0.98,
  clearcoatRoughness: 0.05,
  reflectivity: 0.95,
})

const abdomenTergiteDarkMat = new MeshStandardMaterial({
  color: '#261c14', // dark melanin posterior tergite bands
  roughness: 0.45,
})

// Authentic Drosophila pale straw-tan leg chitin (NeuroMechFly panel b & d)
const legChitinMat = new MeshPhysicalMaterial({
  color: '#d5c6aa', // Pale natural straw-tan chitin (sampled from panel d #cfc0a3)
  roughness: 0.36,
  metalness: 0.05,
  clearcoat: 0.35,
  clearcoatRoughness: 0.18,
})

// Chitinous joint articulation condyles (Panel b red arrows)
const jointMat = new MeshStandardMaterial({
  color: '#3d2516', // Dark chitinous joint ring
  roughness: 0.45,
})

// Pretarsal claw tips (Panel b & c)
const clawMat = new MeshStandardMaterial({
  color: '#1a120c', // Dark black-brown tarsal claws
  roughness: 0.55,
})

const wingMembraneMat = new MeshPhysicalMaterial({
  color: '#dbeafe', // translucent pale membrane
  transmission: 0.92,
  opacity: 0.65,
  transparent: true,
  roughness: 0.08,
  metalness: 0.15,
  clearcoat: 0.85,
  ior: 1.48,
  side: DoubleSide,
})

const wingVeinMat = new MeshStandardMaterial({
  color: '#603813',
  roughness: 0.4,
})

// Sleek dark matte observation stage (NO gold, NO curved lines)
const platformTopMat = new MeshStandardMaterial({
  color: '#181b24', // Smooth dark graphite slate
  roughness: 0.8,
  metalness: 0.05,
})

const pedestalWoodMat = new MeshStandardMaterial({
  color: '#0a0a0a',
  roughness: 0.92,
  metalness: 0.02,
})

/* ─── NeuroMechFly Wing Shape (from panel c & g) ─── */
function createWingGeometry() {
  const s = new Shape()
  s.moveTo(0, 0)
  s.bezierCurveTo(0.12, 0.4, 0.22, 0.9, 0.20, 1.4) // anterior costal margin
  s.bezierCurveTo(0.18, 1.7, 0.10, 1.95, 0.0, 2.0)  // rounded apex
  s.bezierCurveTo(-0.12, 1.95, -0.22, 1.6, -0.24, 1.2) // posterior margin
  s.bezierCurveTo(-0.25, 0.7, -0.18, 0.3, 0, 0)      // trailing edge to base

  return new ExtrudeGeometry(s, {
    depth: 0.006,
    bevelEnabled: true,
    bevelThickness: 0.002,
    bevelSize: 0.003,
    bevelSegments: 2,
  })
}

export interface ActiveFlyMove {
  from: string
  to: string
  pieceType: PieceSymbol
  color: 'w' | 'b'
}

interface Props {
  isThinking: boolean
  activeMove: ActiveFlyMove | null
  onPiecePlaced: () => void
}

/* ═══════════════════════════════════════════════
   Multi-Jointed Anatomical Leg (Panel b & c: Coxa -> Trochanter -> Femur -> Tibia -> 5-part Tarsus -> Claws)
   ═══════════════════════════════════════════════ */
interface LegProps {
  side: 'left' | 'right'
  type: 'front' | 'middle' | 'hind'
  groupRef?: React.RefObject<Group>
}

function KinematicLeg({ side, type, groupRef }: LegProps) {
  const isLeft = side === 'left'
  const sign = isLeft ? -1 : 1

  // Anatomical NeuroMechFly leg angles with high arched knees (Panels d, e, g)
  const isFront = type === 'front'
  const isHind = type === 'hind'

  // Femur splay angles (lateral splay with knees raised above body level)
  // isFront has negative pitch (-0.42) so the leg projects FORWARD (+Z) in front of the head!
  const femurRot: [number, number, number] = isFront
    ? [-0.42, sign * 0.15, -sign * 1.12]
    : isHind
    ? [-0.40, -sign * 0.18, -sign * 1.22]
    : [0.05, sign * 0.05, -sign * 1.28]

  // Tibia descent angles (bending downwards towards the platform surface)
  const tibiaRot: [number, number, number] = isFront
    ? [0.35, 0, sign * 0.85]
    : isHind
    ? [0.45, 0, sign * 0.98]
    : [-0.05, 0, sign * 1.02]

  return (
    <group ref={groupRef}>
      {/* 1. Coxa (Basal cone segment attached to thorax) */}
      <mesh material={legChitinMat} position={[0, -0.025, 0]} rotation={[0, 0, sign * 0.2]} castShadow>
        <cylinderGeometry args={[0.020, 0.028, 0.065, 12]} />
      </mesh>

      {/* Trochanter / Hip Joint Condyle (Dark articulation ring) */}
      <mesh material={jointMat} position={[sign * 0.015, -0.065, 0]}>
        <sphereGeometry args={[0.022, 12, 12]} />
      </mesh>

      {/* 2. Femur (Muscular spindle thigh, wider in middle as in panel b) */}
      <group position={[sign * 0.015, -0.065, 0]} rotation={femurRot}>
        {/* Proximal spindle half */}
        <mesh material={legChitinMat} position={[0, -0.07, 0]} castShadow>
          <cylinderGeometry args={[0.018, 0.026, 0.14, 12]} />
        </mesh>
        {/* Distal spindle half tapering towards knee */}
        <mesh material={legChitinMat} position={[0, -0.20, 0]} castShadow>
          <cylinderGeometry args={[0.024, 0.017, 0.14, 12]} />
        </mesh>

        {/* Arched Knee Joint Condyle (Panel b: high red-arrow articulation) */}
        <mesh material={jointMat} position={[0, -0.28, 0]}>
          <sphereGeometry args={[0.022, 12, 12]} />
        </mesh>

        {/* 3. Tibia (Long slender shin with distal spurs) */}
        <group position={[0, -0.28, 0]} rotation={tibiaRot}>
          <mesh material={legChitinMat} position={[0, -0.16, 0]} castShadow>
            <cylinderGeometry args={[0.012, 0.016, 0.32, 10]} />
          </mesh>
          {/* Tibial Spurs (Spines at distal tip) */}
          <mesh material={jointMat} position={[sign * 0.008, -0.31, 0.005]} rotation={[0.2, 0, sign * 0.3]}>
            <coneGeometry args={[0.004, 0.025, 6]} />
          </mesh>

          {/* Ankle Joint Condyle */}
          <mesh material={jointMat} position={[0, -0.32, 0]}>
            <sphereGeometry args={[0.016, 10, 10]} />
          </mesh>

          {/* 4. Tarsus (5 segmented foot as highlighted by red arrows in panel b) */}
          <group position={[0, -0.32, 0]} rotation={[0.06, 0, sign * 0.22]}>
            {/* T1 - Basitarsus (Longest segment, ~40% of tarsus) */}
            <mesh material={legChitinMat} position={[0, -0.045, 0.015]} rotation={[-0.15, 0, 0]} castShadow>
              <cylinderGeometry args={[0.008, 0.011, 0.09, 8]} />
            </mesh>
            {/* T2 Segment */}
            <mesh material={legChitinMat} position={[0, -0.105, 0.035]} rotation={[-0.25, 0, 0]} castShadow>
              <cylinderGeometry args={[0.007, 0.008, 0.04, 8]} />
            </mesh>
            {/* T3-T4 Segments */}
            <mesh material={legChitinMat} position={[0, -0.145, 0.055]} rotation={[-0.35, 0, 0]} castShadow>
              <cylinderGeometry args={[0.006, 0.007, 0.045, 8]} />
            </mesh>
            {/* T5 & Pretarsal Claws resting flat on platform */}
            <group position={[0, -0.175, 0.075]}>
              <mesh material={clawMat} position={[-0.008, -0.012, 0.01]} rotation={[-0.5, -0.2, 0]}>
                <coneGeometry args={[0.008, 0.03, 8]} />
              </mesh>
              <mesh material={clawMat} position={[0.008, -0.012, 0.01]} rotation={[-0.5, 0.2, 0]}>
                <coneGeometry args={[0.008, 0.03, 8]} />
              </mesh>
            </group>
          </group>
        </group>
      </group>
    </group>
  )
}

/* ═══════════════════════════════════════════════
   Specialized Front Grooming Forelimbs (Panel k: Hands meeting at X=0 to rub together)
   ═══════════════════════════════════════════════ */
interface FrontLegProps {
  side: 'left' | 'right'
  groupRef?: React.RefObject<Group>
}

function FrontGroomingLeg({ side, groupRef }: FrontLegProps) {
  const isLeft = side === 'left'
  const sign = isLeft ? -1 : 1

  return (
    <group ref={groupRef}>
      {/* 1. Coxa (Basal anterior segment) */}
      <mesh material={legChitinMat} position={[0, -0.02, 0]} rotation={[0.2, 0, sign * 0.15]} castShadow>
        <cylinderGeometry args={[0.018, 0.025, 0.06, 12]} />
      </mesh>

      {/* Trochanter / Hip Joint Condyle */}
      <mesh material={jointMat} position={[sign * 0.01, -0.055, 0.01]}>
        <sphereGeometry args={[0.020, 12, 12]} />
      </mesh>

      {/* 2. Femur (Muscular thigh projecting forward with knee splayed outward) */}
      <group position={[sign * 0.01, -0.055, 0.01]} rotation={[-0.45, -sign * 0.10, sign * 0.45]}>
        {/* Proximal muscular spindle */}
        <mesh material={legChitinMat} position={[0, -0.065, 0]} castShadow>
          <cylinderGeometry args={[0.017, 0.024, 0.13, 12]} />
        </mesh>
        {/* Distal tapering spindle */}
        <mesh material={legChitinMat} position={[0, -0.19, 0]} castShadow>
          <cylinderGeometry args={[0.022, 0.015, 0.13, 12]} />
        </mesh>

        {/* Knee Joint Condyle (Arched outward laterally as in panels b, d, g) */}
        <mesh material={jointMat} position={[0, -0.26, 0]}>
          <sphereGeometry args={[0.020, 12, 12]} />
        </mesh>

        {/* 3. Tibia (Shin reaching inward to meet at midline) */}
        <group position={[0, -0.26, 0]} rotation={[0.20, -sign * 0.12, -sign * 0.90]}>
          <mesh material={legChitinMat} position={[0, -0.15, 0]} castShadow>
            <cylinderGeometry args={[0.012, 0.015, 0.30, 10]} />
          </mesh>
          {/* Tibial Spurs */}
          <mesh material={jointMat} position={[sign * 0.007, -0.29, 0.005]} rotation={[0.2, 0, sign * 0.3]}>
            <coneGeometry args={[0.003, 0.02, 6]} />
          </mesh>

          {/* Ankle Joint Condyle */}
          <mesh material={jointMat} position={[0, -0.30, 0]}>
            <sphereGeometry args={[0.015, 10, 10]} />
          </mesh>

          {/* 4. Tarsus & Claws (Presenting outer lateral/dorsal surface for grooming) */}
          <group position={[0, -0.30, 0]} rotation={[-0.20, sign * 0.10, -sign * 0.20]}>
            {/* T1 - Basitarsus */}
            <mesh material={legChitinMat} position={[0, -0.045, 0.015]} rotation={[-0.1, 0, 0]} castShadow>
              <cylinderGeometry args={[0.008, 0.010, 0.09, 8]} />
            </mesh>
            {/* T2-T4 */}
            <mesh material={legChitinMat} position={[0, -0.11, 0.035]} rotation={[-0.2, 0, 0]} castShadow>
              <cylinderGeometry args={[0.006, 0.007, 0.06, 8]} />
            </mesh>
            {/* T5 & Claws */}
            <group position={[0, -0.15, 0.05]}>
              <mesh material={clawMat} position={[-0.006, -0.01, 0.005]} rotation={[-0.4, -0.15, 0]}>
                <coneGeometry args={[0.007, 0.025, 8]} />
              </mesh>
              <mesh material={clawMat} position={[0.006, -0.01, 0.005]} rotation={[-0.4, 0.15, 0]}>
                <coneGeometry args={[0.007, 0.025, 8]} />
              </mesh>
            </group>
          </group>
        </group>
      </group>
    </group>
  )
}

/* ═══════════════════════════════════════════════
   Main NeuroMechFly3D Component
   ═══════════════════════════════════════════════ */
export default function Fly3D({ isThinking, activeMove, onPiecePlaced }: Props) {
  const wingGeometry = useMemo(() => createWingGeometry(), [])

  const flyRootRef = useRef<Group>(null)
  const leftFrontArmRef = useRef<Group>(null)
  const rightFrontArmRef = useRef<Group>(null)
  const leftWingRef = useRef<Group>(null)
  const rightWingRef = useRef<Group>(null)
  const abdomenRef = useRef<Group>(null)
  const headRef = useRef<Group>(null)

  // Perch Position centered directly behind the opponent's chess pieces (rank-8)
  const PERCH_POS = useMemo(() => new Vector3(0, 1.15, -5.60), [])
  const currentPos = useRef(PERCH_POS.clone())

  // Piece Holding & Flight State
  const [isHoldingPiece, setIsHoldingPiece] = useState(false)
  const isFlying = useRef(false)
  const flightProgress = useRef(0)
  const flightSpline = useRef<CatmullRomCurve3 | null>(null)
  const hasPlacedPiece = useRef(false)

  // Build Flight Spline when activeMove is triggered
  useEffect(() => {
    if (!activeMove) {
      isFlying.current = false
      setIsHoldingPiece(false)
      hasPlacedPiece.current = false
      return
    }

    const [fx, fy, fz] = squareTo3D(activeMove.from)
    const [tx, ty, tz] = squareTo3D(activeMove.to)

    // Keyframes for the flight spline swooping from behind the pieces
    const pStart = PERCH_POS.clone()
    const pLiftOff = new Vector3(fx * 0.35, 2.1, (PERCH_POS.z + fz) * 0.5)
    const pHoverFrom = new Vector3(fx, fy + 1.25, fz)
    const pGraspFrom = new Vector3(fx, fy + 0.85, fz) // touch & grab piece
    const pMidAir = new Vector3((fx + tx) * 0.5, 2.25, (fz + tz) * 0.5)
    const pHoverTo = new Vector3(tx, ty + 1.25, tz)
    const pPlaceTo = new Vector3(tx, ty + 0.85, tz) // set down piece
    const pReturnClimb = new Vector3(tx * 0.35, 2.1, (PERCH_POS.z + tz) * 0.5)
    const pPerch = PERCH_POS.clone()

    flightSpline.current = new CatmullRomCurve3([
      pStart,
      pLiftOff,
      pHoverFrom,
      pGraspFrom,
      pMidAir,
      pHoverTo,
      pPlaceTo,
      pReturnClimb,
      pPerch,
    ])

    isFlying.current = true
    flightProgress.current = 0
    hasPlacedPiece.current = false
    setIsHoldingPiece(false)
  }, [activeMove, PERCH_POS])

  useFrame((state, delta) => {
    const t = state.clock.elapsedTime

    // ── 1. HIGH FREQUENCY WING BEATS / RESTING TWITCH ──
    // Wings extend posteriorly (-Z) over the abdomen in natural V-posture
    if (leftWingRef.current && rightWingRef.current) {
      if (isFlying.current || isThinking) {
        // High frequency visual flight beat
        const flap = Math.sin(t * 85) * 0.42
        leftWingRef.current.rotation.set(-0.12, 0.42 + flap * 0.25, 0.20 + flap * 0.45)
        rightWingRef.current.rotation.set(-0.12, -0.42 - flap * 0.25, -0.20 - flap * 0.45)
      } else {
        // Resting posture: folded back over abdomen in authentic V-shape (Panel d & g)
        const twitch = Math.sin(t * 3) > 0.92 ? Math.sin(t * 35) * 0.05 : 0
        leftWingRef.current.rotation.set(-0.08, 0.20 + twitch, 0.05)
        rightWingRef.current.rotation.set(-0.08, -0.20 - twitch, -0.05)
      }
    }

    // ── 2. ABDOMEN RESPIRATORY PUMPING (Panel c & e) ──
    if (abdomenRef.current) {
      const breath = 1 + Math.sin(t * 3.5) * 0.03
      abdomenRef.current.scale.set(breath, breath, 1 + Math.sin(t * 3.5) * 0.015)
    }

    // ── 3. HEAD SACCADES & SCANNING ──
    if (headRef.current) {
      const twitch = Math.sin(t * 2) > 0.85 ? Math.sin(t * 14) * 0.08 : 0
      headRef.current.rotation.y = twitch
      headRef.current.rotation.x = Math.sin(t * 1.5) * 0.03
    }

    // ── 4. FORELEG / HAND KINEMATICS (Iconic Fly Leg-Rubbing Motion) ──
    // Front legs project forward in front of head and rub tarsi rapidly against each other
    if (leftFrontArmRef.current && rightFrontArmRef.current) {
      if (isHoldingPiece) {
        // Hands clamped firmly around the piece collar in front
        leftFrontArmRef.current.rotation.set(-0.35, 0.06, 0.20)
        rightFrontArmRef.current.rotation.set(-0.35, -0.06, -0.20)
      } else if (isFlying.current) {
        // Reaching forward during swoop towards the piece
        const reach = Math.sin(t * 10) * 0.08
        leftFrontArmRef.current.rotation.set(-0.45 + reach, 0.05, 0.15)
        rightFrontArmRef.current.rotation.set(-0.45 + reach, -0.05, -0.15)
      } else {
        // 🪰 ICONIC FLY FORELEG GROOMING (Rubbing outer lateral/dorsal surface):
        // Real flies cross forelegs and rub the outer (lateral & dorsal) surface of their legs,
        // rather than the inner medial side.
        const rubRate = t * 26 // ~4.1 Hz rapid insect grooming rhythm
        const stroke = Math.sin(rubRate) * 0.08
        const twist = Math.cos(rubRate) * 0.04

        // Periodic head & eye wipe saccade (every ~3.5s, wiping compound eyes/antennae)
        const isHeadBrush = Math.sin(t * 1.8) > 0.88
        const brushLift = isHeadBrush ? 0.12 : 0
        const brushPitch = isHeadBrush ? -0.14 : 0

        // Left foreleg crossed over to the right side, rubbing down the outer lateral/dorsal surface
        leftFrontArmRef.current.rotation.set(
          -0.18 + stroke + brushPitch,
          0.02 + twist * 0.5,
          0.05 + twist + brushLift
        )
        // Right foreleg reciprocates in anti-phase, rubbing along the outer surface of the opposite tarsus
        rightFrontArmRef.current.rotation.set(
          -0.18 - stroke + brushPitch,
          -0.02 - twist * 0.5,
          -0.05 - twist - brushLift
        )
      }
    }

    // ── 5. FLIGHT SPLINE EVALUATION & PIECE CARRYING ──
    if (isFlying.current && flightSpline.current) {
      flightProgress.current += delta * 0.44 // ~2.3s flight duration

      const prog = flightProgress.current

      // Grab piece at ~28% progress
      if (prog >= 0.28 && prog < 0.72 && !isHoldingPiece) {
        setIsHoldingPiece(true)
      }

      // Deposit piece at ~72% progress
      if (prog >= 0.72 && isHoldingPiece) {
        setIsHoldingPiece(false)
      }

      // Notify board that piece is on square
      if (prog >= 0.74 && !hasPlacedPiece.current) {
        hasPlacedPiece.current = true
        onPiecePlaced()
      }

      // Complete flight -> return to perch
      if (prog >= 1.0) {
        isFlying.current = false
        flightProgress.current = 0
        currentPos.current.copy(PERCH_POS)
        if (flyRootRef.current) {
          flyRootRef.current.position.copy(PERCH_POS)
          flyRootRef.current.rotation.set(0.12, 0, 0)
        }
        return
      }

      // Sample position and bank tangent from Catmull-Rom curve
      const pos = flightSpline.current.getPoint(prog)
      const tangent = flightSpline.current.getTangent(prog)

      currentPos.current.copy(pos)

      if (flyRootRef.current) {
        flyRootRef.current.position.copy(pos)
        flyRootRef.current.rotation.y = Math.atan2(tangent.x, tangent.z)
        flyRootRef.current.rotation.x = -tangent.y * 0.45 + 0.1
        flyRootRef.current.rotation.z = -tangent.x * 0.35
      }
    } else {
      // Perched idle directly behind the opponent pieces
      if (isThinking) {
        // Leaning forward over the pieces with buzzing wings and glowing eyes
        const hoverY = PERCH_POS.y + 0.12 + Math.sin(t * 6) * 0.03
        currentPos.current.set(PERCH_POS.x, hoverY, PERCH_POS.z + 0.15)
        if (flyRootRef.current) {
          flyRootRef.current.position.copy(currentPos.current)
          flyRootRef.current.rotation.set(0.24, Math.sin(t * 3) * 0.03, 0)
        }
      } else {
        currentPos.current.copy(PERCH_POS)
        if (flyRootRef.current) {
          const breathBob = Math.sin(t * 3) * 0.01
          flyRootRef.current.position.set(PERCH_POS.x, PERCH_POS.y + breathBob, PERCH_POS.z)
          flyRootRef.current.rotation.set(0.12, Math.sin(t * 1.5) * 0.02, 0)
        }
      }
    }
  })

  return (
    <group>
      {/* ── Dark Walnut Stand Behind Opponent Pieces ── */}
      <group position={[PERCH_POS.x, 0, PERCH_POS.z]}>
        {/* Top Platter (y top = 0.40, flush with fly claws) */}
        <mesh position={[0, 0.36, 0]} material={pedestalWoodMat} castShadow receiveShadow>
          <boxGeometry args={[2.5, 0.08, 1.4]} />
        </mesh>
        {/* Under-lip bevel moulding */}
        <mesh position={[0, 0.30, 0]} material={pedestalWoodMat} castShadow>
          <boxGeometry args={[2.2, 0.06, 1.2]} />
        </mesh>
        {/* Turned Capital Collar */}
        <mesh position={[0, 0.22, 0]} material={pedestalWoodMat} castShadow>
          <cylinderGeometry args={[0.38, 0.22, 0.12, 32]} />
        </mesh>
        {/* Central Turned Pillar / Column extending down through table */}
        <mesh position={[0, -0.65, 0]} material={pedestalWoodMat} castShadow>
          <cylinderGeometry args={[0.22, 0.28, 1.8, 32]} />
        </mesh>
        {/* Base Pedestal Ring */}
        <mesh position={[0, -1.45, 0]} material={pedestalWoodMat} receiveShadow>
          <cylinderGeometry args={[0.9, 1.15, 0.22, 32]} />
        </mesh>
      </group>

      {/* ── NeuroMechFly Anatomical 3D Model ── */}
      <group ref={flyRootRef} position={PERCH_POS.toArray()} scale={[1.40, 1.40, 1.40]}>
        {/* ════ 1. THORAX (Arched Scutum & Scutellum) ════ */}
        <group position={[0, 0.18, 0]}>
          {/* Main Dorsal Scutum */}
          <mesh material={chitinBodyMat} position={[0, 0.04, 0]} scale={[1, 0.85, 1.25]} castShadow>
            <sphereGeometry args={[0.15, 24, 24]} />
          </mesh>
          {/* Posterior Scutellum Shield */}
          <mesh material={chitinBodyMat} position={[0, 0.08, -0.14]} scale={[0.85, 0.55, 0.9]} castShadow>
            <sphereGeometry args={[0.08, 16, 16]} />
          </mesh>
          {/* Ventral Thoracic Plate */}
          <mesh material={chitinBodyMat} position={[0, -0.06, 0]} scale={[0.9, 0.6, 1.1]} castShadow>
            <sphereGeometry args={[0.12, 20, 20]} />
          </mesh>
          {/* Lateral Halteres (Balancers) */}
          <mesh position={[-0.12, 0.02, -0.12]} rotation={[0, 0, 0.6]} material={legChitinMat}>
            <cylinderGeometry args={[0.006, 0.016, 0.08, 8]} />
          </mesh>
          <mesh position={[0.12, 0.02, -0.12]} rotation={[0, 0, -0.6]} material={legChitinMat}>
            <cylinderGeometry args={[0.006, 0.016, 0.08, 8]} />
          </mesh>
        </group>

        {/* ════ 2. HEAD & COMPOUND EYES (Panel c) ════ */}
        <group ref={headRef} position={[0, 0.19, 0.22]}>
          {/* Cranium / Head Capsule */}
          <mesh material={chitinBodyMat} scale={[1.05, 0.9, 0.95]} castShadow>
            <sphereGeometry args={[0.095, 20, 20]} />
          </mesh>

          {/* Large Ruby-Red Lateral Compound Eyes */}
          {/* Left Eye */}
          <mesh
            material={eyeRubyMat}
            position={[-0.085, 0.02, 0.02]}
            scale={[1.15, 1.35, 1.15]}
            rotation={[0.1, -0.3, 0.2]}
            castShadow
          >
            <sphereGeometry args={[0.065, 24, 24]} />
          </mesh>
          {/* Right Eye */}
          <mesh
            material={eyeRubyMat}
            position={[0.085, 0.02, 0.02]}
            scale={[1.15, 1.35, 1.15]}
            rotation={[0.1, 0.3, -0.2]}
            castShadow
          >
            <sphereGeometry args={[0.065, 24, 24]} />
          </mesh>

          {/* Dorsal Ocelli (3 simple eyes triangle) */}
          <mesh material={eyeRubyMat} position={[0, 0.095, -0.01]}>
            <sphereGeometry args={[0.014, 12, 12]} />
          </mesh>

          {/* Antennae with Feathered Aristae */}
          <mesh position={[-0.025, 0.03, 0.10]} rotation={[0.4, -0.25, 0]} material={legChitinMat}>
            <cylinderGeometry args={[0.004, 0.008, 0.07, 8]} />
          </mesh>
          <mesh position={[0.025, 0.03, 0.10]} rotation={[0.4, 0.25, 0]} material={legChitinMat}>
            <cylinderGeometry args={[0.004, 0.008, 0.07, 8]} />
          </mesh>

          {/* Proboscis Mouthparts */}
          <mesh position={[0, -0.07, 0.05]} rotation={[0.45, 0, 0]} material={chitinBodyMat}>
            <cylinderGeometry args={[0.018, 0.028, 0.07, 12]} />
          </mesh>
        </group>

        {/* ════ 3. SEGMENTED ABDOMEN (7 Tergites with Melanin Bands) ════ */}
        <group ref={abdomenRef} position={[0, 0.15, -0.16]}>
          {/* Honey chitin base tapered core */}
          <mesh material={chitinBodyMat} position={[0, -0.03, -0.18]} scale={[0.85, 0.75, 1.6]} castShadow>
            <sphereGeometry args={[0.14, 24, 24]} />
          </mesh>
          {/* 7 Anatomical Tergite Rings (Dark Melanin Posterior Bands) */}
          {[-0.05, -0.12, -0.19, -0.26, -0.32, -0.37].map((zPos, idx) => (
            <mesh
              key={idx}
              material={abdomenTergiteDarkMat}
              position={[0, -0.02 - idx * 0.01, zPos]}
              rotation={[Math.PI / 2, 0, 0]}
              scale={[1 - idx * 0.09, 1, 1]}
            >
              <torusGeometry args={[0.115 - idx * 0.014, 0.016, 8, 24]} />
            </mesh>
          ))}
        </group>

        {/* ════ 4. TRANSLUCENT WINGS (NeuroMechFly Venation) ════ */}
        {/* Left Wing (Extending posteriorly -Z over abdomen, mirrored across X) */}
        <group ref={leftWingRef} position={[-0.10, 0.22, -0.06]}>
          <mesh
            geometry={wingGeometry}
            material={wingMembraneMat}
            position={[0, 0, 0]}
            rotation={[-Math.PI / 2, 0, 0]}
            scale={[-0.48, 0.48, 0.48]}
            castShadow
          />
          {/* Marginal Costal Vein */}
          <mesh
            material={wingVeinMat}
            position={[-0.08, 0.003, -0.42]}
            rotation={[-Math.PI / 2, 0, 0.08]}
          >
            <cylinderGeometry args={[0.004, 0.006, 0.85, 6]} />
          </mesh>
        </group>

        {/* Right Wing (Extending posteriorly -Z over abdomen) */}
        <group ref={rightWingRef} position={[0.10, 0.22, -0.06]}>
          <mesh
            geometry={wingGeometry}
            material={wingMembraneMat}
            position={[0, 0, 0]}
            rotation={[-Math.PI / 2, 0, 0]}
            scale={[0.48, 0.48, 0.48]}
            castShadow
          />
          {/* Marginal Costal Vein */}
          <mesh
            material={wingVeinMat}
            position={[0.08, 0.003, -0.42]}
            rotation={[-Math.PI / 2, 0, -0.08]}
          >
            <cylinderGeometry args={[0.004, 0.006, 0.85, 6]} />
          </mesh>
        </group>

        {/* ════ 5. 6 ARTICULATED KINEMATIC LEGS (Tripod Stance) ════ */}
        {/* Front Legs (Grooming hands that meet at midline X=0 and rub together) */}
        <group position={[-0.08, 0.10, 0.12]}>
          <FrontGroomingLeg side="left" groupRef={leftFrontArmRef} />
        </group>
        <group position={[0.08, 0.10, 0.12]}>
          <FrontGroomingLeg side="right" groupRef={rightFrontArmRef} />
        </group>

        {/* Middle Legs (Support stance) */}
        <group position={[-0.14, 0.10, 0.0]}>
          <KinematicLeg side="left" type="middle" />
        </group>
        <group position={[0.14, 0.10, 0.0]}>
          <KinematicLeg side="right" type="middle" />
        </group>

        {/* Hind Legs (Anchoring stance) */}
        <group position={[-0.12, 0.10, -0.12]}>
          <KinematicLeg side="left" type="hind" />
        </group>
        <group position={[0.12, 0.10, -0.12]}>
          <KinematicLeg side="right" type="hind" />
        </group>

        {/* ════ 6. PHYSICAL CHESS PIECE HELD IN FORELEGS DURING FLIGHT ════ */}
        {activeMove && isHoldingPiece && (
          <group position={[0, -0.52, 0.28]} scale={[0.85, 0.85, 0.85]}>
            <Piece3D
              type={activeMove.pieceType}
              color={activeMove.color}
              position={[0, 0, 0]}
            />
          </group>
        )}

        {/* Neural Synaptic Thinking Aura */}
        {isThinking && (
          <pointLight
            position={[0, 0.35, 0.15]}
            color="#00f0ff"
            intensity={1.6}
            distance={3.0}
          />
        )}
      </group>
    </group>
  )
}
