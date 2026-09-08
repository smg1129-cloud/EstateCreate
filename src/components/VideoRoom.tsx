'use client'

import { useEffect, useRef, useState } from 'react'
import type { DailyCall } from '@daily-co/daily-js'

export function VideoRoom({ appointmentId }: { appointmentId: string }) {
  const localVideoRef = useRef<HTMLVideoElement>(null)
  const dailyContainerRef = useRef<HTMLDivElement>(null)
  const [status, setStatus] = useState<'connecting' | 'connected' | 'error'>('connecting')
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const [provider, setProvider] = useState<string | null>(null)
  const [muted, setMuted] = useState(false)
  const [cameraOff, setCameraOff] = useState(false)
  const localStreamRef = useRef<MediaStream | null>(null)

  useEffect(() => {
    let cancelled = false
    let dailyCallFrame: DailyCall | null = null

    async function connect() {
      try {
        const res = await fetch('/api/video/token', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ appointmentId }),
        })
        if (!res.ok) throw new Error('Could not start visit — please try again.')
        const data = (await res.json()) as { provider: string; token: string; url: string | null }
        if (cancelled) return
        setProvider(data.provider)

        if (data.provider === 'daily' && data.url) {
          const { default: Daily } = await import('@daily-co/daily-js')
          if (cancelled || !dailyContainerRef.current) return
          dailyCallFrame = Daily.createFrame(dailyContainerRef.current, {
            iframeStyle: { width: '100%', height: '100%', border: '0' },
            showLeaveButton: false,
          })
          await dailyCallFrame.join({ url: data.url, token: data.token })
        } else {
          // Mock mode: local camera preview only, no real remote connection.
          const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true })
          if (cancelled) {
            stream.getTracks().forEach((t) => t.stop())
            return
          }
          localStreamRef.current = stream
          if (localVideoRef.current) localVideoRef.current.srcObject = stream
        }

        setStatus('connected')
      } catch (err) {
        if (cancelled) return
        setStatus('error')
        setErrorMessage(err instanceof Error ? err.message : 'Could not start the visit.')
      }
    }

    connect()

    return () => {
      cancelled = true
      localStreamRef.current?.getTracks().forEach((t) => t.stop())
      dailyCallFrame?.destroy()
    }
  }, [appointmentId])

  function toggleMute() {
    localStreamRef.current?.getAudioTracks().forEach((t) => (t.enabled = muted))
    setMuted((m) => !m)
  }

  function toggleCamera() {
    localStreamRef.current?.getVideoTracks().forEach((t) => (t.enabled = cameraOff))
    setCameraOff((c) => !c)
  }

  return (
    <div className="rounded-lg border border-gray-200 bg-gray-900 p-4">
      {status === 'error' && (
        <p role="alert" className="mb-3 rounded-md bg-red-50 px-3 py-2 text-sm text-red-800">
          {errorMessage}
        </p>
      )}
      {provider === 'mock' && status === 'connected' && (
        <p className="mb-3 rounded-md bg-amber-50 px-3 py-2 text-xs text-amber-900">
          Demo mode — showing your camera locally only. No real remote video connection is made until a
          production video vendor (Daily) is configured.
        </p>
      )}

      {provider === 'daily' ? (
        <div ref={dailyContainerRef} className="aspect-video w-full overflow-hidden rounded-md bg-black" />
      ) : (
        <div className="grid gap-3 sm:grid-cols-2">
          <video ref={localVideoRef} autoPlay muted playsInline className="aspect-video w-full rounded-md bg-black" />
          <div className="flex aspect-video w-full items-center justify-center rounded-md bg-black text-xs text-gray-500">
            Waiting for a real video vendor to be configured
          </div>
        </div>
      )}

      {provider === 'mock' && (
        <div className="mt-4 flex justify-center gap-3">
          <button onClick={toggleMute} className="rounded-md bg-gray-700 px-4 py-2 text-sm text-white hover:bg-gray-600">
            {muted ? 'Unmute' : 'Mute'}
          </button>
          <button onClick={toggleCamera} className="rounded-md bg-gray-700 px-4 py-2 text-sm text-white hover:bg-gray-600">
            {cameraOff ? 'Turn camera on' : 'Turn camera off'}
          </button>
        </div>
      )}
    </div>
  )
}
