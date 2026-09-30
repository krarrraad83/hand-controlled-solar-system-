'use client'

import { useState } from 'react'
import { Camera, ExternalLink, Hand, HandGrab, LoaderCircle, Pointer, RotateCcw, ZoomIn } from 'lucide-react'
import { Button } from '@/components/ui/button'
import type { TrackingStatus } from '@/lib/store'

const PREVIEW = [
  { icon: Hand, label: 'Orbit' },
  { icon: ZoomIn, label: 'Zoom' },
  { icon: Pointer, label: 'Select' },
  { icon: RotateCcw, label: 'Reset' },
  { icon: HandGrab, label: 'Freeze' },
]

type TrackingOverlayProps = {
  status: TrackingStatus
  error: string | null
  onStart: () => void
}

/** Full-screen start-up screen shown until the camera and hand model are running. */
export function TrackingOverlay({ status, error, onStart }: TrackingOverlayProps) {
  const [dismissed, setDismissed] = useState(false)
  if (status === 'running' || dismissed) return null

  const loading = status === 'loading'
  const failed = status === 'error'

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="tracking-overlay-title"
      className="pointer-events-auto fixed inset-0 z-40 flex items-center justify-center bg-black/55 p-4 backdrop-blur-sm"
    >
      <div className="flex w-full max-w-md flex-col items-center gap-5 rounded-2xl border border-white/10 bg-black/75 p-6 text-center md:p-8">
        <div className="flex size-14 items-center justify-center rounded-full bg-sun text-black">
          {loading ? <LoaderCircle className="size-7 animate-spin" aria-hidden="true" /> : <Hand className="size-7" aria-hidden="true" />}
        </div>

        <div className="flex flex-col gap-2">
          <h2 id="tracking-overlay-title" className="text-balance text-xl font-semibold tracking-tight text-white">
            {loading ? 'Waking up hand control' : failed ? 'Camera needed' : 'Control the planets with your hand'}
          </h2>
          <p className="text-pretty text-sm leading-relaxed text-white/60">
            {loading
              ? 'Allow camera access when your browser asks. The hand model is loading.'
              : failed
                ? error
                : 'Your webcam tracks your hand at 60 frames per second. Nothing is recorded or uploaded.'}
          </p>
        </div>

        <ul className="grid w-full grid-cols-5 gap-2" aria-label="Available gestures">
          {PREVIEW.map(({ icon: Icon, label }) => (
            <li key={label} className="flex flex-col items-center gap-1.5 rounded-lg bg-white/5 px-1 py-2.5">
              <Icon className="size-4 text-sun" aria-hidden="true" />
              <span className="font-mono text-[10px] uppercase tracking-wider text-white/60">{label}</span>
            </li>
          ))}
        </ul>

        <div className="flex w-full flex-col gap-2">
          <Button size="lg" onClick={onStart} disabled={loading} className="w-full bg-sun text-black hover:bg-sun/85">
            {loading ? <LoaderCircle className="animate-spin" aria-hidden="true" /> : <Camera aria-hidden="true" />}
            {loading ? 'Starting camera' : failed ? 'Try again' : 'Start hand control'}
          </Button>
          {failed && (
            <Button
              size="lg"
              variant="outline"
              onClick={() => window.open(window.location.href, '_blank', 'noopener,noreferrer')}
              className="w-full border-white/15 bg-transparent text-white hover:bg-white/10 hover:text-white"
            >
              <ExternalLink aria-hidden="true" />
              Open in a new tab
            </Button>
          )}
          <button
            type="button"
            onClick={() => setDismissed(true)}
            className="mt-1 text-xs text-white/45 underline-offset-4 transition-colors hover:text-white/80 hover:underline"
          >
            Continue without camera
          </button>
        </div>
      </div>
    </div>
  )
}
