'use client'

import { useEffect, useMemo, useRef } from 'react'
import { useFrame, type ThreeEvent } from '@react-three/fiber'
import { BufferGeometry, Float32BufferAttribute, RingGeometry, Vector3, type Group, type Mesh } from 'three'
import { MOON_PALETTE, type PlanetData } from '@/lib/planets'
import { hashString } from '@/lib/random'
import {
  createAtmosphereMaterial,
  createOrbitMaterial,
  createRingMaterial,
  createSurfaceMaterial,
} from '@/lib/shaders/bodies'
import { bodyRegistry, getAppState, isTimeFrozen, mouseState, setAppState, simState } from '@/lib/store'

function useOrbitGeometry(radius: number) {
  return useMemo(() => {
    const segments = 256
    const positions: number[] = []
    const angles: number[] = []
    for (let i = 0; i <= segments; i++) {
      const a = (i / segments) * Math.PI * 2
      positions.push(Math.cos(a) * radius, 0, Math.sin(a) * radius)
      angles.push(a)
    }
    const geometry = new BufferGeometry()
    geometry.setAttribute('position', new Float32BufferAttribute(positions, 3))
    geometry.setAttribute('aAngle', new Float32BufferAttribute(angles, 1))
    return geometry
  }, [radius])
}

function useRingGeometry(inner: number, outer: number) {
  return useMemo(() => {
    const geometry = new RingGeometry(inner, outer, 160, 1)
    const position = geometry.attributes.position
    const uv = geometry.attributes.uv
    const v = new Vector3()
    for (let i = 0; i < position.count; i++) {
      v.fromBufferAttribute(position, i)
      uv.setXY(i, (v.length() - inner) / (outer - inner), 0.5)
    }
    return geometry
  }, [inner, outer])
}

export function Planet({ planet }: { planet: PlanetData }) {
  const orbitRef = useRef<Group>(null)
  const bodyRef = useRef<Mesh>(null)
  const moonPivotRef = useRef<Group>(null)
  const worldPosition = useMemo(() => new Vector3(), [])
  const seed = useMemo(() => (hashString(planet.name) % 1000) / 10, [planet.name])

  const surface = useMemo(
    () =>
      createSurfaceMaterial({
        style: planet.surface,
        palette: planet.palette,
        radius: planet.radius,
        seed,
        bands: planet.bands,
        bump: planet.bump,
        streaks: planet.streaks,
        spot: planet.spot,
        atmosphere: planet.atmosphere,
      }),
    [planet, seed],
  )
  const atmosphere = useMemo(
    () => (planet.atmosphere ? createAtmosphereMaterial(planet.atmosphere) : null),
    [planet.atmosphere],
  )
  const ring = useMemo(
    () => (planet.ring ? createRingMaterial(planet.ring, planet.radius, seed) : null),
    [planet.ring, planet.radius, seed],
  )
  const orbit = useMemo(() => createOrbitMaterial(planet.accent), [planet.accent])
  const moon = useMemo(
    () =>
      planet.hasMoon
        ? createSurfaceMaterial({
            style: 'rocky',
            palette: MOON_PALETTE,
            radius: planet.radius * 0.27,
            seed: seed + 50,
            bump: 0.03,
          })
        : null,
    [planet.hasMoon, planet.radius, seed],
  )

  const orbitGeometry = useOrbitGeometry(planet.distance)
  const ringGeometry = useRingGeometry(
    planet.radius * (planet.ring?.inner ?? 1.3),
    planet.radius * (planet.ring?.outer ?? 2),
  )

  useEffect(() => {
    bodyRegistry.set(planet.name, { position: worldPosition, radius: planet.radius })
    return () => {
      bodyRegistry.delete(planet.name)
    }
  }, [planet.name, planet.radius, worldPosition])

  useEffect(
    () => () => {
      surface.dispose()
      atmosphere?.dispose()
      ring?.dispose()
      orbit.dispose()
      moon?.dispose()
      orbitGeometry.dispose()
      ringGeometry.dispose()
    },
    [surface, atmosphere, ring, orbit, moon, orbitGeometry, ringGeometry],
  )

  useFrame((_, rawDelta) => {
    const delta = Math.min(rawDelta, 0.1)
    const angle = planet.phase + (simState.time / planet.period) * Math.PI * 2
    if (orbitRef.current) {
      orbitRef.current.position.set(Math.cos(angle) * planet.distance, 0, -Math.sin(angle) * planet.distance)
      worldPosition.copy(orbitRef.current.position)
    }
    if (!isTimeFrozen()) {
      const rate = delta * getAppState().speed
      if (bodyRef.current) bodyRef.current.rotation.y += rate * planet.spin
      if (moonPivotRef.current) moonPivotRef.current.rotation.y += rate * 1.6
    }

    surface.uniforms.uTime.value = simState.time
    if (atmosphere) atmosphere.uniforms.uCenter.value.copy(worldPosition)
    if (ring) ring.uniforms.uCenter.value.copy(worldPosition)
    if (moon) moon.uniforms.uTime.value = simState.time

    const { hovered, selected } = getAppState()
    const active = hovered === planet.name || selected === planet.name
    orbit.uniforms.uPlanetAngle.value = angle
    orbit.uniforms.uBase.value = active ? 0.22 : 0.05
    orbit.uniforms.uTrail.value = active ? 0.8 : 0.45
  })

  const handleClick = (event: ThreeEvent<MouseEvent>) => {
    if (event.delta > 4) return
    event.stopPropagation()
    setAppState({ selected: planet.name })
  }

  return (
    <group>
      <lineLoop geometry={orbitGeometry} material={orbit} />
      <group ref={orbitRef}>
        <group rotation={[0, 0, planet.tilt]}>
          <mesh
            ref={bodyRef}
            material={surface}
            onClick={handleClick}
            onPointerOver={(e) => {
              e.stopPropagation()
              mouseState.hovered = planet.name
            }}
            onPointerOut={() => {
              if (mouseState.hovered === planet.name) mouseState.hovered = null
            }}
          >
            <sphereGeometry args={[planet.radius, 96, 64]} />
          </mesh>
          {atmosphere && planet.atmosphere && (
            <mesh material={atmosphere}>
              <sphereGeometry args={[planet.radius * planet.atmosphere.scale, 64, 48]} />
            </mesh>
          )}
          {ring && <mesh geometry={ringGeometry} material={ring} rotation={[-Math.PI / 2, 0, 0]} />}
        </group>
        {moon && (
          <group ref={moonPivotRef}>
            <mesh position={[planet.radius * 2.2, 0, 0]} material={moon}>
              <sphereGeometry args={[planet.radius * 0.27, 48, 32]} />
            </mesh>
          </group>
        )}
      </group>
    </group>
  )
}
