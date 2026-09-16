import { useRef, useEffect, useCallback, useMemo } from 'react'
import type { FlyStats } from '../types'

type BrainPhase = 'idle' | 'sensing' | 'computing' | 'deciding' | 'motor'

interface Props {
  flyStats: FlyStats | null
  isActive: boolean
  isMoving: boolean
  complexity: number
}

/* ═════════════════════════════════════════════════════════════════════
   FlyWire Whole-Brain Connectome Colors
   Vibrant rainbow cell-type palette directly matching EM reconstruction
   ═════════════════════════════════════════════════════════════════════ */
const FLYWIRE_PALETTE: [number, number, number][] = [
  [45, 205, 250],   // Cyan (Visual neuropil / medulla)
  [70, 150, 255],   // Electric Blue (Lobula plate)
  [155, 95, 255],   // Violet (Central complex CX)
  [225, 75, 240],   // Bright Magenta (Mushroom body MB)
  [255, 90, 160],   // Hot Pink (Lateral horn LH)
  [255, 135, 40],   // Vivid Orange (Antennal lobe AL)
  [255, 205, 30],   // Golden Amber (Kenyon cells)
  [45, 230, 180],   // Aquamarine (SEZ subesophageal)
  [110, 230, 80],   // Lime Green (Descending neurons DN)
  [255, 105, 75],   // Coral Red (Thoracic motor neuromeres)
  [185, 165, 255],  // Lavender (Interneurons)
  [50, 230, 245],   // Bright Aqua (Sensory afferents)
]

interface SomaNode {
  x: number
  y: number
  z: number          // 0 to 1 for 3D sorting & shading
  radius: number     // 3.5 to 7.0 px
  color: [number, number, number]
  region: 'optic_lobe' | 'central_brain' | 'vnc'
  group: 0 | 1 | 2   // 0=sensory, 1=central, 2=motor
}

interface OpticFilament {
  x1: number; y1: number
  cx: number; cy: number
  x2: number; y2: number
  color: [number, number, number]
  width: number
}

interface CableStrand {
  offset: number
  color: [number, number, number]
  width: number
}

interface ActionSpark {
  strandIdx: number
  progress: number
  speed: number
  color: [number, number, number]
}

function createRng(seed: number) {
  let s = seed
  return () => {
    s = (s * 16807 + 0) % 2147483647
    return s / 2147483647
  }
}

function getPhase(isActive: boolean, isMoving: boolean, thinkTime: number): BrainPhase {
  if (isMoving) return 'motor'
  if (!isActive) return 'idle'
  if (thinkTime < 0.35) return 'sensing'
  if (thinkTime < 0.85) return 'computing'
  return 'deciding'
}

const PHASE_WEIGHTS: Record<BrainPhase, [number, number, number]> = {
  idle:      [0.08, 0.08, 0.08],
  sensing:   [1.00, 0.30, 0.05],
  computing: [0.35, 1.00, 0.20],
  deciding:  [0.20, 0.90, 0.60],
  motor:     [0.10, 0.35, 1.00],
}

export default function BrainCanvas({ flyStats, isActive, isMoving, complexity }: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const frameRef = useRef(0)
  const tRef = useRef(0)
  const thinkStartRef = useRef(0)
  const prevActiveRef = useRef(false)

  /* ── Build Connectome Anatomy ── */
  const { somas, filaments, cables, vncTufts, opticRims } = useMemo(() => {
    const rng = createRng(777)
    const nodeList: SomaNode[] = []
    const filList: OpticFilament[] = []
    const cableList: CableStrand[] = []
    const tuftList: { x1: number; y1: number; x2: number; y2: number; color: [number, number, number] }[] = []
    const rimList: { cx: number; cy: number; rx: number; ry: number; color: [number, number, number]; angle: number }[] = []

    // ─────────────────────────────────────────────────────────────────
    // 1. LEFT OPTIC LOBE (Spherical Yarn-Mesh of Synaptic Fibers)
    // Centered at cx=0.35, cy=0.32, radius=0.20
    // ─────────────────────────────────────────────────────────────────
    const olCx = 0.35
    const olCy = 0.32
    const olR = 0.20

    // Curving filaments weaving like a ball of yarn
    for (let i = 0; i < 220; i++) {
      const a1 = rng() * Math.PI * 2
      const a2 = a1 + 1.0 + rng() * 2.2
      const r1 = (0.2 + rng() * 0.78) * olR
      const r2 = (0.2 + rng() * 0.78) * olR
      const x1 = olCx + Math.cos(a1) * r1
      const y1 = olCy + Math.sin(a1) * r1 * 1.05
      const x2 = olCx + Math.cos(a2) * r2
      const y2 = olCy + Math.sin(a2) * r2 * 1.05

      const midX = (x1 + x2) * 0.5
      const midY = (y1 + y2) * 0.5
      const bulge = (rng() - 0.5) * olR * 0.9
      const cx = midX + Math.cos(a1 + Math.PI / 2) * bulge
      const cy = midY + Math.sin(a1 + Math.PI / 2) * bulge

      const color = FLYWIRE_PALETTE[Math.floor(rng() * 6)]
      filList.push({
        x1, y1, cx, cy, x2, y2,
        color,
        width: 1.0 + rng() * 1.6,
      })
    }

    // Optical outer arc rims
    for (let i = 0; i < 18; i++) {
      rimList.push({
        cx: olCx,
        cy: olCy,
        rx: olR * (0.85 + rng() * 0.2),
        ry: olR * 1.05 * (0.85 + rng() * 0.2),
        color: FLYWIRE_PALETTE[Math.floor(rng() * 4)],
        angle: rng() * Math.PI * 2,
      })
    }

    // Surface soma beads on optic lobe
    for (let i = 0; i < 45; i++) {
      const a = rng() * Math.PI * 2
      const d = (0.5 + rng() * 0.5) * olR
      nodeList.push({
        x: olCx + Math.cos(a) * d,
        y: olCy + Math.sin(a) * d * 1.05,
        z: rng(),
        radius: 3.2 + rng() * 2.8,
        color: FLYWIRE_PALETTE[Math.floor(rng() * FLYWIRE_PALETTE.length)],
        region: 'optic_lobe',
        group: 0,
      })
    }

    // ─────────────────────────────────────────────────────────────────
    // 2. CENTRAL BRAIN / PROTOCEREBRUM (Right Massive Dome)
    // Dense mosaic of colorful soma beads: cx=0.64, cy=0.32, rx=0.22, ry=0.25
    // ─────────────────────────────────────────────────────────────────
    const cbCx = 0.64
    const cbCy = 0.32
    const cbRx = 0.22
    const cbRy = 0.25

    for (let i = 0; i < 280; i++) {
      let x = 0, y = 0
      do {
        x = cbCx + (rng() * 2 - 1) * cbRx
        y = cbCy + (rng() * 2 - 1) * cbRy
      } while (((x - cbCx) / cbRx) ** 2 + ((y - cbCy) / cbRy) ** 2 > 1)

      // Add slight organic cluster bias
      x += (rng() - 0.5) * 0.02
      y += (rng() - 0.5) * 0.02

      nodeList.push({
        x, y,
        z: rng(),
        radius: 3.4 + rng() * 3.4,
        color: FLYWIRE_PALETTE[Math.floor(rng() * FLYWIRE_PALETTE.length)],
        region: 'central_brain',
        group: 1,
      })
    }

    // ─────────────────────────────────────────────────────────────────
    // 3. CERVICAL CONNECTIVE CABLES (Sweeping Neck Streamlines)
    // Connecting brain base (0.58, 0.48) down-left to VNC (0.36, 0.66)
    // ─────────────────────────────────────────────────────────────────
    const numCables = 28
    for (let i = 0; i < numCables; i++) {
      const offset = (i / (numCables - 1) - 0.5) * 0.09
      cableList.push({
        offset,
        color: FLYWIRE_PALETTE[i % FLYWIRE_PALETTE.length],
        width: 1.4 + (1 - Math.abs(offset) / 0.045) * 1.2,
      })
    }

    // ─────────────────────────────────────────────────────────────────
    // 4. VENTRAL NERVE CORD (VNC / Thoracic Ganglia at Lower Left)
    // Segmented lobes: cx=0.34, cy=0.74, rx=0.20, ry=0.13
    // ─────────────────────────────────────────────────────────────────
    const vncCx = 0.34
    const vncCy = 0.74
    const vncRx = 0.20
    const vncRy = 0.13

    for (let i = 0; i < 150; i++) {
      let x = 0, y = 0
      do {
        x = vncCx + (rng() * 2 - 1) * vncRx
        y = vncCy + (rng() * 2 - 1) * vncRy
      } while (((x - vncCx) / vncRx) ** 2 + ((y - vncCy) / vncRy) ** 2 > 1)

      nodeList.push({
        x, y,
        z: rng(),
        radius: 3.2 + rng() * 3.2,
        color: FLYWIRE_PALETTE[Math.floor(rng() * FLYWIRE_PALETTE.length)],
        region: 'vnc',
        group: 2,
      })
    }

    // Radiating root tufts at base of VNC
    for (let i = 0; i < 40; i++) {
      const angle = Math.PI * 0.35 + rng() * Math.PI * 1.2
      const x1 = vncCx + Math.cos(angle) * vncRx * 0.85
      const y1 = vncCy + Math.sin(angle) * vncRy * 0.85
      const len = 0.035 + rng() * 0.06
      const x2 = x1 + Math.cos(angle) * len + (rng() - 0.5) * 0.02
      const y2 = y1 + Math.sin(angle) * len + (rng() - 0.5) * 0.02
      tuftList.push({
        x1, y1, x2, y2,
        color: FLYWIRE_PALETTE[Math.floor(rng() * FLYWIRE_PALETTE.length)],
      })
    }

    return {
      somas: nodeList,
      filaments: filList,
      cables: cableList,
      vncTufts: tuftList,
      opticRims: rimList,
    }
  }, [])

  /* Action potential electrical spikes traveling along cables */
  const sparks = useRef<ActionSpark[]>([])
  const groupFiring = useRef<[number, number, number]>([0.1, 0.1, 0.1])

  const draw = useCallback(() => {
    const cvs = canvasRef.current
    if (!cvs) return
    const ctx = cvs.getContext('2d')
    if (!ctx) return

    const w = cvs.width
    const h = cvs.height
    const dt = 0.016
    tRef.current += dt
    const t = tRef.current

    if (isActive && !prevActiveRef.current) thinkStartRef.current = t
    prevActiveRef.current = isActive

    const thinkTime = isActive ? t - thinkStartRef.current : 0
    const phase = getPhase(isActive, isMoving, thinkTime)
    const targetWeights = PHASE_WEIGHTS[phase]
    const cMul = 0.35 + complexity * 0.65

    /* ── Update group firing intensity ── */
    for (let g = 0; g < 3; g++) {
      let target = targetWeights[g] * cMul
      if (flyStats) {
        const keys: (keyof FlyStats)[] = ['sensory_firing', 'inter_firing', 'motor_firing']
        const raw = (flyStats[keys[g]] as number) ?? 0
        const norm = 1.0 - 1.0 / (1.0 + raw * 0.25)
        target = target * (0.6 + norm * 0.4)
      }
      if (phase !== 'idle') {
        target *= (0.8 + Math.sin(t * 3.5 + g * 2.1) * 0.2)
      }
      const rate = target > groupFiring.current[g] ? 0.14 : 0.025
      groupFiring.current[g] += (target - groupFiring.current[g]) * rate
    }

    /* ── Action potential sparks in neck cables ── */
    if (phase !== 'idle' || Math.random() < 0.15) {
      const spawnRate = (groupFiring.current[1] + groupFiring.current[2]) * 0.8
      if (Math.random() < spawnRate) {
        const strandIdx = Math.floor(Math.random() * cables.length)
        sparks.current.push({
          strandIdx,
          progress: 0,
          speed: 1.2 + Math.random() * 1.8 + groupFiring.current[2] * 2.0,
          color: cables[strandIdx].color,
        })
      }
    }
    if (sparks.current.length > 60) sparks.current = sparks.current.slice(-40)
    sparks.current = sparks.current.filter(s => {
      s.progress += s.speed * dt
      return s.progress < 1.15
    })

    /* ═════════════════════════════════════════════════════════════════
       CANVAS RENDERING
       ═════════════════════════════════════════════════════════════════ */
    // Dark background matching HUD theme
    ctx.fillStyle = '#0c1018'
    ctx.fillRect(0, 0, w, h)

    const f0 = groupFiring.current[0]
    const f1 = groupFiring.current[1]
    const f2 = groupFiring.current[2]

    // Soft organic silhouettes behind lobes
    // Optic lobe glow
    const g0 = ctx.createRadialGradient(w * 0.35, h * 0.32, 0, w * 0.35, h * 0.32, w * 0.22)
    g0.addColorStop(0, `rgba(45, 195, 245, ${0.15 + f0 * 0.25})`)
    g0.addColorStop(1, 'transparent')
    ctx.fillStyle = g0
    ctx.fillRect(0, 0, w, h)

    // Central brain glow
    const g1 = ctx.createRadialGradient(w * 0.64, h * 0.32, 0, w * 0.64, h * 0.32, w * 0.28)
    g1.addColorStop(0, `rgba(200, 80, 240, ${0.15 + f1 * 0.25})`)
    g1.addColorStop(1, 'transparent')
    ctx.fillStyle = g1
    ctx.fillRect(0, 0, w, h)

    // VNC glow
    const g2 = ctx.createRadialGradient(w * 0.34, h * 0.74, 0, w * 0.34, h * 0.74, w * 0.24)
    g2.addColorStop(0, `rgba(255, 110, 60, ${0.15 + f2 * 0.25})`)
    g2.addColorStop(1, 'transparent')
    ctx.fillStyle = g2
    ctx.fillRect(0, 0, w, h)

    // ─────────────────────────────────────────────────────────────────
    // 1. RENDER CERVICAL CONNECTIVE CABLES (Sweeping Rainbow Streamlines)
    // Sweeps from (0.58, 0.48) down-left to (0.36, 0.66)
    // ─────────────────────────────────────────────────────────────────
    for (const cable of cables) {
      const startX = (0.58 + cable.offset * 0.9) * w
      const startY = (0.47 + cable.offset * 0.4) * h
      const endX = (0.36 + cable.offset * 1.2) * w
      const endY = (0.67 + cable.offset * 0.5) * h
      const cpX = (0.50 + cable.offset * 1.0) * w
      const cpY = (0.61 + cable.offset * 0.7) * h

      const [r, g, b] = cable.color
      const alpha = 0.75 + f2 * 0.25
      ctx.beginPath()
      ctx.moveTo(startX, startY)
      ctx.quadraticCurveTo(cpX, cpY, endX, endY)
      ctx.strokeStyle = `rgba(${r}, ${g}, ${b}, ${alpha})`
      ctx.lineWidth = cable.width * (w / 300)
      ctx.stroke()
    }

    // Electrical sparks traveling down the cables
    for (const spark of sparks.current) {
      const cable = cables[spark.strandIdx]
      if (!cable) continue
      const startX = (0.58 + cable.offset * 0.9) * w
      const startY = (0.47 + cable.offset * 0.4) * h
      const endX = (0.36 + cable.offset * 1.2) * w
      const endY = (0.67 + cable.offset * 0.5) * h
      const cpX = (0.50 + cable.offset * 1.0) * w
      const cpY = (0.61 + cable.offset * 0.7) * h

      const p = Math.max(0, Math.min(1, spark.progress))
      const invP = 1 - p
      const px = invP * invP * startX + 2 * invP * p * cpX + p * p * endX
      const py = invP * invP * startY + 2 * invP * p * cpY + p * p * endY

      const [r, g, b] = spark.color
      ctx.beginPath()
      ctx.arc(px, py, 3.5, 0, Math.PI * 2)
      ctx.fillStyle = `rgba(${r}, ${g}, ${b}, 0.7)`
      ctx.fill()

      ctx.beginPath()
      ctx.arc(px, py, 1.8, 0, Math.PI * 2)
      ctx.fillStyle = '#ffffff'
      ctx.fill()
    }

    // ─────────────────────────────────────────────────────────────────
    // 2. RENDER OPTIC LOBE (Dense Interwoven Yarn Mesh)
    // ─────────────────────────────────────────────────────────────────
    const filAlpha = 0.65 + f0 * 0.35
    for (const fil of filaments) {
      const [r, g, b] = fil.color
      ctx.beginPath()
      ctx.moveTo(fil.x1 * w, fil.y1 * h)
      ctx.quadraticCurveTo(fil.cx * w, fil.cy * h, fil.x2 * w, fil.y2 * h)
      ctx.strokeStyle = `rgba(${r}, ${g}, ${b}, ${filAlpha})`
      ctx.lineWidth = fil.width * (w / 300)
      ctx.stroke()
    }

    // Outer spherical boundary rings
    for (const rim of opticRims) {
      const [r, g, b] = rim.color
      ctx.beginPath()
      ctx.ellipse(rim.cx * w, rim.cy * h, rim.rx * w, rim.ry * h, rim.angle, 0, Math.PI * 2)
      ctx.strokeStyle = `rgba(${r}, ${g}, ${b}, 0.35)`
      ctx.lineWidth = 1.0
      ctx.stroke()
    }

    // ─────────────────────────────────────────────────────────────────
    // 3. RENDER VNC PERIPHERAL NERVE ROOT TUFTS
    // ─────────────────────────────────────────────────────────────────
    for (const tuft of vncTufts) {
      const [r, g, b] = tuft.color
      ctx.beginPath()
      ctx.moveTo(tuft.x1 * w, tuft.y1 * h)
      ctx.lineTo(tuft.x2 * w, tuft.y2 * h)
      ctx.strokeStyle = `rgba(${r}, ${g}, ${b}, 0.7)`
      ctx.lineWidth = 1.4 * (w / 300)
      ctx.stroke()
    }

    // ─────────────────────────────────────────────────────────────────
    // 4. RENDER ALL SOMA (Large, Vibrant 3D-Shaded Beads)
    // Sorted by z for 3D depth layering
    // ─────────────────────────────────────────────────────────────────
    const sortedNodes = [...somas].sort((a, b) => a.z - b.z)
    const scale = w / 300

    for (const node of sortedNodes) {
      const nx = node.x * w
      const ny = node.y * h
      const gFire = groupFiring.current[node.group]
      const [r, g, b] = node.color

      // Clearly visible radius (3.0px to 6.5px in base units)
      const rSize = node.radius * scale * (0.85 + node.z * 0.3 + gFire * 0.25)

      // Active halo
      if (gFire > 0.3 && Math.sin(t * 6 + nx + ny) > 0.5) {
        ctx.beginPath()
        ctx.arc(nx, ny, rSize * 2.2, 0, Math.PI * 2)
        ctx.fillStyle = `rgba(${r}, ${g}, ${b}, 0.35)`
        ctx.fill()
      }

      // 3D Sphere Shading with Radial Specular Highlight
      const beadGrad = ctx.createRadialGradient(
        nx - rSize * 0.35,
        ny - rSize * 0.35,
        rSize * 0.1,
        nx, ny, rSize
      )
      // Bright top-left specular highlight
      beadGrad.addColorStop(0, `rgb(${Math.min(255, r + 90)}, ${Math.min(255, g + 90)}, ${Math.min(255, b + 90)})`)
      beadGrad.addColorStop(0.65, `rgb(${r}, ${g}, ${b})`)
      // Dark rim for separation
      beadGrad.addColorStop(1, `rgb(${Math.max(0, r - 70)}, ${Math.max(0, g - 70)}, ${Math.max(0, b - 70)})`)

      ctx.beginPath()
      ctx.arc(nx, ny, rSize, 0, Math.PI * 2)
      ctx.fillStyle = beadGrad
      ctx.fill()

      // Spark center when strongly firing
      if (gFire > 0.6 && Math.sin(t * 10 + nx * 2 + ny * 2) > 0.6) {
        ctx.beginPath()
        ctx.arc(nx, ny, rSize * 0.4, 0, Math.PI * 2)
        ctx.fillStyle = '#ffffff'
        ctx.fill()
      }
    }

    // ─────────────────────────────────────────────────────────────────
    // 5. HUD LABELS
    // ─────────────────────────────────────────────────────────────────
    const fs = Math.max(7, w * 0.022)
    ctx.font = `bold ${fs}px monospace`
    ctx.textBaseline = 'top'

    ctx.textAlign = 'left'
    ctx.fillStyle = f0 > 0.2 ? 'rgba(45, 205, 250, 0.95)' : 'rgba(120, 160, 200, 0.5)'
    ctx.fillText('OPTIC LOBE', w * 0.08, h * 0.08)

    ctx.textAlign = 'right'
    ctx.fillStyle = f1 > 0.2 ? 'rgba(225, 75, 240, 0.95)' : 'rgba(180, 140, 210, 0.5)'
    ctx.fillText('CENTRAL BRAIN', w * 0.92, h * 0.08)

    ctx.textAlign = 'left'
    ctx.fillStyle = f2 > 0.2 ? 'rgba(255, 135, 40, 0.95)' : 'rgba(200, 140, 100, 0.5)'
    ctx.fillText('VNC / MOTOR', w * 0.08, h * 0.88)

    // Phase Banner
    if (phase !== 'idle') {
      const phaseLabels: Record<string, string> = {
        sensing: '⚡ OPTIC SENSING',
        computing: '🧠 CONNECTOME SOLVE',
        deciding: '🎯 DESCENDING ACTION',
        motor: '🦾 VNC MOTOR KINEMATICS',
      }
      ctx.font = `bold ${Math.max(8, w * 0.025)}px monospace`
      ctx.textAlign = 'center'
      const pa = 0.7 + Math.sin(t * 5) * 0.3
      ctx.fillStyle = `rgba(230, 245, 255, ${pa})`
      ctx.fillText(phaseLabels[phase], w * 0.5, 6)
    }

    frameRef.current = requestAnimationFrame(draw)
  }, [flyStats, isActive, isMoving, complexity, somas, filaments, cables, vncTufts, opticRims])

  useEffect(() => {
    const cvs = canvasRef.current
    if (!cvs) return
    const rect = cvs.parentElement?.getBoundingClientRect()
    if (rect) {
      const dpr = window.devicePixelRatio || 1
      cvs.width = rect.width * dpr
      cvs.height = rect.width * dpr
      cvs.style.width = `${rect.width}px`
      cvs.style.height = `${rect.width}px`
    }
    frameRef.current = requestAnimationFrame(draw)
    return () => cancelAnimationFrame(frameRef.current)
  }, [draw])

  const phase = getPhase(isActive, isMoving, isActive ? tRef.current - thinkStartRef.current : 0)

  return (
    <div className="w-full">
      <canvas ref={canvasRef} className="w-full rounded" />
      <div className="flex justify-between mt-1 px-0.5 text-[8px] font-mono text-slate-500">
        <span>
          <span className="text-cyan-400">{somas.length}</span> soma
        </span>
        <span>
          <span className="text-purple-400">{cables.length + filaments.length}</span> fibers
        </span>
        <span className={
          phase === 'motor' ? 'text-red-400 font-bold'
            : phase === 'computing' ? 'text-purple-400 font-bold'
            : phase === 'sensing' ? 'text-cyan-400 font-bold'
            : 'text-slate-500'
        }>
          {phase.toUpperCase()}
        </span>
      </div>
    </div>
  )
}
