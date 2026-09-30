'use client'

import { useEffect, useMemo, useRef } from 'react'
import { useFrame, useThree } from '@react-three/fiber'
import { BufferGeometry, Color, Float32BufferAttribute, Vector3, type Group } from 'three'
import { gaussian, seededRandom } from '@/lib/random'
import { createGalaxyDiskMaterial, createPointsMaterial } from '@/lib/shaders/space'

const PARTICLES = 18000
const RADIUS = 140
const POSITION = new Vector3(-0.55, -0.2, -0.81).normalize().multiplyScalar(900)

const CORE = new Color('#ffd9a0')
const ARM = new Color('#7fa8ff')
const NEBULA = new Color('#ff7eb6')

function buildGalaxy() {
  const rand = seededRandom(7)
  const positions = new Float32Array(PARTICLES * 3)
  const colors = new Float32Array(PARTICLES * 3)
  const sizes = new Float32Array(PARTICLES)
  const phases = new Float32Array(PARTICLES)
  const color = new Color()

  for (let i = 0; i < PARTICLES; i++) {
    const bulge = rand() < 0.18
    let r: number
    let angle: number
    let z: number
    if (bulge) {
      r = Math.abs(gaussian(rand)) * 0.08
      angle = rand() * Math.PI * 2
      z = gaussian(rand) * 0.04
      color.copy(CORE)
    } else {
      r = 0.06 + Math.pow(rand(), 1.2) * 0.94
      const arm = rand() < 0.5 ? 0 : 1
      angle = arm * Math.PI + Math.log(r) * 2.5 + gaussian(rand) * (0.25 + 0.15 * (1 - r))
      z = gaussian(rand) * 0.015
      color.copy(CORE).lerp(ARM, Math.min(1, r * 1.6))
      if (r > 0.2 && rand() < 0.06) color.copy(NEBULA)
    }
    positions.set([Math.cos(angle) * r * RADIUS, Math.sin(angle) * r * RADIUS, z * RADIUS], i * 3)
    color.multiplyScalar(0.5 + rand() * 0.6)
    colors.set([color.r, color.g, color.b], i * 3)
    sizes[i] = rand() > 0.97 ? 3.5 : 1.5 + rand() * 1.8
    phases[i] = rand()
  }

  const geometry = new BufferGeometry()
  geometry.setAttribute('position', new Float32BufferAttribute(positions, 3))
  geometry.setAttribute('aColor', new Float32BufferAttribute(colors, 3))
  geometry.setAttribute('aSize', new Float32BufferAttribute(sizes, 1))
  geometry.setAttribute('aPhase', new Float32BufferAttribute(phases, 1))
  return geometry
}

/** A distant two-armed spiral galaxy that slowly turns in the background. */
export function DistantGalaxy() {
  const spinRef = useRef<Group>(null)
  const dpr = useThree((state) => state.viewport.dpr)
  const geometry = useMemo(buildGalaxy, [])
  const points = useMemo(() => createPointsMaterial({ twinkle: 0, intensity: 0.75 }), [])
  const disk = useMemo(() => createGalaxyDiskMaterial(0.9), [])

  useEffect(() => {
    points.uniforms.uPixelRatio.value = dpr
  }, [points, dpr])

  useEffect(
    () => () => {
      geometry.dispose()
      points.dispose()
      disk.dispose()
    },
    [geometry, points, disk],
  )

  useFrame((_, delta) => {
    if (spinRef.current) spinRef.current.rotation.z += Math.min(delta, 0.1) * 0.01
  })

  return (
    <group position={POSITION} rotation={[1.05, 0.35, 0.2]}>
      <group ref={spinRef}>
        <mesh material={disk}>
          <planeGeometry args={[RADIUS * 2.2, RADIUS * 2.2]} />
        </mesh>
        <points geometry={geometry} material={points} frustumCulled={false} />
      </group>
    </group>
  )
}
