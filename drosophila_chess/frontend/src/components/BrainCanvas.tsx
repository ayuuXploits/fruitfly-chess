import { useRef, useEffect, useCallback } from 'react'
import type { FlyStats } from '../types'

interface Props {
  flyStats: FlyStats | null
  isActive: boolean
}

/* Region config */
const REGIONS = [
  { label: 'Optic Lobe', cx: 0.15, cy: 0.5, rx: 0.1, ry: 0.28, color: [0, 240, 255] as const, key: 'sensory_firing' as const },
  { label: 'Central Complex', cx: 0.5, cy: 0.45, rx: 0.15, ry: 0.32, color: [189, 0, 255] as const, key: 'inter_firing' as const },
  { label: 'Motor DNs', cx: 0.85, cy: 0.5, rx: 0.1, ry: 0.26, color: [0, 255, 102] as const, key: 'motor_firing' as const },
]

export default function BrainCanvas({ flyStats, isActive }: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const frameRef = useRef(0)
  const tRef = useRef(0)

  const draw = useCallback(() => {
    const cvs = canvasRef.current
    if (!cvs) return
    const ctx = cvs.getContext('2d')
    if (!ctx) return

    const w = cvs.width
    const h = cvs.height
    tRef.current += 0.02

    /* Clear */
    ctx.fillStyle = '#080c14'
    ctx.fillRect(0, 0, w, h)

    /* Draw regions */
    for (const reg of REGIONS) {
      const cx = reg.cx * w
      const cy = reg.cy * h
      const rx = reg.rx * w
      const ry = reg.ry * h
      const firing = flyStats ? (flyStats[reg.key] ?? 0) : 0
      const intensity = isActive ? 0.2 + firing * 0.6 : 0.1
      const [r, g, b] = reg.color

      /* Glow */
      const grad = ctx.createRadialGradient(cx, cy, 0, cx, cy, Math.max(rx, ry))
      grad.addColorStop(0, `rgba(${r},${g},${b},${intensity * 0.7})`)
      grad.addColorStop(0.6, `rgba(${r},${g},${b},${intensity * 0.2})`)
      grad.addColorStop(1, 'transparent')
      ctx.fillStyle = grad
      ctx.fillRect(0, 0, w, h)

      /* Ellipse border */
      ctx.beginPath()
      ctx.ellipse(cx, cy, rx, ry, 0, 0, Math.PI * 2)
      ctx.strokeStyle = `rgba(${r},${g},${b},${intensity})`
      ctx.lineWidth = 1.2
      ctx.stroke()

      /* Label */
      ctx.fillStyle = `rgba(${r},${g},${b},${Math.min(1, intensity + 0.3)})`
      ctx.font = '9px "JetBrains Mono", monospace'
      ctx.textAlign = 'center'
      ctx.fillText(reg.label, cx, cy + ry + 14)
    }

    /* Synaptic connections between regions */
    const t = tRef.current
    ctx.strokeStyle = 'rgba(100, 160, 255, 0.15)'
    ctx.lineWidth = 0.8

    for (let i = 0; i < REGIONS.length - 1; i++) {
      const a = REGIONS[i]
      const b = REGIONS[i + 1]
      const ax = a.cx * w + a.rx * w
      const ay = a.cy * h
      const bx = b.cx * w - b.rx * w
      const by = b.cy * h

      for (let j = 0; j < 5; j++) {
        const offset = (j - 2) * 8
        ctx.beginPath()
        ctx.moveTo(ax, ay + offset)
        const cpx = (ax + bx) / 2
        const cpy = ay + offset + Math.sin(t + j) * 10
        ctx.quadraticCurveTo(cpx, cpy, bx, by + offset)
        ctx.stroke()
      }
    }

    /* Pulse dot traveling along connections */
    if (isActive) {
      const progress = (Math.sin(t * 2) + 1) / 2
      for (let i = 0; i < REGIONS.length - 1; i++) {
        const a = REGIONS[i]
        const b = REGIONS[i + 1]
        const ax = a.cx * w + a.rx * w
        const bx = b.cx * w - b.rx * w
        const px = ax + (bx - ax) * progress
        const py = a.cy * h + Math.sin(t * 2) * 5

        ctx.beginPath()
        ctx.arc(px, py, 3, 0, Math.PI * 2)
        ctx.fillStyle = `rgba(0, 240, 255, ${0.5 + Math.sin(t * 4) * 0.3})`
        ctx.fill()
      }
    }

    frameRef.current = requestAnimationFrame(draw)
  }, [flyStats, isActive])

  useEffect(() => {
    const cvs = canvasRef.current
    if (!cvs) return
    /* Size canvas to container */
    const rect = cvs.parentElement?.getBoundingClientRect()
    if (rect) {
      cvs.width = rect.width * window.devicePixelRatio
      cvs.height = (rect.width * 9) / 16 * window.devicePixelRatio
      cvs.style.width = `${rect.width}px`
      cvs.style.height = `${(rect.width * 9) / 16}px`
    }
    frameRef.current = requestAnimationFrame(draw)
    return () => cancelAnimationFrame(frameRef.current)
  }, [draw])

  return (
    <div className="w-full">
      <canvas ref={canvasRef} className="w-full rounded-lg" />
    </div>
  )
}
