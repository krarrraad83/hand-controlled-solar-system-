'use client'

import { useMemo, useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import { PerspectiveCamera, Vector3 } from 'three'
import { SUN } from '@/lib/planets'
import { bodyRegistry, getAppState, handState, mouseState, setAppState, viewCommands } from '@/lib/store'

const DWELL_MS = 900
const RESET_HOLD_MS = 700
const MIN_HIT_RADIUS = 34

/**
 * Turns hand gestures into scene actions:
 * - point: finds the body under the finger and selects it after a short dwell
 * - peace: held briefly, returns to the full solar-system overview
 */
export function HandInteraction() {
  const projected = useMemo(() => new Vector3(), [])
  const toCamera = useMemo(() => new Vector3(), [])
  const dwell = useRef<{ target: string | null; start: number }>({ target: null, start: 0 })
  const reset = useRef({ active: false, start: 0, fired: false })

  useFrame(({ camera, size }) => {
    const pointing = handState.detected && handState.gesture === 'point' && !handState.overUi
    let hovered: string | null = handState.detected ? null : mouseState.hovered

    if (pointing) {
      const px = handState.pointer.x * size.width
      const py = handState.pointer.y * size.height
      const fov = camera instanceof PerspectiveCamera ? camera.fov : 50
      const focalPx = size.height / (2 * Math.tan((fov * Math.PI) / 360))
      let bestScore = Infinity

      for (const [name, body] of bodyRegistry) {
        projected.copy(body.position).project(camera)
        if (projected.z > 1) continue
        const sx = ((projected.x + 1) / 2) * size.width
        const sy = ((1 - projected.y) / 2) * size.height
        const depth = toCamera.copy(body.position).sub(camera.position).length()
        const radiusPx = (body.radius / depth) * focalPx
        const hitRadius = Math.max(MIN_HIT_RADIUS, radiusPx + 18)
        const distancePx = Math.hypot(sx - px, sy - py)
        const score = distancePx / hitRadius
        if (score < 1 && score < bestScore) {
          bestScore = score
          hovered = name
        }
      }
    }

    const now = performance.now()
    if (pointing && hovered) {
      if (dwell.current.target !== hovered) {
        dwell.current = { target: hovered, start: now }
      }
      handState.dwell = Math.min(1, (now - dwell.current.start) / DWELL_MS)
      if (handState.dwell >= 1) {
        const nextSelected = hovered === SUN.name ? null : hovered
        if (getAppState().selected !== nextSelected) setAppState({ selected: nextSelected })
      }
    } else {
      dwell.current.target = null
      handState.dwell = 0
    }

    const peace = handState.detected && handState.gesture === 'peace'
    if (peace) {
      if (!reset.current.active) reset.current = { active: true, start: now, fired: false }
      const progress = Math.min(1, (now - reset.current.start) / RESET_HOLD_MS)
      handState.dwell = progress
      if (progress >= 1 && !reset.current.fired) {
        reset.current.fired = true
        viewCommands.reset = true
        setAppState({ selected: null })
      }
    } else {
      reset.current.active = false
    }

    setAppState({ hovered })
  })

  return null
}
