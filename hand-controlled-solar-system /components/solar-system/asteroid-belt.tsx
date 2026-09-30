'use client'

import { useEffect, useLayoutEffect, useMemo, useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import { Color, IcosahedronGeometry, Object3D, Vector3, type Group, type InstancedMesh } from 'three'
import { mergeVertices } from 'three/examples/jsm/utils/BufferGeometryUtils.js'
import { gaussian, seededRandom } from '@/lib/random'
import { simState } from '@/lib/store'

const COUNT = 1400
const CENTER_RADIUS = 27
const ORBIT_PERIOD = 20 * Math.sqrt(4.6)
const ROCK_COLORS = ['#8c8378', '#6f665c', '#a39684', '#5c544b']

function buildRockGeometry() {
  const base = new IcosahedronGeometry(1, 1)
  base.deleteAttribute('normal')
  base.deleteAttribute('uv')
  const geometry = mergeVertices(base)
  base.dispose()
  const rand = seededRandom(99)
  const position = geometry.attributes.position
  const v = new Vector3()
  for (let i = 0; i < position.count; i++) {
    v.fromBufferAttribute(position, i).multiplyScalar(0.72 + rand() * 0.45)
    position.setXYZ(i, v.x, v.y, v.z)
  }
  geometry.computeVertexNormals()
  return geometry
}

/** Instanced lumpy rocks between Mars and Jupiter, orbiting as one slow ring. */
export function AsteroidBelt() {
  const groupRef = useRef<Group>(null)
  const meshRef = useRef<InstancedMesh>(null)
  const geometry = useMemo(buildRockGeometry, [])

  useLayoutEffect(() => {
    const mesh = meshRef.current
    if (!mesh) return
    const rand = seededRandom(1234)
    const dummy = new Object3D()
    const color = new Color()
    for (let i = 0; i < COUNT; i++) {
      const angle = rand() * Math.PI * 2
      const radius = Math.min(29.5, Math.max(24.5, CENTER_RADIUS + gaussian(rand) * 1.0))
      dummy.position.set(Math.cos(angle) * radius, gaussian(rand) * 0.35, Math.sin(angle) * radius)
      dummy.rotation.set(rand() * Math.PI, rand() * Math.PI, rand() * Math.PI)
      const s = 0.04 + Math.pow(rand(), 3) * 0.16
      dummy.scale.set(s, s * (0.6 + rand() * 0.3), s * (0.75 + rand() * 0.25))
      dummy.updateMatrix()
      mesh.setMatrixAt(i, dummy.matrix)
      color.set(ROCK_COLORS[Math.floor(rand() * ROCK_COLORS.length)])
      mesh.setColorAt(i, color)
    }
    mesh.instanceMatrix.needsUpdate = true
    if (mesh.instanceColor) mesh.instanceColor.needsUpdate = true
  }, [])

  useEffect(() => () => geometry.dispose(), [geometry])

  useFrame(() => {
    if (groupRef.current) groupRef.current.rotation.y = (simState.time / ORBIT_PERIOD) * Math.PI * 2
  })

  return (
    <group ref={groupRef}>
      <instancedMesh ref={meshRef} args={[geometry, undefined, COUNT]} frustumCulled={false}>
        <meshStandardMaterial roughness={1} metalness={0} flatShading />
      </instancedMesh>
    </group>
  )
}
