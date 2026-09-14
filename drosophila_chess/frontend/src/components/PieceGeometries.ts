/**
 * Chess piece geometry helpers.
 * Knight uses ExtrudeGeometry from a high-detail Staunton horse-head silhouette.
 */
import { Shape, ExtrudeGeometry, BufferGeometry } from 'three'

let _knightGeo: BufferGeometry | null = null

/**
 * Creates a noble Staunton horse-head ExtrudeGeometry with sculpted mane,
 * alert ears, curved jaw, and smooth beveled chamfers.
 */
export function getKnightGeometry(): BufferGeometry {
  if (_knightGeo) return _knightGeo

  const s = new Shape()

  // 1. Bottom mounting base (sits flush on the pedestal collar)
  s.moveTo(-0.16, 0)
  s.lineTo(0.16, 0)
  s.lineTo(0.16, 0.04)

  // 2. Back of neck ascending into first mane crest
  s.quadraticCurveTo(0.14, 0.12, 0.12, 0.20)
  // Mane notch 1
  s.quadraticCurveTo(0.14, 0.23, 0.15, 0.27)
  s.lineTo(0.11, 0.29)
  // Mane notch 2
  s.quadraticCurveTo(0.13, 0.33, 0.14, 0.38)
  s.lineTo(0.09, 0.40)
  // Mane crest 3 into back of head
  s.quadraticCurveTo(0.11, 0.45, 0.11, 0.50)

  // 3. Alert Ear
  s.lineTo(0.07, 0.60) // ear tip
  s.lineTo(0.03, 0.53) // ear base

  // 4. Forehead curve
  s.quadraticCurveTo(-0.01, 0.51, -0.06, 0.48)
  s.quadraticCurveTo(-0.10, 0.47, -0.15, 0.44) // muzzle bridge

  // 5. Muzzle & Nostril
  s.lineTo(-0.18, 0.40) // nose tip
  s.lineTo(-0.19, 0.36) // upper lip
  s.lineTo(-0.16, 0.34) // mouth indent
  s.lineTo(-0.17, 0.32) // lower lip

  // 6. Chin & Jaw
  s.quadraticCurveTo(-0.13, 0.30, -0.10, 0.24) // prominent jaw curve
  s.quadraticCurveTo(-0.09, 0.16, -0.12, 0.09) // throat

  // 7. Chest down to base
  s.quadraticCurveTo(-0.15, 0.05, -0.16, 0.04)
  s.lineTo(-0.16, 0)

  _knightGeo = new ExtrudeGeometry(s, {
    depth: 0.19,
    bevelEnabled: true,
    bevelThickness: 0.024,
    bevelSize: 0.022,
    bevelSegments: 5,
  })

  // Center horizontally along Z
  _knightGeo.translate(0, 0, -0.095)
  _knightGeo.computeVertexNormals()

  return _knightGeo
}
