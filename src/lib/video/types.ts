export interface VideoRoomInfo {
  roomRef: string
  // Present for hosted-embed providers (e.g. Daily) — the URL the client
  // embeds/joins. Absent for the mock adapter, which never makes a real
  // remote connection.
  url: string | null
}

export interface VideoTokenInfo {
  provider: 'mock' | 'daily'
  roomRef: string
  url: string | null
  token: string
}

/// Adapter over whichever HIPAA-eligible video vendor is configured. Never
/// build custom WebRTC signaling/TURN infrastructure in-house for this —
/// see COMPLIANCE.md for why a vetted, BAA-covered vendor is the right call
/// for anything touching a real clinical video visit.
export interface VideoProvider {
  ensureRoom(appointmentId: string): Promise<VideoRoomInfo>
  generateToken(roomRef: string, identity: string): Promise<string>
}
