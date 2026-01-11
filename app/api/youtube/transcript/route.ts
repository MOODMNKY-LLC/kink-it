import { NextRequest, NextResponse } from "next/server"
import { getUserProfile } from "@/lib/auth/get-user"
import { YoutubeTranscript } from "youtube-transcript"
import { extractVideoId } from "@/lib/youtube/youtube-transcript"

/**
 * POST /api/youtube/transcript
 * Fetch transcript from a YouTube video URL using youtube-transcript package
 */
export async function POST(request: NextRequest) {
  try {
    const profile = await getUserProfile()
    if (!profile) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const body = await request.json()
    const { videoUrl, videoId } = body

    if (!videoUrl && !videoId) {
      return NextResponse.json(
        { error: "videoUrl or videoId is required" },
        { status: 400 }
      )
    }

    // Extract video ID from URL if provided
    let finalVideoId = videoId
    if (videoUrl) {
      const extractedId = extractVideoId(videoUrl)
      if (!extractedId) {
        return NextResponse.json(
          { error: "Invalid YouTube URL. Could not extract video ID." },
          { status: 400 }
        )
      }
      finalVideoId = extractedId
    }

    try {
      // Use youtube-transcript package to fetch transcript
      const transcriptData = await YoutubeTranscript.fetchTranscript(finalVideoId)
      
      // Transform to our format
      const transcript = transcriptData.map((item) => ({
        start: item.offset / 1000, // Convert ms to seconds
        duration: item.duration / 1000, // Convert ms to seconds
        end: (item.offset + item.duration) / 1000,
        text: item.text.trim(),
      }))
      
      const fullText = transcript.map((t) => t.text).join(" ")
      const duration = transcript[transcript.length - 1]?.end || 0
      
      return NextResponse.json({
        videoId: finalVideoId,
        transcript,
        fullText,
        language: "en",
        duration,
        segmentCount: transcript.length,
      })
    } catch (fetchError: any) {
      console.error("Error fetching YouTube transcript:", fetchError)
      
      // Handle specific error cases
      if (fetchError.message?.includes("Transcript is disabled")) {
        return NextResponse.json(
          { 
            error: "Transcript not available for this video. The video may not have captions enabled.",
            videoId: finalVideoId
          },
          { status: 404 }
        )
      }
      
      if (fetchError.message?.includes("Could not retrieve a transcript")) {
        return NextResponse.json(
          { 
            error: "Could not retrieve transcript. The video may not have captions available.",
            videoId: finalVideoId
          },
          { status: 404 }
        )
      }
      
      return NextResponse.json(
        { 
          error: "Failed to fetch transcript",
          details: fetchError.message || "Unknown error",
          videoId: finalVideoId
        },
        { status: 500 }
      )
    }
  } catch (error) {
    console.error("YouTube transcript API error:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}
