'use client'

import { X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useAppState } from '@/hooks/use-app-state'
import { BODY_COLORS, BODY_FACTS } from '@/lib/planets'
import { setAppState } from '@/lib/store'

export function PlanetInfo() {
  const selected = useAppState((s) => s.selected)
  const hovered = useAppState((s) => s.hovered)
  const name = selected ?? hovered
  if (!name) return null
  const facts = BODY_FACTS[name]
  if (!facts) return null

  const rows = [
    ['Diameter', facts.diameter],
    ['Day', facts.day],
    ['Year', facts.year],
    [name === 'Sun' ? 'Orbited by' : 'Moons', facts.moons],
  ]

  return (
    <section
      aria-live="polite"
      aria-label={`${name} details`}
      className="pointer-events-auto w-64 rounded-xl border border-white/10 bg-black/60 p-4 backdrop-blur-md"
    >
      <div className="flex items-start justify-between gap-2">
        <div className="flex items-center gap-2.5">
          <span className="size-3 rounded-full" style={{ backgroundColor: BODY_COLORS[name] }} aria-hidden="true" />
          <div>
            <h2 className="text-base font-semibold leading-tight text-white">{name}</h2>
            <p className="font-mono text-[10px] uppercase tracking-[0.18em] text-white/45">{facts.kind}</p>
          </div>
        </div>
        {selected && (
          <Button
            variant="ghost"
            size="icon-xs"
            data-hand-target
            onClick={() => setAppState({ selected: null })}
            aria-label="Back to overview"
            className="text-white/70"
          >
            <X aria-hidden="true" />
          </Button>
        )}
      </div>
      <p className="mt-3 text-pretty text-sm leading-relaxed text-white/70">{facts.summary}</p>
      <dl className="mt-3 grid grid-cols-2 gap-x-3 gap-y-2">
        {rows.map(([label, value]) => (
          <div key={label}>
            <dt className="font-mono text-[9px] uppercase tracking-[0.18em] text-white/40">{label}</dt>
            <dd className="text-sm tabular-nums text-white">{value}</dd>
          </div>
        ))}
      </dl>
      {!selected && <p className="mt-3 text-[11px] text-white/40">Keep pointing to focus</p>}
    </section>
  )
}
