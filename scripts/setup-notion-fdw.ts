/**
 * Script: Setup Notion FDW with Production API Key
 * 
 * This script sets up the Notion Foreign Data Wrapper using the production
 * Notion API key from environment variables.
 * 
 * Usage:
 *   pnpm tsx scripts/setup-notion-fdw.ts
 * 
 * Prerequisites:
 *   - NOTION_API_KEY_PROD must be set in .env.local
 *   - Supabase must be running (supabase start)
 *   - Must have admin/service role access
 */

import { createClient } from "@supabase/supabase-js"
import * as dotenv from "dotenv"
import { readFileSync } from "fs"
import { join } from "path"

// Load environment variables
dotenv.config({ path: join(process.cwd(), ".env.local") })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!
const notionApiKey = process.env.NOTION_API_KEY_PROD!

if (!supabaseUrl || !supabaseServiceKey) {
  console.error("❌ Missing Supabase configuration")
  console.error("   Required: NEXT_PUBLIC_SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY")
  process.exit(1)
}

if (!notionApiKey) {
  console.error("❌ Missing Notion API key")
  console.error("   Required: NOTION_API_KEY_PROD")
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseServiceKey)

async function setupNotionFDW() {
  console.log("🚀 Setting up Notion FDW with production API key...")
  console.log(`📍 Supabase URL: ${supabaseUrl}`)
  console.log(`🔑 Notion API Key: ${notionApiKey.substring(0, 10)}...`)

  try {
    // Step 1: Store API key in Vault
    console.log("\n📦 Step 1: Storing API key in Vault...")
    
    // Try to insert or update vault secret
    // Note: Vault operations may require direct SQL
    const vaultSQL = `
      INSERT INTO vault.secrets (name, secret)
      VALUES ('notion_service_account_api_key', $1)
      ON CONFLICT (name) 
      DO UPDATE SET secret = EXCLUDED.secret
      RETURNING id;
    `

    // Since we can't directly execute SQL with parameters via Supabase client,
    // we'll need to use the migration file approach or Edge Function
    console.log("   ⚠️  Vault storage requires direct SQL access")
    console.log("   💡 Run this SQL manually:")
    console.log(`   INSERT INTO vault.secrets (name, secret) VALUES ('notion_service_account_api_key', '${notionApiKey}') ON CONFLICT (name) DO UPDATE SET secret = EXCLUDED.secret RETURNING id;`)

    // Step 2: Create foreign server
    console.log("\n🔧 Step 2: Creating foreign server...")
    
    const createServerSQL = `
      DO $$
      DECLARE
        vault_key_id TEXT;
      BEGIN
        -- Try to get Vault key ID
        SELECT id::TEXT INTO vault_key_id
        FROM vault.secrets
        WHERE name = 'notion_service_account_api_key'
        LIMIT 1;

        IF vault_key_id IS NOT NULL THEN
          -- Create server with Vault key
          IF NOT EXISTS (
            SELECT 1 FROM pg_foreign_server WHERE srvname = 'notion_service_account_server'
          ) THEN
            EXECUTE format('
              CREATE SERVER notion_service_account_server
              FOREIGN DATA WRAPPER wasm_wrapper
              OPTIONS (
                fdw_package_url ''https://github.com/supabase/wrappers/releases/download/wasm_notion_fdw_v0.1.1/notion_fdw.wasm'',
                fdw_package_name ''supabase:notion-fdw'',
                fdw_package_version ''0.1.1'',
                fdw_package_checksum ''6dea3014f462aafd0c051c37d163fe326e7650c26a7eb5d8017a30634b5a46de'',
                api_key_id %L
              )', vault_key_id);
            RAISE NOTICE 'Created foreign server with Vault key';
          ELSE
            EXECUTE format('
              ALTER SERVER notion_service_account_server
              OPTIONS (
                SET api_key_id %L
              )', vault_key_id);
            RAISE NOTICE 'Updated foreign server with Vault key';
          END IF;
        ELSE
          -- Fallback: Use API key directly (less secure)
          IF NOT EXISTS (
            SELECT 1 FROM pg_foreign_server WHERE srvname = 'notion_service_account_server'
          ) THEN
            EXECUTE format('
              CREATE SERVER notion_service_account_server
              FOREIGN DATA WRAPPER wasm_wrapper
              OPTIONS (
                fdw_package_url ''https://github.com/supabase/wrappers/releases/download/wasm_notion_fdw_v0.1.1/notion_fdw.wasm'',
                fdw_package_name ''supabase:notion-fdw'',
                fdw_package_version ''0.1.1'',
                fdw_package_checksum ''6dea3014f462aafd0c051c37d163fe326e7650c26a7eb5d8017a30634b5a46de'',
                api_key %L
              )', '${notionApiKey}');
            RAISE NOTICE 'Created foreign server with direct API key';
          ELSE
            EXECUTE format('
              ALTER SERVER notion_service_account_server
              OPTIONS (
                SET api_key %L
              )', '${notionApiKey}');
            RAISE NOTICE 'Updated foreign server with direct API key';
          END IF;
        END IF;
      END $$;
    `

    // Execute via Supabase REST API (using rpc if available, or direct SQL)
    console.log("   ⚠️  Foreign server creation requires direct SQL access")
    console.log("   💡 Run the migration file: supabase/migrations/20260201000002_setup_notion_fdw_admin.sql")
    console.log("   💡 Or execute this SQL in Supabase SQL Editor:")
    console.log("\n" + createServerSQL + "\n")

    // Step 3: Setup foreign tables
    console.log("\n📊 Step 3: Setting up foreign tables...")
    console.log("   💡 After server is created, run:")
    console.log("   SELECT public.setup_notion_fdw_tables();")

    console.log("\n✅ Setup instructions generated!")
    console.log("\n📋 Next Steps:")
    console.log("   1. Store API key in Vault (see SQL above)")
    console.log("   2. Create foreign server (see SQL above)")
    console.log("   3. Run: SELECT public.setup_notion_fdw_tables();")
    console.log("   4. Test: SELECT * FROM notion_fdw.image_generations_all LIMIT 1;")

  } catch (error: any) {
    console.error("❌ Setup error:", error)
    process.exit(1)
  }
}

setupNotionFDW()


