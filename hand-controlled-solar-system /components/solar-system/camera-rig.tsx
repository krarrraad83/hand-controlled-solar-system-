'use client'

import { useEffect, useRef } from 'react'
import { useFrame, useThree } from '@react-three/fiber'
import { Vector3 } from 'three'
import { bodyRegistry, getAppState, handState, viewCommands } from '@/lib/store'

const ORIGIN = new Vector3(0, 0, 0)
const OVERVIEW_DISTANCE = 95
const MAX_DISTANCE = 180
const MIN_ELEVATION = -1.2
const MAX_ELEVATION = 1.45
const DEAD_ZONE = 0.1
const ROTATE_SPEED = 3.2
const TILT_SPEED = 2.2
const IDLE_DRIFT_DELAY = 4000

function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value))
}

function joystick(offset: number) {
  const magnitude = Math.max(0, Math.abs(offset) - DEAD_ZONE) / (0.5 - DEAD_ZONE)
  return Math.sign(offset) * Math.min(1, magnitude) ** 1.4
}

export function CameraRig() {
  const camera = useThree((state) => state.camera)
  const gl = useThree((state) => state.gl)
  const rig = useRef({
    az: 0.5,
    el: 0.42,
    dist: OVERVIEW_DISTANCE,
    targetAz: 0.5,
    targetEl: 0.42,
    targetDist: OVERVIEW_DISTANCE,
    focus: new Vector3(),
    lastInteraction: 0,
    lastSelected: null as string | null,
    pinchActive: false,
    pinchStartY: 0,
    pinchStartDist: OVERVIEW_DISTANCE,
  })

  useEffect(() => {
    const el = gl.domElement
    let dragging = false
    let lastX = 0
    let lastY = 0

    const onPointerDown = (e: PointerEvent) => {
      dragging = true
      lastX = e.clientX
      lastY = e.clientY
      el.setPointerCapture(e.pointerId)
    }
    const onPointerMove = (e: PointerEvent) => {
      if (!dragging) return
      const r = rig.current
      r.targetAz -= (e.clientX - lastX) * 0.005
      r.targetEl += (e.clientY - lastY) * 0.005
      lastX = e.clientX
      lastY = e.clientY
      r.lastInteraction = performance.now()
    }
    const onPointerUp = (e: PointerEvent) => {
      dragging = false
      if (el.hasPointerCapture(e.pointerId)) el.releasePointerCapture(e.pointerId)
    }
    const onWheel = (e: WheelEvent) => {
      e.preventDefault()
      const r = rig.current
      r.targetDist *= Math.exp(e.deltaY * 0.001)
      r.lastInteraction = performance.now()
    }

    el.addEventListener('pointerdown', onPointerDown)
    el.addEventListener('pointermove', onPointerMove)
    el.addEventListener('pointerup', onPointerUp)
    el.addEventListener('pointercancel', onPointerUp)
    el.addEventListener('wheel', onWheel, { passive: false })
    return () => {
      el.removeEventListener('pointerdown', onPointerDown)
      el.removeEventListener('pointermove', onPointerMove)
      el.removeEventListener('pointerup', onPointerUp)
      el.removeEventListener('pointercancel', onPointerUp)
      el.removeEventListener('wheel', onWheel)
    }
  }, [gl])

  useFrame((_, rawDelta) => {
    const delta = Math.min(rawDelta, 0.1)
    const r = rig.current
    const now = performance.now()
    const { selected } = getAppState()
    const focusBody = selected ? bodyRegistry.get(selected) : undefined
    const minDistance = focusBody ? focusBody.radius * 3 : 12

    if (viewCommands.reset) {
      viewCommands.reset = false
      const turn = Math.PI * 2
      r.targetAz = 0.5 + turn * Math.round((r.az - 0.5) / turn)
      r.targetEl = 0.42
      r.targetDist = OVERVIEW_DISTANCE
      r.lastInteraction = now
    }

    if (selected !== r.lastSelected) {
      r.lastSelected = selected
      r.targetDist = focusBody ? focusBody.radius * 9 + 4 : OVERVIEW_DISTANCE
      r.pinchActive = false
    }

    if (handState.detected) {
      const gesture = handState.gesture
      if (gesture === 'open') {
        r.targetAz -= joystick(handState.palm.x - 0.5) * ROTATE_SPEED * delta
        r.targetEl -= joystick(handState.palm.y - 0.5) * TILT_SPEED * delta
        r.lastInteraction = now
      }

      if (gesture === 'pinch') {
        if (!r.pinchActive) {
          r.pinchActive = true
          r.pinchStartY = handState.palm.y
          r.pinchStartDist = r.targetDist
        }
        r.targetDist = r.pinchStartDist * Math.exp((handState.palm.y - r.pinchStartY) * 4)
        r.lastInteraction = now
      } else {
        r.pinchActive = false
      }
    } else {
      r.pinchActive = false
      if (now - r.lastInteraction > IDLE_DRIFT_DELAY) r.targetAz += delta * 0.04
    }

    r.targetEl = clamp(r.targetEl, MIN_ELEVATION, MAX_ELEVATION)
    r.targetDist = clamp(r.targetDist, minDistance, MAX_DISTANCE)

    const ease = 1 - Math.exp(-delta * 6)
    r.az += (r.targetAz - r.az) * ease
    r.el += (r.targetEl - r.el) * ease
    r.dist += (r.targetDist - r.dist) * ease
    r.focus.lerp(focusBody?.position ?? ORIGIN, 1 - Math.exp(-delta * 10))

    const horizontal = r.dist * Math.cos(r.el)
    camera.position.set(
      r.focus.x + horizontal * Math.sin(r.az),
      r.focus.y + r.dist * Math.sin(r.el),
      r.focus.z + horizontal * Math.cos(r.az),
    )
    camera.lookAt(r.focus)
  })

  return null
}
