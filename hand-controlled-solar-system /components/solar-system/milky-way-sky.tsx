'use client'

import { useEffect } from 'react'
import { useThree } from '@react-three/fiber'
import { CubeCamera, HalfFloatType, Mesh, Scene, SphereGeometry, WebGLCubeRenderTarget } from 'three'
import { createSkyMaterial } from '@/lib/shaders/space'

const CUBE_SIZE = 1024

/**
 * Renders the procedural Milky Way into a cube map once, then uses it as the
 * scene background so the expensive noise isn't recomputed every frame.
 */
export function MilkyWaySky() {
  const gl = useThree((state) => state.gl)
  const scene = useThree((state) => state.scene)

  useEffect(() => {
    const target = new WebGLCubeRenderTarget(CUBE_SIZE, { type: HalfFloatType })
    const skyScene = new Scene()
    const geometry = new SphereGeometry(50, 64, 32)
    const material = createSkyMaterial()
    skyScene.add(new Mesh(geometry, material))

    const cubeCamera = new CubeCamera(1, 200, target)
    cubeCamera.update(gl, skyScene)
    scene.background = target.texture

    return () => {
      if (scene.background === target.texture) scene.background = null
      target.dispose()
      geometry.dispose()
      material.dispose()
    }
  }, [gl, scene])

  return null
}
