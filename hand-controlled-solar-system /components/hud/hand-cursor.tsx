'use client'

import { useEffect, useRef } from 'react'
import { handState } from '@/lib/store'

const RING_RADIUS = 18
const RING_LENGTH = 2 * Math.PI * RING_RADIUS
const UI_DWELL_MS = 700

/**
 * On-screen cursor that mirrors the tracked hand, updated imperatively every frame.
 * While pointing, it also presses any element marked with `data-hand-target`
 * after the finger rests on it briefly.
 */
export function HandCursor() {
  const cursorRef = useRef<HTMLDivElement>(null)
  const progressRef = useRef<SVGCircleElement>(null)

  useEffect(() => {
    let raf = 0
    let uiTarget: HTMLElement | null = null
    let uiStart = 0
    let uiFired = false

    const setUiTarget = (next: HTMLElement | null, now: number) => {
      if (next === uiTarget) return
      uiTarget?.removeAttribute('data-hand-hover')
      next?.setAttribute('data-hand-hover', '')
      uiTarget = next
      uiStart = now
      uiFired = false
    }

    const tick = (now: number) => {
      raf = requestAnimationFrame(tick)
      const cursor = cursorRef.current
      const progress = progressRef.current
      if (!cursor || !progress) return

      if (!handState.detected) {
        setUiTarget(null, now)
        handState.overUi = false
        handState.uiDwell = 0
        cursor.style.opacity = '0'
        return
      }

      const pointing = handState.gesture === 'point'
      const point = pointing ? handState.pointer : handState.palm
      const x = point.x * window.innerWidth
      const y = point.y * window.innerHeight

      const hit = pointing ? document.elementFromPoint(x, y) : null
      const target = hit?.closest<HTMLElement>('[data-hand-target]:not(:disabled)') ?? null
      setUiTarget(target, now)
      handState.overUi = target !== null

      if (target && !uiFired) {
        handState.uiDwell = Math.min(1, (now - uiStart) / UI_DWELL_MS)
        if (handState.uiDwell >= 1) {
          uiFired = true
          target.click()
        }
      } else {
        handState.uiDwell = target ? 1 : 0
      }

      cursor.style.opacity = '1'
      cursor.style.transform = `translate3d(${x}px, ${y}px, 0)`
      if (cursor.dataset.gesture !== handState.gesture) cursor.dataset.gesture = handState.gesture
      const ui = target ? 'true' : 'false'
      if (cursor.dataset.ui !== ui) cursor.dataset.ui = ui
      const amount = target ? handState.uiDwell : handState.dwell
      progress.style.strokeDashoffset = `${RING_LENGTH * (1 - amount)}`
    }
    raf = requestAnimationFrame(tick)
    return () => {
      cancelAnimationFrame(raf)
      uiTarget?.removeAttribute('data-hand-hover')
    }
  }, [])

  return (
    <div
      ref={cursorRef}
      aria-hidden="true"
      data-gesture="none"
      data-ui="false"
      className="group pointer-events-none fixed left-0 top-0 z-50 opacity-0 transition-opacity duration-200"
    >
      <div className="-translate-x-1/2 -translate-y-1/2">
        <svg width="48" height="48" viewBox="0 0 48 48" className="overflow-visible">
          <circle
            cx="24"
            cy="24"
            r={RING_RADIUS}
            fill="none"
            stroke="rgba(255,255,255,0.35)"
            strokeWidth="1.5"
            className="transition-all duration-200 group-data-[gesture=fist]:stroke-red-300 group-data-[gesture=pinch]:[r:10]"
          />
          <circle
            ref={progressRef}
            cx="24"
            cy="24"
            r={RING_RADIUS}
            fill="none"
            strokeWidth="3"
            strokeLinecap="round"
            strokeDasharray={RING_LENGTH}
            strokeDashoffset={RING_LENGTH}
            transform="rotate(-90 24 24)"
            className="stroke-sun"
          />
          <circle cx="24" cy="24" r="4" className="fill-white group-data-[gesture=point]:fill-sun" />
        </svg>
        <span className="absolute left-1/2 top-full mt-1 -translate-x-1/2 whitespace-nowrap rounded-full bg-black/70 px-2 py-0.5 font-mono text-[10px] uppercase tracking-wider text-white/80 group-data-[gesture=none]:hidden">
          <span className="hidden group-data-[gesture=open]:inline">Orbit</span>
          <span className="hidden group-data-[gesture=pinch]:inline">Zoom</span>
          <span className="hidden group-data-[gesture=point]:group-data-[ui=false]:inline">Select</span>
          <span className="hidden group-data-[gesture=point]:group-data-[ui=true]:inline">Press</span>
          <span className="hidden group-data-[gesture=peace]:inline">Reset view</span>
          <span className="hidden group-data-[gesture=fist]:inline">Time frozen</span>
        </span>
      </div>
    </div>
  )
}
