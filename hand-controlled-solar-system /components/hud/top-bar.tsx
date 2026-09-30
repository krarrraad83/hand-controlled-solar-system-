'use client'

import { Orbit, Pause, Play } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useAppState } from '@/hooks/use-app-state'
import { TARGET_FPS, setAppState } from '@/lib/store'
import { cn } from '@/lib/utils'

const SPEEDS = [0.5, 1, 3, 10]

function Stat({ label, value, good }: { label: string; value: string; good?: boolean }) {
  return (
    <div className="flex flex-col items-start leading-none">
      <span className="font-mono text-[9px] uppercase tracking-[0.18em] text-white/45">{label}</span>
      <span className={cn('mt-1 font-mono text-sm tabular-nums', good ? 'text-sun' : 'text-white')}>{value}</span>
    </div>
  )
}

export function TopBar() {
  const renderFps = useAppState((s) => s.renderFps)
  const trackingFps = useAppState((s) => s.trackingFps)
  const trackingStatus = useAppState((s) => s.trackingStatus)
  const paused = useAppState((s) => s.paused)
  const speed = useAppState((s) => s.speed)

  return (
    <header className="pointer-events-none flex flex-wrap items-start justify-between gap-3 p-4 md:p-6">
      <div className="pointer-events-auto flex items-center gap-3">
        <div className="flex size-9 items-center justify-center rounded-lg bg-sun text-black">
          <Orbit className="size-5" aria-hidden="true" />
        </div>
        <div>
          <h1 className="text-balance text-sm font-semibold tracking-tight text-white md:text-base">Hand Orrery</h1>
          <p className="text-xs text-white/55">Control the solar system with your hand</p>
        </div>
      </div>

      <div className="pointer-events-auto flex items-center gap-4 rounded-xl border border-white/10 bg-black/50 px-4 py-2.5 backdrop-blur-md">
        <Stat label="Render" value={`${renderFps}/${TARGET_FPS}`} good={renderFps >= TARGET_FPS - 3} />
        <Stat
          label="Tracking"
          value={trackingStatus === 'running' ? `${trackingFps} fps` : 'off'}
          good={trackingStatus === 'running' && trackingFps >= TARGET_FPS - 3}
        />
        <div className="h-8 w-px bg-white/10" aria-hidden="true" />
        <Button
          variant="ghost"
          size="icon-sm"
          data-hand-target
          onClick={() => setAppState({ paused: !paused })}
          aria-label={paused ? 'Resume orbits' : 'Pause orbits'}
          className="text-white"
        >
          {paused ? <Play aria-hidden="true" /> : <Pause aria-hidden="true" />}
        </Button>
        <div role="group" aria-label="Simulation speed" className="flex items-center gap-0.5 rounded-lg bg-white/5 p-0.5">
          {SPEEDS.map((value) => (
            <button
              key={value}
              type="button"
              data-hand-target
              onClick={() => setAppState({ speed: value })}
              aria-pressed={speed === value}
              className={cn(
                'rounded-md px-2 py-1 font-mono text-[11px] tabular-nums text-white/60 transition-colors hover:text-white',
                speed === value && 'bg-white text-black hover:text-black',
              )}
            >
              {value}x
            </button>
          ))}
        </div>
      </div>
    </header>
  )
}
