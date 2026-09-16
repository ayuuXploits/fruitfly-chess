import type { ReactNode } from 'react'

interface Props {
  /** Full-viewport 3D canvas — base layer */
  canvas: ReactNode
  /** Top-left overlays: player card + connectome */
  topLeft: ReactNode
  /** Top-right overlays: brand + controls */
  topRight: ReactNode
  /** Right-side panel stack: move history, eval, game state */
  rightPanels: ReactNode
  /** Bottom-left: opponent card */
  bottomLeft: ReactNode
  /** Bottom-right: action buttons */
  bottomRight: ReactNode
  /** Center top: thinking indicator */
  centerTop?: ReactNode
}

export default function Layout({
  canvas, topLeft, topRight, rightPanels,
  bottomLeft, bottomRight, centerTop,
}: Props) {
  return (
    <div className="relative h-screen w-screen bg-[#16191f] overflow-hidden">
      {/* ── Base layer: 3D Canvas ── */}
      <div className="absolute inset-0 z-0">
        {canvas}
      </div>

      {/* ── HUD Overlay layer ── */}
      <div className="hud-overlay flex flex-col justify-between p-3">
        {/* ── Top Row ── */}
        <div className="flex justify-between items-start">
          {/* Top-Left: Player card + Connectome */}
          <div className="flex flex-col gap-2 pointer-events-auto">
            {topLeft}
          </div>

          {/* Top-Right: Brand + Controls + Right Panels stacked below */}
          <div className="flex flex-col items-end gap-2 pointer-events-auto max-h-[calc(100vh-80px)] overflow-y-auto scrollbar-hide">
            {topRight}
            {rightPanels}
          </div>
        </div>

        {/* ── Center (thinking indicator) ── */}
        {centerTop && (
          <div className="absolute top-16 left-1/2 -translate-x-1/2 pointer-events-auto z-20">
            {centerTop}
          </div>
        )}

        {/* ── Bottom Row ── */}
        <div className="flex justify-between items-end">
          {/* Bottom-Left: Opponent card */}
          <div className="pointer-events-auto">
            {bottomLeft}
          </div>

          {/* Bottom-Right: Action buttons */}
          <div className="pointer-events-auto">
            {bottomRight}
          </div>
        </div>
      </div>
    </div>
  )
}
