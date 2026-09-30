'use client'

import { PLANETS, SUN } from '@/lib/planets'
import { labelElements } from '@/lib/store'

const NAMES = [SUN.name, ...PLANETS.map((p) => p.name)]

export function BodyLabels() {
  return (
    <div aria-hidden="true" className="pointer-events-none absolute inset-0 z-10 overflow-hidden">
      {NAMES.map((name) => (
        <span
          key={name}
          ref={(el) => {
            if (!el) return
            labelElements.set(name, el)
            return () => {
              labelElements.delete(name)
            }
          }}
          data-state="idle"
          style={{ visibility: 'hidden' }}
          className="absolute left-0 top-0 whitespace-nowrap rounded-full px-2 py-0.5 font-mono text-[10px] uppercase tracking-[0.2em] text-white/55 transition-colors duration-200 data-[state=hovered]:bg-white/10 data-[state=hovered]:text-white data-[state=selected]:bg-sun data-[state=selected]:text-black"
        >
          {name}
        </span>
      ))}
    </div>
  )
}
