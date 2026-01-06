/**
 * API Route: Setup Notion FDW Foreign Server
 * 
 * This endpoint sets up the Notion FDW using the production Notion API key
 * from environment variables. It should be called once during initial setup.
 * 
 * POST /api/admin/notion/setup-fdw
 * Requires: Admin authentication
 */

import { createClient } from "@/lib/supabase/server"
import { NextRequest, NextResponse } from "next/server"

export async function POST(request: NextRequest) {
  try {
    const supabase = createClient()
    
    // Check authentication
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Check admin role
    const { data: profile } = await supabase
      .from("profiles")
      .select("system_role, dynamic_role")
      .eq("id", user.id)
      .single()

    const isAdmin = profile?.system_role === "admin" || profile?.dynamic_role === "dominant"
    if (!isAdmin) {
      return NextResponse.json({ error: "Admin access required" }, { status: 403 })
    }

    // Get Notion API key from environment
    const notionApiKey = process.env.NOTION_API_KEY_PROD
    if (!notionApiKey) {
      return NextResponse.json(
        { error: "NOTION_API_KEY_PROD not configured in environment variables" },
        { status: 500 }
      )
    }

    // Use service role client for admin operations
    const supabaseAdmin = createClient({
      supabaseUrl: process.env.NEXT_PUBLIC_SUPABASE_URL!,
      supabaseKey: process.env.SUPABASE_SERVICE_ROLE_KEY!,
    })

    // Store API key in Vault (if possible) or use directly
    // Note: Vault operations may require direct SQL access
    // For now, we'll create the server with direct API key

    // Check if server already exists
    const { data: existingServer } = await supabaseAdmin
      .from("pg_foreign_server")
      .select("srvname")
      .eq("srvname", "notion_service_account_server")
      .single()
      .catch(() => ({ data: null }))

    // Create foreign server using the function that accepts API key
    const { data: serverData, error: serverError } = await supabaseAdmin.rpc(
      "create_notion_fdw_server",
      { api_key_value: notionApiKey }
    )

    if (serverError) {
      console.error("Error creating foreign server:", serverError)
      return NextResponse.json(
        { error: `Failed to create foreign server: ${serverError.message}` },
        { status: 500 }
      )
    }

    // Setup foreign tables
    const { data: tablesData, error: tablesError } = await supabaseAdmin.rpc(
      "setup_notion_fdw_tables"
    )

    return NextResponse.json({
      success: true,
      message: "Notion FDW setup completed successfully",
      server_status: serverData || "Created/Updated",
      tables_setup: tablesData || [],
      api_key_configured: !!notionApiKey,
      api_key_prefix: notionApiKey.substring(0, 10) + "...",
      next_steps: [
        "Test FDW: SELECT * FROM notion_fdw.image_generations_all LIMIT 1;",
        "Test admin view: SELECT * FROM public.admin_image_generations_all LIMIT 1;",
        "Test admin search: SELECT * FROM public.admin_search_image_generations('test', auth.uid(), 10);",
      ],
    })
  } catch (error: any) {
    console.error("FDW setup error:", error)
    return NextResponse.json(
      { error: error.message || "Failed to setup Notion FDW" },
      { status: 500 }
    )
  }
}

