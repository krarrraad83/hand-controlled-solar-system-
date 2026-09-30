import { Vector3 } from 'three'

export const TARGET_FPS = 60

export type Gesture = 'none' | 'open' | 'pinch' | 'fist' | 'point' | 'peace'
export type TrackingStatus = 'idle' | 'loading' | 'running' | 'error'

export type Point2D = { x: number; y: number }

/**
 * High-frequency hand data written by the tracker every frame.
 * Kept as a mutable object so 60 Hz updates never trigger React renders.
 */
export const handState = {
  detected: false,
  gesture: 'none' as Gesture,
  palm: { x: 0.5, y: 0.5 } as Point2D,
  pointer: { x: 0.5, y: 0.5 } as Point2D,
  /** Progress (0..1) of dwelling on a 3D body or holding the reset gesture. */
  dwell: 0,
  /** Progress (0..1) of dwelling on an on-screen button. */
  uiDwell: 0,
  /** True while the pointing finger is over an on-screen button. */
  overUi: false,
}

/** One-shot commands for the camera rig, consumed on the next frame. */
export const viewCommands = {
  reset: false,
}

export const mouseState = {
  hovered: null as string | null,
}

export type BodyEntry = { position: Vector3; radius: number }

export const bodyRegistry = new Map<string, BodyEntry>()

/** DOM label elements positioned each frame by the scene's label projector. */
export const labelElements = new Map<string, HTMLElement>()

export const simState = {
  time: 0,
}

export type AppState = {
  trackingStatus: TrackingStatus
  trackingError: string | null
  handDetected: boolean
  gesture: Gesture
  renderFps: number
  trackingFps: number
  hovered: string | null
  selected: string | null
  paused: boolean
  speed: number
}

const initialState: AppState = {
  trackingStatus: 'idle',
  trackingError: null,
  handDetected: false,
  gesture: 'none',
  renderFps: 0,
  trackingFps: 0,
  hovered: null,
  selected: null,
  paused: false,
  speed: 1,
}

let appState: AppState = initialState
const listeners = new Set<() => void>()

export function getAppState() {
  return appState
}

export function getServerAppState() {
  return initialState
}

export function setAppState(partial: Partial<AppState>) {
  let changed = false
  for (const key in partial) {
    const k = key as keyof AppState
    if (appState[k] !== partial[k]) {
      changed = true
      break
    }
  }
  if (!changed) return
  appState = { ...appState, ...partial }
  listeners.forEach((listener) => listener())
}

export function subscribeAppState(listener: () => void) {
  listeners.add(listener)
  return () => {
    listeners.delete(listener)
  }
}

export function isTimeFrozen() {
  return appState.paused || (handState.detected && handState.gesture === 'fist')
}
