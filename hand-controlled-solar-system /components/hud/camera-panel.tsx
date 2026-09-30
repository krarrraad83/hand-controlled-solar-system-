'use client'

import { useEffect } from 'react'
import { Camera, CameraOff, LoaderCircle } from 'lucide-react'
import { TrackingOverlay } from '@/components/hud/tracking-overlay'
import { Button } from '@/components/ui/button'
import { useAppState } from '@/hooks/use-app-state'
import { useHandTracking } from '@/hooks/use-hand-tracking'
import { cn } from '@/lib/utils'

export function CameraPanel() {
  const { videoRef, canvasRef, start, stop } = useHandTracking()
  const status = useAppState((s) => s.trackingStatus)
  const error = useAppState((s) => s.trackingError)
  const handDetected = useAppState((s) => s.handDetected)
  const running = status === 'running'

  useEffect(() => {
    start()
  }, [start])

  return (
    <>
    <TrackingOverlay status={status} error={error} onStart={start} />
    <section
      aria-label="Hand tracking camera"
      className="pointer-events-auto w-56 overflow-hidden rounded-xl border border-white/10 bg-black/60 backdrop-blur-md md:w-64"
    >
      <div className="relative aspect-[4/3] w-full bg-black">
        <video
          ref={videoRef}
          playsInline
          muted
          className={cn('absolute inset-0 size-full -scale-x-100 object-cover opacity-70', !running && 'hidden')}
        />
        <canvas
          ref={canvasRef}
          aria-hidden="true"
          className={cn('absolute inset-0 size-full -scale-x-100 object-cover', !running && 'hidden')}
        />
        {!running && (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 p-4 text-center">
            <p className="text-xs leading-relaxed text-white/60">
              {status === 'loading'
                ? 'Loading the hand model and camera...'
                : 'Turn on your camera to control the solar system with your hand.'}
            </p>
            <Button onClick={start} disabled={status === 'loading'} className="bg-sun text-black hover:bg-sun/85">
              {status === 'loading' ? (
                <LoaderCircle className="animate-spin" aria-hidden="true" />
              ) : (
                <Camera aria-hidden="true" />
              )}
              {status === 'loading' ? 'Starting' : 'Start hand tracking'}
            </Button>
          </div>
        )}
        {running && (
          <span
            className={cn(
              'absolute left-2 top-2 rounded-full px-2 py-0.5 font-mono text-[10px] uppercase tracking-wider',
              handDetected ? 'bg-sun text-black' : 'bg-white/10 text-white/70',
            )}
          >
            {handDetected ? 'Hand locked' : 'Show your hand'}
          </span>
        )}
      </div>
      {error && (
        <p role="alert" className="border-t border-white/10 px-3 py-2 text-xs leading-relaxed text-red-300">
          {error}
        </p>
      )}
      {running && (
        <div className="flex items-center justify-between border-t border-white/10 px-3 py-2">
          <span className="font-mono text-[10px] uppercase tracking-wider text-white/50">MediaPipe Hands</span>
          <Button variant="ghost" size="xs" onClick={stop} className="text-white/70">
            <CameraOff aria-hidden="true" />
            Stop
          </Button>
        </div>
      )}
    </section>
    </>
  )
}
