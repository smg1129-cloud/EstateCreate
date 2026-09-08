import crypto from 'crypto'
import type { VideoProvider, VideoRoomInfo } from './types'

/// Local-dev stand-in. Returns a fake room ref and an opaque token; the
/// client (VideoRoom.tsx) renders a local camera preview only — it never
/// attempts a real peer connection in this mode.
export class MockVideoAdapter implements VideoProvider {
  async ensureRoom(appointmentId: string): Promise<VideoRoomInfo> {
    return { roomRef: `mock-room-${appointmentId}`, url: null }
  }

  async generateToken(roomRef: string, identity: string): Promise<string> {
    return Buffer.from(`mock-token:${roomRef}:${identity}:${crypto.randomUUID()}`).toString('base64')
  }
}
