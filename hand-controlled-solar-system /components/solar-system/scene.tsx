'use client'

import { Canvas } from '@react-three/fiber'
import { PLANETS } from '@/lib/planets'
import { TARGET_FPS } from '@/lib/store'
import { FixedFrameLoop } from './fixed-frame-loop'
import { Sun } from './sun'
import { Planet } from './planet'
import { CameraRig } from './camera-rig'
import { HandInteraction } from './hand-interaction'
import { LabelProjector } from './label-projector'
import { MilkyWaySky } from './milky-way-sky'
import { Starfield } from './starfield'
import { DistantGalaxy } from './distant-galaxy'
import { AsteroidBelt } from './asteroid-belt'
import { Effects } from './effects'

export default function Scene() {
  return (
    <Canvas
      flat
      frameloop="never"
      dpr={[1, 2]}
      camera={{ position: [0, 40, 85], fov: 50, near: 0.1, far: 3000 }}
      gl={{ antialias: false, stencil: false, powerPreference: 'high-performance' }}
      style={{ touchAction: 'none' }}
      aria-label="Interactive 3D solar system"
    >
      <FixedFrameLoop fps={TARGET_FPS} />
      <MilkyWaySky />
      <Starfield />
      <DistantGalaxy />
      <ambientLight intensity={0.06} />
      <Sun />
      {PLANETS.map((planet) => (
        <Planet key={planet.name} planet={planet} />
      ))}
      <AsteroidBelt />
      <CameraRig />
      <HandInteraction />
      <LabelProjector />
      <Effects />
    </Canvas>
  )
}
