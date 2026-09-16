import { useRef, useEffect } from 'react'

interface Props {
  evaluation: number
  evalHistory: number[]
  isThinking: boolean
}

export default function EvalBar({ evaluation, evalHistory, isThinking }: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null)

  const label =
    evaluation >= 0
      ? `+${Math.abs(evaluation).toFixed(1)}`
      : `-${Math.abs(evaluation).toFixed(1)}`

  useEffect(() => {
    const cvs = canvasRef.current
    if (!cvs) return
    const ctx = cvs.getContext('2d')
    if (!ctx) return

    const rect = cvs.parentElement?.getBoundingClientRect()
    if (!rect) return

    const dpr = window.devicePixelRatio || 1
    cvs.width = rect.width * dpr
    cvs.height = 50 * dpr
    cvs.style.width = `${rect.width}px`
    cvs.style.height = '50px'
    ctx.scale(dpr, dpr)

    const w = rect.width
    const h = 50
    const pad = 4

    /* Clear */
    ctx.clearRect(0, 0, w, h)

    /* Draw zero line */
    const zeroY = h / 2
    ctx.strokeStyle = 'rgba(148, 163, 184, 0.15)'
    ctx.lineWidth = 1
    ctx.setLineDash([3, 3])
    ctx.beginPath()
    ctx.moveTo(pad, zeroY)
    ctx.lineTo(w - pad, zeroY)
    ctx.stroke()
    ctx.setLineDash([])

    /* Draw sparkline */
    const data = evalHistory.length > 1 ? evalHistory : [0, evaluation]
    const maxPts = 60
    const pts = data.length > maxPts ? data.slice(-maxPts) : data
    const step = (w - pad * 2) / Math.max(pts.length - 1, 1)

    ctx.beginPath()
    for (let i = 0; i < pts.length; i++) {
      const x = pad + i * step
      const clamped = Math.max(-5, Math.min(5, pts[i]))
      const y = h / 2 - (clamped / 5) * (h / 2 - pad)
      if (i === 0) ctx.moveTo(x, y)
      else ctx.lineTo(x, y)
    }
    ctx.strokeStyle = '#00f0ff'
    ctx.lineWidth = 1.5
    ctx.lineJoin = 'round'
    ctx.lineCap = 'round'
    ctx.stroke()

    /* Gradient fill under line */
    const lastX = pad + (pts.length - 1) * step
    ctx.lineTo(lastX, h)
    ctx.lineTo(pad, h)
    ctx.closePath()
    const grad = ctx.createLinearGradient(0, 0, 0, h)
    grad.addColorStop(0, 'rgba(0, 240, 255, 0.15)')
    grad.addColorStop(1, 'rgba(0, 240, 255, 0.0)')
    ctx.fillStyle = grad
    ctx.fill()

    /* End dot */
    if (pts.length > 0) {
      const endVal = Math.max(-5, Math.min(5, pts[pts.length - 1]))
      const endY = h / 2 - (endVal / 5) * (h / 2 - pad)
      ctx.beginPath()
      ctx.arc(lastX, endY, 3, 0, Math.PI * 2)
      ctx.fillStyle = '#00f0ff'
      ctx.fill()
      ctx.beginPath()
      ctx.arc(lastX, endY, 5, 0, Math.PI * 2)
      ctx.strokeStyle = 'rgba(0, 240, 255, 0.3)'
      ctx.lineWidth = 1
      ctx.stroke()
    }
  }, [evaluation, evalHistory])

  return (
    <div>
      <div className="flex items-center justify-between mb-2">
        <span className="hud-title">Evaluation Bar</span>
        <span className={`text-sm font-mono font-bold ${
          evaluation > 0.5 ? 'text-neon-green' : evaluation < -0.5 ? 'text-red-400' : 'text-amber-400'
        }`}>
          {label}
        </span>
      </div>
      <div className="relative w-full">
        <canvas ref={canvasRef} className="w-full rounded-lg" />
        {isThinking && (
          <div className="absolute inset-0 bg-cyan-400/5 animate-pulse rounded-lg" />
        )}
      </div>
    </div>
  )
}
