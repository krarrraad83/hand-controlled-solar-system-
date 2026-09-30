'use client'

import { useEffect } from 'react'
import { useThree } from '@react-three/fiber'
import { TARGET_FPS, isTimeFrozen, getAppState, setAppState, simState } from '@/lib/store'

/**
 * Drives the Canvas (frameloop="never") at a fixed frame rate so the scene
 * runs at a steady 60 FPS even on 120/144 Hz displays.
 */
export function FixedFrameLoop({ fps = TARGET_FPS }: { fps?: number }) {
  const advance = useThree((state) => state.advance)

  useEffect(() => {
    const interval = 1000 / fps
    let raf = 0
    let last = performance.now()
    let previousFrame = last
    let frames = 0
    let fpsWindowStart = last

    const tick = (now: number) => {
      raf = requestAnimationFrame(tick)
      if (now - last < interval - 1) return
      last = Math.max(last + interval, now - interval)

      const delta = Math.min((now - previousFrame) / 1000, 0.1)
      previousFrame = now
      if (!isTimeFrozen()) simState.time += delta * getAppState().speed

      advance(now / 1000)
      frames++

      if (now - fpsWindowStart >= 1000) {
        setAppState({ renderFps: Math.round((frames * 1000) / (now - fpsWindowStart)) })
        frames = 0
        fpsWindowStart = now
      }
    }

    raf = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(raf)
  }, [advance, fps])

  return null
}
