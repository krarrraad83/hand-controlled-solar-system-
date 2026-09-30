'use client'

import { useEffect, useMemo } from 'react'
import { useFrame, useThree } from '@react-three/fiber'
import { BufferGeometry, Color, Float32BufferAttribute, Vector3 } from 'three'
import { gaussian, seededRandom } from '@/lib/random'
import { GALACTIC_NORMAL, createPointsMaterial } from '@/lib/shaders/space'

const STAR_COUNT = 7000

const STAR_COLORS: [string, number][] = [
  ['#9bb0ff', 0.12],
  ['#cad7ff', 0.18],
  ['#f8f7ff', 0.3],
  ['#fff4e8', 0.2],
  ['#ffd2a1', 0.13],
  ['#ffb07a', 0.07],
]

function pickColor(rand: () => number) {
  let roll = rand()
  for (const [hex, weight] of STAR_COLORS) {
    roll -= weight
    if (roll <= 0) return hex
  }
  return STAR_COLORS[0][0]
}

function buildStars() {
  const rand = seededRandom(42)
  const positions = new Float32Array(STAR_COUNT * 3)
  const colors = new Float32Array(STAR_COUNT * 3)
  const sizes = new Float32Array(STAR_COUNT)
  const phases = new Float32Array(STAR_COUNT)
  const dir = new Vector3()
  const color = new Color()

  for (let i = 0; i < STAR_COUNT; i++) {
    dir.set(gaussian(rand), gaussian(rand), gaussian(rand)).normalize()
    const inBand = rand() < 0.45
    if (inBand) {
      dir.addScaledVector(GALACTIC_NORMAL, -dir.dot(GALACTIC_NORMAL)).normalize()
      dir.addScaledVector(GALACTIC_NORMAL, gaussian(rand) * 0.12).normalize()
    }
    const radius = 900 + rand() * 300
    positions.set([dir.x * radius, dir.y * radius, dir.z * radius], i * 3)

    const roll = rand()
    const size = roll > 0.99 ? 7 + rand() * 3 : roll > 0.92 ? 4 + rand() * 2 : 2 + rand() * 1.6
    sizes[i] = inBand ? size * 0.85 : size
    const brightness = (0.45 + rand() * 0.85) * (inBand ? 0.8 : 1)
    color.set(pickColor(rand)).multiplyScalar(brightness)
    colors.set([color.r, color.g, color.b], i * 3)
    phases[i] = rand()
  }

  const geometry = new BufferGeometry()
  geometry.setAttribute('position', new Float32BufferAttribute(positions, 3))
  geometry.setAttribute('aColor', new Float32BufferAttribute(colors, 3))
  geometry.setAttribute('aSize', new Float32BufferAttribute(sizes, 1))
  geometry.setAttribute('aPhase', new Float32BufferAttribute(phases, 1))
  return geometry
}

export function Starfield() {
  const dpr = useThree((state) => state.viewport.dpr)
  const geometry = useMemo(buildStars, [])
  const material = useMemo(() => createPointsMaterial({ twinkle: 1, intensity: 1 }), [])

  useEffect(() => {
    material.uniforms.uPixelRatio.value = dpr
  }, [material, dpr])

  useEffect(
    () => () => {
      geometry.dispose()
      material.dispose()
    },
    [geometry, material],
  )

  useFrame(({ clock }) => {
    material.uniforms.uTime.value = clock.elapsedTime
  })

  return <points geometry={geometry} material={material} frustumCulled={false} />
}
