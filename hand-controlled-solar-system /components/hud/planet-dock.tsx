'use client'

import { useAppState } from '@/hooks/use-app-state'
import { BODY_COLORS, PLANETS, SUN } from '@/lib/planets'
import { setAppState } from '@/lib/store'
import { cn } from '@/lib/utils'

const BODIES = [SUN.name, ...PLANETS.map((p) => p.name)]

export function PlanetDock() {
  const selected = useAppState((s) => s.selected)
  const hovered = useAppState((s) => s.hovered)

  return (
    <nav
      aria-label="Jump to a body"
      className="pointer-events-auto max-w-full overflow-x-auto rounded-full border border-white/10 bg-black/50 p-1 backdrop-blur-md"
    >
      <ul className="flex items-center gap-0.5">
        {BODIES.map((name) => {
          const isSelected = name === SUN.name ? selected === null : selected === name
          return (
            <li key={name}>
              <button
                type="button"
                data-hand-target
                onClick={() => setAppState({ selected: name === SUN.name ? null : name })}
                aria-pressed={isSelected}
                className={cn(
                  'flex items-center gap-1.5 whitespace-nowrap rounded-full px-3 py-1.5 text-xs text-white/65 transition-colors hover:bg-white/10 hover:text-white',
                  hovered === name && 'bg-white/10 text-white',
                  isSelected && 'bg-white text-black hover:bg-white hover:text-black',
                )}
              >
                <span className="size-2 rounded-full" style={{ backgroundColor: BODY_COLORS[name] }} aria-hidden="true" />
                {name === SUN.name ? 'Overview' : name}
              </button>
            </li>
          )
        })}
      </ul>
    </nav>
  )
}
