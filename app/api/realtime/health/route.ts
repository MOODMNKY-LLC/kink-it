import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

/**
 * GET /api/realtime/health
 * Healthcheck endpoint for Supabase Realtime connection
 * Returns connection status and latency information
 */
export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient()
    
    const startTime = Date.now()
    
    // Check authentication
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json(
        { 
          status: "unauthorized",
          connected: false,
          error: "Authentication required"
        },
        { status: 401 }
      )
    }

    // Try to create a test channel to verify Realtime connectivity
    const testChannel = supabase.channel("healthcheck", {
      config: {
        broadcast: { self: true, ack: true },
        private: true,
      },
    })

    let connectionStatus = "checking"
    let latency = 0

    try {
      // Attempt to subscribe (with timeout)
      const subscribePromise = new Promise<boolean>((resolve) => {
        const timeout = setTimeout(() => {
          resolve(false)
        }, 5000) // 5 second timeout

        testChannel
          .subscribe((status, err) => {
            clearTimeout(timeout)
            if (status === "SUBSCRIBED") {
              connectionStatus = "connected"
              latency = Date.now() - startTime
              resolve(true)
            } else if (status === "CHANNEL_ERROR" || status === "TIMED_OUT") {
              connectionStatus = "disconnected"
              resolve(false)
            }
          })
      })

      const connected = await subscribePromise

      // Clean up test channel
      await supabase.removeChannel(testChannel)

      return NextResponse.json({
        status: connectionStatus,
        connected,
        latency: latency || null,
        timestamp: new Date().toISOString(),
        userId: user.id,
      })
    } catch (error) {
      // Clean up on error
      await supabase.removeChannel(testChannel).catch(() => {})
      
      return NextResponse.json({
        status: "error",
        connected: false,
        error: error instanceof Error ? error.message : "Unknown error",
        timestamp: new Date().toISOString(),
      }, { status: 500 })
    }
  } catch (error) {
    console.error("[Realtime Healthcheck] Error:", error)
    return NextResponse.json(
      {
        status: "error",
        connected: false,
        error: error instanceof Error ? error.message : "Internal server error",
        timestamp: new Date().toISOString(),
      },
      { status: 500 }
    )
  }
}
