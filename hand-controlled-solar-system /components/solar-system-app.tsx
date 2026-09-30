'use client'

import dynamic from 'next/dynamic'
import { TopBar } from '@/components/hud/top-bar'
import { GestureGuide } from '@/components/hud/gesture-guide'
import { CameraPanel } from '@/components/hud/camera-panel'
import { PlanetInfo } from '@/components/hud/planet-info'
import { PlanetDock } from '@/components/hud/planet-dock'
import { HandCursor } from '@/components/hud/hand-cursor'
import { BodyLabels } from '@/components/hud/body-labels'

const Scene = dynamic(() => import('@/components/solar-system/scene'), {
  ssr: false,
  loading: () => (
    <div className="flex size-full items-center justify-center font-mono text-xs uppercase tracking-[0.2em] text-white/40">
      Loading solar system
    </div>
  ),
})

export function SolarSystemApp() {
  return (
    <main className="relative h-dvh w-full overflow-hidden bg-[#03040a] text-white">
      <div className="absolute inset-0">
        <Scene />
      </div>
      <BodyLabels />

      <div className="pointer-events-none absolute inset-0 z-20 flex flex-col">
        <TopBar />
        <div className="flex flex-1 items-start justify-between gap-4 px-4 md:px-6">
          <GestureGuide />
          <PlanetInfo />
        </div>
        <div className="flex flex-col-reverse items-center gap-3 p-4 md:flex-row md:items-end md:justify-between md:p-6">
          <PlanetDock />
          <CameraPanel />
        </div>
      </div>

      <HandCursor />
    </main>
  )
}
