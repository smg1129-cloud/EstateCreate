import type { VideoProvider, VideoRoomInfo } from './types'

const DAILY_API_BASE = 'https://api.daily.co/v1'

/// Real adapter for Daily.co (offers a HIPAA BAA on qualifying plans —
/// confirm one is signed before any real visit uses this). Rooms and
/// meeting tokens are created via Daily's REST API; the browser joins
/// using @daily-co/daily-js (see VideoRoom.tsx).
export class DailyVideoAdapter implements VideoProvider {
  private apiKey: string

  constructor() {
    const { DAILY_API_KEY } = process.env
    if (!DAILY_API_KEY) {
      throw new Error('Daily video is not configured — set DAILY_API_KEY')
    }
    this.apiKey = DAILY_API_KEY
  }

  private async request(path: string, init: RequestInit) {
    const res = await fetch(`${DAILY_API_BASE}${path}`, {
      ...init,
      headers: {
        Authorization: `Bearer ${this.apiKey}`,
        'Content-Type': 'application/json',
        ...init.headers,
      },
    })
    if (!res.ok) {
      const body = await res.text()
      throw new Error(`Daily API error (${res.status}): ${body}`)
    }
    return res.json()
  }

  async ensureRoom(appointmentId: string): Promise<VideoRoomInfo> {
    const name = `visit-${appointmentId}`

    try {
      const existing = await this.request(`/rooms/${name}`, { method: 'GET' })
      return { roomRef: name, url: existing.url }
    } catch {
      // Not found — create it. Private room: only holders of a
      // meeting token (generateToken below) can join.
      const created = await this.request('/rooms', {
        method: 'POST',
        body: JSON.stringify({
          name,
          privacy: 'private',
          properties: { enable_chat: false, enable_recording: 'off', exp: Math.floor(Date.now() / 1000) + 60 * 60 * 6 },
        }),
      })
      return { roomRef: name, url: created.url }
    }
  }

  async generateToken(roomRef: string, identity: string): Promise<string> {
    const result = await this.request('/meeting-tokens', {
      method: 'POST',
      body: JSON.stringify({
        properties: {
          room_name: roomRef,
          user_name: identity,
          exp: Math.floor(Date.now() / 1000) + 60 * 60,
        },
      }),
    })
    return result.token
  }
}
