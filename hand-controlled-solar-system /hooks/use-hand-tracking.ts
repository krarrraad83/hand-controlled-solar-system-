'use client'

import { useCallback, useEffect, useRef } from 'react'
import type { HandLandmarker } from '@mediapipe/tasks-vision'
import { classifyGesture, indexTip, palmCenter, type Landmark } from '@/lib/gestures'
import { TARGET_FPS, handState, setAppState, type Gesture } from '@/lib/store'

const MEDIAPIPE_VERSION = '1.0.1'
const WASM_URL = `https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@${MEDIAPIPE_VERSION}/wasm`
const MODEL_URL =
  'https://storage.googleapis.com/mediapipe-models/hand_landmarker/hand_landmarker/float16/1/hand_landmarker.task'

const STABLE_FRAMES = 3
const SMOOTHING = 0.45

type Connection = { start: number; end: number }

function describeError(error: unknown) {
  if (error instanceof DOMException) {
    if (error.name === 'NotAllowedError') {
      return 'Camera access was blocked. Allow the camera, or open the preview in a new tab.'
    }
    if (error.name === 'NotFoundError') return 'No camera was found on this device.'
    if (error.name === 'NotReadableError') return 'The camera is already in use by another app.'
  }
  return 'Hand tracking could not start. Check your camera and try again.'
}

function drawHand(
  ctx: CanvasRenderingContext2D,
  landmarks: Landmark[],
  connections: Connection[],
  gesture: Gesture,
) {
  const { width, height } = ctx.canvas
  ctx.clearRect(0, 0, width, height)
  ctx.lineWidth = 3
  ctx.strokeStyle = gesture === 'none' ? 'rgba(255,255,255,0.6)' : 'rgba(255, 196, 92, 0.95)'
  ctx.beginPath()
  for (const { start, end } of connections) {
    ctx.moveTo(landmarks[start].x * width, landmarks[start].y * height)
    ctx.lineTo(landmarks[end].x * width, landmarks[end].y * height)
  }
  ctx.stroke()
  ctx.fillStyle = '#ffffff'
  for (const point of landmarks) {
    ctx.beginPath()
    ctx.arc(point.x * width, point.y * height, 3.5, 0, Math.PI * 2)
    ctx.fill()
  }
}

export function useHandTracking() {
  const videoRef = useRef<HTMLVideoElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const stopRef = useRef<(() => void) | null>(null)
  const startingRef = useRef(false)

  const stop = useCallback(() => {
    stopRef.current?.()
    stopRef.current = null
  }, [])

  const start = useCallback(async () => {
    const video = videoRef.current
    const canvas = canvasRef.current
    if (!video || !canvas || stopRef.current || startingRef.current) return
    startingRef.current = true
    try {
      await startTracking(video, canvas)
    } finally {
      startingRef.current = false
    }
  }, [])

  const startTracking = async (video: HTMLVideoElement, canvas: HTMLCanvasElement) => {

    if (!navigator.mediaDevices?.getUserMedia) {
      setAppState({ trackingStatus: 'error', trackingError: 'This browser does not support camera access.' })
      return
    }

    setAppState({ trackingStatus: 'loading', trackingError: null })

    let stream: MediaStream | null = null
    let landmarker: HandLandmarker | null = null
    let raf = 0

    const cleanup = () => {
      cancelAnimationFrame(raf)
      stream?.getTracks().forEach((track) => track.stop())
      landmarker?.close()
      video.srcObject = null
      handState.detected = false
      handState.gesture = 'none'
      handState.dwell = 0
      canvas.getContext('2d')?.clearRect(0, 0, canvas.width, canvas.height)
      setAppState({ trackingStatus: 'idle', handDetected: false, gesture: 'none', trackingFps: 0 })
    }

    try {
      const vision = await import('@mediapipe/tasks-vision')
      const filesetPromise = vision.FilesetResolver.forVisionTasks(WASM_URL)

      stream = await navigator.mediaDevices.getUserMedia({
        audio: false,
        video: {
          facingMode: 'user',
          width: { ideal: 640 },
          height: { ideal: 480 },
          frameRate: { ideal: TARGET_FPS, max: TARGET_FPS },
        },
      })

      const fileset = await filesetPromise
      const createWith = (delegate: 'GPU' | 'CPU') =>
        vision.HandLandmarker.createFromOptions(fileset, {
          baseOptions: { modelAssetPath: MODEL_URL, delegate },
          runningMode: 'VIDEO',
          numHands: 1,
          minHandDetectionConfidence: 0.6,
          minHandPresenceConfidence: 0.5,
          minTrackingConfidence: 0.5,
        })
      landmarker = await createWith('GPU').catch(() => createWith('CPU'))

      video.srcObject = stream
      await video.play()
      canvas.width = video.videoWidth || 640
      canvas.height = video.videoHeight || 480

      const ctx = canvas.getContext('2d')
      const connections = vision.HandLandmarker.HAND_CONNECTIONS as Connection[]
      const interval = 1000 / TARGET_FPS
      let last = performance.now()
      let lastVideoTime = -1
      let frames = 0
      let fpsWindowStart = last
      let candidate: Gesture = 'none'
      let candidateFrames = 0

      const tick = (now: number) => {
        raf = requestAnimationFrame(tick)
        if (now - last < interval - 1) return
        last = Math.max(last + interval, now - interval)

        if (now - fpsWindowStart >= 1000) {
          setAppState({ trackingFps: Math.round((frames * 1000) / (now - fpsWindowStart)) })
          frames = 0
          fpsWindowStart = now
        }

        if (!landmarker || video.readyState < 2 || video.currentTime === lastVideoTime) return
        lastVideoTime = video.currentTime

        const result = landmarker.detectForVideo(video, now)
        frames++
        const landmarks = result.landmarks[0] as Landmark[] | undefined

        if (!landmarks) {
          handState.detected = false
          handState.gesture = 'none'
          candidate = 'none'
          candidateFrames = 0
          ctx?.clearRect(0, 0, canvas.width, canvas.height)
          setAppState({ handDetected: false, gesture: 'none' })
          return
        }

        const palm = palmCenter(landmarks)
        const tip = indexTip(landmarks)
        if (!handState.detected) {
          handState.palm = palm
          handState.pointer = tip
        } else {
          handState.palm.x += (palm.x - handState.palm.x) * SMOOTHING
          handState.palm.y += (palm.y - handState.palm.y) * SMOOTHING
          handState.pointer.x += (tip.x - handState.pointer.x) * SMOOTHING
          handState.pointer.y += (tip.y - handState.pointer.y) * SMOOTHING
        }
        handState.detected = true

        const raw = classifyGesture(landmarks)
        if (raw === candidate) candidateFrames++
        else {
          candidate = raw
          candidateFrames = 1
        }
        if (candidateFrames >= STABLE_FRAMES) handState.gesture = candidate

        if (ctx) drawHand(ctx, landmarks, connections, handState.gesture)
        setAppState({ handDetected: true, gesture: handState.gesture })
      }

      raf = requestAnimationFrame(tick)
      stopRef.current = cleanup
      setAppState({ trackingStatus: 'running' })
    } catch (error) {
      console.log('[v0] Hand tracking failed to start:', error)
      cleanup()
      setAppState({ trackingStatus: 'error', trackingError: describeError(error) })
    }
  }

  useEffect(() => stop, [stop])

  return { videoRef, canvasRef, start, stop }
}
