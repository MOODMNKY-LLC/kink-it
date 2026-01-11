/**
 * YouTube Transcript Utilities
 * 
 * Helper functions for working with YouTube transcripts
 */

export interface TranscriptSegment {
  start: number
  duration: number
  end: number
  text: string
}

export interface YouTubeTranscript {
  videoId: string
  transcript: TranscriptSegment[]
  fullText: string
  language: string
  duration: number
}

/**
 * Extract video ID from YouTube URL
 */
export function extractVideoId(url: string): string | null {
  const patterns = [
    /(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([^&\n?#]+)/,
    /youtube\.com\/.*[?&]v=([^&\n?#]+)/,
  ]
  
  for (const pattern of patterns) {
    const match = url.match(pattern)
    if (match && match[1]) {
      return match[1]
    }
  }
  
  return null
}

/**
 * Format transcript segments into readable text with timestamps
 */
export function formatTranscriptWithTimestamps(
  transcript: TranscriptSegment[],
  includeTimestamps = true
): string {
  if (!includeTimestamps) {
    return transcript.map((seg) => seg.text).join(" ")
  }
  
  return transcript
    .map((seg) => {
      const minutes = Math.floor(seg.start / 60)
      const seconds = Math.floor(seg.start % 60)
      const timestamp = `${minutes}:${seconds.toString().padStart(2, "0")}`
      return `[${timestamp}] ${seg.text}`
    })
    .join("\n")
}

/**
 * Search transcript for specific keywords or phrases
 */
export function searchTranscript(
  transcript: TranscriptSegment[],
  query: string
): TranscriptSegment[] {
  const lowerQuery = query.toLowerCase()
  return transcript.filter((seg) =>
    seg.text.toLowerCase().includes(lowerQuery)
  )
}

/**
 * Get transcript segment at specific timestamp
 */
export function getSegmentAtTime(
  transcript: TranscriptSegment[],
  timeInSeconds: number
): TranscriptSegment | null {
  return (
    transcript.find(
      (seg) => seg.start <= timeInSeconds && seg.end >= timeInSeconds
    ) || null
  )
}
