/**
 * Edge Function: Setup Notion FDW Foreign Server
 * 
 * This function creates the Notion FDW foreign server using the production
 * Notion API key from environment variables. It should be called once during
 * initial setup or when the API key needs to be rotated.
 * 
 * Usage:
 * POST /functions/v1/setup-notion-fdw
 * Headers: Authorization: Bearer <service_role_key>
 */

import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2"

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
}

serve(async (req) => {
  // Handle CORS
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders })
  }

  try {
    // Get service role key for admin operations
    const supabaseUrl = Deno.env.get("SUPABASE_URL") ?? ""
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
    
    if (!supabaseServiceKey) {
      throw new Error("SUPABASE_SERVICE_ROLE_KEY not configured")
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey)

    // Get Notion API key from environment
    const notionApiKey = Deno.env.get("NOTION_API_KEY_PROD") ?? ""
    
    if (!notionApiKey) {
      throw new Error("NOTION_API_KEY_PROD not configured in environment variables")
    }

    // Store API key in Vault (secure storage)
    const { data: vaultData, error: vaultError } = await supabase
      .rpc("vault_create_secret", {
        name: "notion_service_account_api_key",
        secret: notionApiKey,
      })
      .catch(() => {
        // If RPC doesn't exist, try direct insert
        return supabase
          .from("vault.secrets")
          .insert({
            name: "notion_service_account_api_key",
            secret: notionApiKey,
          })
          .select("id")
          .single()
      })

    let vaultKeyId: string | null = null

    if (vaultData && !vaultError) {
      vaultKeyId = vaultData.id || (vaultData as any).id
    } else {
      // Try to get existing secret
      const { data: existing } = await supabase
        .from("vault.secrets")
        .select("id")
        .eq("name", "notion_service_account_api_key")
        .single()
        .catch(() => ({ data: null }))

      if (existing) {
        vaultKeyId = existing.id
      }
    }

    // Create or update foreign server
    const createServerSQL = vaultKeyId
      ? `
        DO $$
        BEGIN
          IF NOT EXISTS (
            SELECT 1 FROM pg_foreign_server WHERE srvname = 'notion_service_account_server'
          ) THEN
            CREATE SERVER notion_service_account_server
            FOREIGN DATA WRAPPER wasm_wrapper
            OPTIONS (
              fdw_package_url 'https://github.com/supabase/wrappers/releases/download/wasm_notion_fdw_v0.1.1/notion_fdw.wasm',
              fdw_package_name 'supabase:notion-fdw',
              fdw_package_version '0.1.1',
              fdw_package_checksum '6dea3014f462aafd0c051c37d163fe326e7650c26a7eb5d8017a30634b5a46de',
              api_key_id '${vaultKeyId}'
            );
          ELSE
            ALTER SERVER notion_service_account_server
            OPTIONS (
              SET api_key_id '${vaultKeyId}'
            );
          END IF;
        END $$;
      `
      : `
        DO $$
        BEGIN
          IF NOT EXISTS (
            SELECT 1 FROM pg_foreign_server WHERE srvname = 'notion_service_account_server'
          ) THEN
            CREATE SERVER notion_service_account_server
            FOREIGN DATA WRAPPER wasm_wrapper
            OPTIONS (
              fdw_package_url 'https://github.com/supabase/wrappers/releases/download/wasm_notion_fdw_v0.1.1/notion_fdw.wasm',
              fdw_package_name 'supabase:notion-fdw',
              fdw_package_version '0.1.1',
              fdw_package_checksum '6dea3014f462aafd0c051c37d163fe326e7650c26a7eb5d8017a30634b5a46de',
              api_key '${notionApiKey}'
            );
          ELSE
            ALTER SERVER notion_service_account_server
            OPTIONS (
              SET api_key '${notionApiKey}'
            );
          END IF;
        END $$;
      `

    const { data: serverData, error: serverError } = await supabase.rpc("exec_sql", {
      sql: createServerSQL,
    })

    if (serverError) {
      console.error("Error creating foreign server:", serverError)
      throw serverError
    }

    // Call setup function to create foreign tables
    const { data: setupData, error: setupError } = await supabase.rpc("setup_notion_fdw_tables")

    return new Response(
      JSON.stringify({
        success: true,
        message: "Notion FDW foreign server created successfully",
        vault_key_id: vaultKeyId,
        server_created: true,
        tables_setup: setupData !== null,
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      }
    )
  } catch (error: any) {
    console.error("Setup error:", error)
    return new Response(
      JSON.stringify({
        success: false,
        error: error.message || "Failed to setup Notion FDW",
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 500,
      }
    )
  }
})
