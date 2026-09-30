'use client'

import { Hand, HandGrab, Pointer, RotateCcw, ZoomIn, type LucideIcon } from 'lucide-react'
import { useAppState } from '@/hooks/use-app-state'
import type { Gesture } from '@/lib/store'
import { cn } from '@/lib/utils'

const GESTURES: { id: Gesture; icon: LucideIcon; title: string; description: string }[] = [
  {
    id: 'open',
    icon: Hand,
    title: 'Open palm',
    description: 'Move your hand away from center to orbit the camera',
  },
  {
    id: 'pinch',
    icon: ZoomIn,
    title: 'Pinch',
    description: 'Touch thumb and index, then move up to zoom in, down to zoom out',
  },
  {
    id: 'point',
    icon: Pointer,
    title: 'Point',
    description: 'Hold your index finger on a planet to fly to it, or on any button to press it',
  },
  {
    id: 'peace',
    icon: RotateCcw,
    title: 'Peace sign',
    description: 'Hold index and middle finger up to return to the full view',
  },
  {
    id: 'fist',
    icon: HandGrab,
    title: 'Fist',
    description: 'Close your hand to freeze time',
  },
]

export function GestureGuide() {
  const gesture = useAppState((s) => s.gesture)
  const handDetected = useAppState((s) => s.handDetected)

  return (
    <aside
      aria-label="Gesture controls"
      className="pointer-events-auto hidden w-64 flex-col gap-1 rounded-xl border border-white/10 bg-black/50 p-2 backdrop-blur-md md:flex"
    >
      <h2 className="px-2 pb-1 pt-1 font-mono text-[10px] uppercase tracking-[0.2em] text-white/45">Gestures</h2>
      <ul className="flex flex-col gap-1">
        {GESTURES.map(({ id, icon: Icon, title, description }) => {
          const active = handDetected && gesture === id
          return (
            <li
              key={id}
              aria-current={active ? 'true' : undefined}
              className={cn(
                'flex items-start gap-3 rounded-lg px-2 py-2 transition-colors',
                active ? 'bg-sun text-black' : 'text-white',
              )}
            >
              <Icon className={cn('mt-0.5 size-4 shrink-0', active ? 'text-black' : 'text-sun')} aria-hidden="true" />
              <div>
                <p className="text-sm font-medium leading-tight">{title}</p>
                <p className={cn('mt-0.5 text-xs leading-snug', active ? 'text-black/70' : 'text-white/50')}>
                  {description}
                </p>
              </div>
            </li>
          )
        })}
      </ul>
      <p className="px-2 pb-1 pt-2 text-[11px] leading-snug text-white/40">
        Every control on screen can be pressed by pointing at it.
      </p>
    </aside>
  )
}
