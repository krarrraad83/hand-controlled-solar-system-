import type { Gesture, Point2D } from './store'

export type Landmark = { x: number; y: number; z: number }

const WRIST = 0
const THUMB_TIP = 4
const INDEX_PIP = 6
const INDEX_TIP = 8
const MIDDLE_MCP = 9
const MIDDLE_PIP = 10
const MIDDLE_TIP = 12
const RING_PIP = 14
const RING_TIP = 16
const PINKY_PIP = 18
const PINKY_TIP = 20
const PALM_POINTS = [0, 5, 9, 13, 17]

function distance(a: Landmark, b: Landmark) {
  return Math.hypot(a.x - b.x, a.y - b.y, a.z - b.z)
}

function isExtended(lm: Landmark[], tip: number, pip: number) {
  return distance(lm[tip], lm[WRIST]) > distance(lm[pip], lm[WRIST]) * 1.12
}

export function classifyGesture(lm: Landmark[]): Gesture {
  const handSize = distance(lm[WRIST], lm[MIDDLE_MCP]) || 1e-6

  const index = isExtended(lm, INDEX_TIP, INDEX_PIP)
  const middle = isExtended(lm, MIDDLE_TIP, MIDDLE_PIP)
  const ring = isExtended(lm, RING_TIP, RING_PIP)
  const pinky = isExtended(lm, PINKY_TIP, PINKY_PIP)

  const pinchDistance = distance(lm[THUMB_TIP], lm[INDEX_TIP]) / handSize
  const extendedCount = [index, middle, ring, pinky].filter(Boolean).length

  if (pinchDistance < 0.28 && (middle || ring || pinky)) return 'pinch'
  if (extendedCount === 0) return 'fist'
  if (index && !middle && !ring && !pinky) return 'point'
  if (index && middle && !ring && !pinky) return 'peace'
  if (extendedCount >= 3) return 'open'
  return 'none'
}

/**
 * The hand rarely reaches the very edge of the camera frame, so the central
 * region is stretched to cover the whole screen.
 */
const MARGIN_X = 0.15
const MARGIN_Y = 0.12

function toScreen(value: number, margin: number) {
  return Math.min(1, Math.max(0, (value - margin) / (1 - margin * 2)))
}

/** Returns palm center in mirrored screen space (0..1). */
export function palmCenter(lm: Landmark[]): Point2D {
  let x = 0
  let y = 0
  for (const i of PALM_POINTS) {
    x += lm[i].x
    y += lm[i].y
  }
  return {
    x: toScreen(1 - x / PALM_POINTS.length, MARGIN_X),
    y: toScreen(y / PALM_POINTS.length, MARGIN_Y),
  }
}

/** Returns index fingertip in mirrored screen space (0..1). */
export function indexTip(lm: Landmark[]): Point2D {
  return { x: toScreen(1 - lm[INDEX_TIP].x, MARGIN_X), y: toScreen(lm[INDEX_TIP].y, MARGIN_Y) }
}
