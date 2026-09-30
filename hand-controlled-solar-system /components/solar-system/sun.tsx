'use client'

import { useEffect, useMemo, useRef } from 'react'
import { useFrame, type ThreeEvent } from '@react-three/fiber'
import { Billboard } from '@react-three/drei'
import { Vector3, type Mesh } from 'three'
import { SUN } from '@/lib/planets'
import { createCoronaMaterial, createSunMaterial } from '@/lib/shaders/bodies'
import { bodyRegistry, isTimeFrozen, mouseState, setAppState, simState } from '@/lib/store'

const CORONA_SIZE = SUN.radius * 7

export function Sun() {
  const meshRef = useRef<Mesh>(null)
  const surface = useMemo(() => createSunMaterial(), [])
  const corona = useMemo(() => createCoronaMaterial((SUN.radius * 2) / CORONA_SIZE), [])

  useEffect(() => {
    bodyRegistry.set(SUN.name, { position: new Vector3(0, 0, 0), radius: SUN.radius })
    return () => {
      bodyRegistry.delete(SUN.name)
      surface.dispose()
      corona.dispose()
    }
  }, [surface, corona])

  useFrame((_, delta) => {
    if (meshRef.current && !isTimeFrozen()) meshRef.current.rotation.y += Math.min(delta, 0.1) * 0.05
    surface.uniforms.uTime.value = simState.time
    corona.uniforms.uTime.value = simState.time
  })

  const handleClick = (event: ThreeEvent<MouseEvent>) => {
    if (event.delta > 4) return
    event.stopPropagation()
    setAppState({ selected: null })
  }

  return (
    <group>
      <pointLight position={[0, 0, 0]} intensity={2.4} decay={0} color="#fff3e0" />
      <mesh
        ref={meshRef}
        material={surface}
        onClick={handleClick}
        onPointerOver={(e) => {
          e.stopPropagation()
          mouseState.hovered = SUN.name
        }}
        onPointerOut={() => {
          if (mouseState.hovered === SUN.name) mouseState.hovered = null
        }}
      >
        <sphereGeometry args={[SUN.radius, 96, 64]} />
      </mesh>
      <Billboard>
        <mesh material={corona} renderOrder={-1}>
          <planeGeometry args={[CORONA_SIZE, CORONA_SIZE]} />
        </mesh>
      </Billboard>
    </group>
  )
}
