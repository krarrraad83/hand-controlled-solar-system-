'use client'

import { useMemo } from 'react'
import { useFrame } from '@react-three/fiber'
import { PerspectiveCamera, Vector3 } from 'three'
import { bodyRegistry, getAppState, labelElements } from '@/lib/store'

/** Projects each body to screen space and moves its DOM label, without React renders. */
export function LabelProjector() {
  const projected = useMemo(() => new Vector3(), [])

  useFrame(({ camera, size }) => {
    const { hovered, selected } = getAppState()
    const fov = camera instanceof PerspectiveCamera ? camera.fov : 50
    const focalPx = size.height / (2 * Math.tan((fov * Math.PI) / 360))

    for (const [name, el] of labelElements) {
      const body = bodyRegistry.get(name)
      if (!body) continue
      projected.copy(body.position).project(camera)
      if (projected.z > 1) {
        el.style.visibility = 'hidden'
        continue
      }
      const depth = camera.position.distanceTo(body.position)
      const radiusPx = (body.radius / depth) * focalPx
      const x = ((projected.x + 1) / 2) * size.width
      const y = ((1 - projected.y) / 2) * size.height - radiusPx - 14
      el.style.visibility = 'visible'
      el.style.transform = `translate3d(${x}px, ${y}px, 0) translate(-50%, -100%)`
      const state = selected === name ? 'selected' : hovered === name ? 'hovered' : 'idle'
      if (el.dataset.state !== state) el.dataset.state = state
    }
  })

  return null
}
