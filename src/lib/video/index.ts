import { MockVideoAdapter } from './mockAdapter'
import { DailyVideoAdapter } from './dailyAdapter'
import type { VideoProvider } from './types'

export type { VideoProvider, VideoRoomInfo, VideoTokenInfo } from './types'

export function getVideoProvider(): VideoProvider {
  const provider = process.env.VIDEO_PROVIDER ?? 'mock'
  switch (provider) {
    case 'mock':
      return new MockVideoAdapter()
    case 'daily':
      return new DailyVideoAdapter()
    default:
      throw new Error(`Unknown VIDEO_PROVIDER "${provider}"`)
  }
}
