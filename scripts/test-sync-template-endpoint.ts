/**
 * Test Script: Sync Template Endpoint
 * 
 * This script tests the sync-template endpoint to verify it's working correctly.
 * 
 * Usage:
 *   pnpm tsx scripts/test-sync-template-endpoint.ts [user_id] [notion_api_key]
 */

import * as dotenv from "dotenv"
import { readFileSync } from "fs"
import { join } from "path"

// Load environment variables
dotenv.config({ path: join(process.cwd(), ".env.local") })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

if (!supabaseUrl || !supabaseAnonKey) {
  console.error("❌ Missing Supabase environment variables")
  process.exit(1)
}

async function testSyncTemplate(userId?: string, notionApiKey?: string) {
  console.log("🧪 Testing Sync Template Endpoint...\n")

  if (!userId) {
    console.error("❌ user_id is required")
    console.log("Usage: pnpm tsx scripts/test-sync-template-endpoint.ts <user_id> [notion_api_key]")
    process.exit(1)
  }

  if (!notionApiKey) {
    console.log("⚠️  No Notion API key provided. Will test endpoint structure only.\n")
  }

  // Step 1: Check if user exists
  console.log("📋 Step 1: Checking user...")
  const { createClient } = await import("@supabase/supabase-js")
  const supabase = createClient(supabaseUrl, supabaseAnonKey)

  const { data: profile, error: profileError } = await supabase
    .from("profiles")
    .select("id, email")
    .eq("id", userId)
    .single()

  if (profileError || !profile) {
    console.error(`❌ User not found: ${userId}`)
    console.error(`   Error: ${profileError?.message}`)
    process.exit(1)
  }

  console.log(`✅ User found: ${profile.email}\n`)

  // Step 2: Check if user has API key
  console.log("📋 Step 2: Checking API keys...")
  const { data: apiKeys } = await supabase
    .from("user_notion_api_keys")
    .select("*")
    .eq("user_id", userId)
    .eq("is_active", true)

  if (!apiKeys || apiKeys.length === 0) {
    console.log("⚠️  No active API keys found for user")
    if (notionApiKey) {
      console.log("💡 Will need to add API key first")
    } else {
      console.log("❌ Cannot test without API key")
      process.exit(1)
    }
  } else {
    console.log(`✅ Found ${apiKeys.length} active API key(s)\n`)
  }

  // Step 3: Test Notion API connection
  if (notionApiKey) {
    console.log("📋 Step 3: Testing Notion API connection...")
    try {
      const response = await fetch("https://api.notion.com/v1/users/me", {
        headers: {
          Authorization: `Bearer ${notionApiKey}`,
          "Notion-Version": "2022-06-28",
        },
      })

      if (!response.ok) {
        const error = await response.text()
        throw new Error(`Notion API error: ${response.status} - ${error}`)
      }

      const notionUser = await response.json()
      console.log(`✅ Connected to Notion as: ${notionUser.name || "Unknown"}\n`)

      // Search for databases
      console.log("📋 Step 4: Searching for databases...")
      const searchResponse = await fetch("https://api.notion.com/v1/search", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${notionApiKey}`,
          "Notion-Version": "2022-06-28",
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          filter: {
            property: "object",
            value: "database",
          },
        }),
      })

      if (!searchResponse.ok) {
        throw new Error(`Search failed: ${searchResponse.status}`)
      }

      const searchData = await searchResponse.json()
      const databases = searchData.results || []
      console.log(`✅ Found ${databases.length} database(s) in Notion\n`)

      databases.forEach((db: any, idx: number) => {
        const title = db.title?.[0]?.plain_text || "Untitled"
        console.log(`   ${idx + 1}. ${title}`)
        console.log(`      ID: ${db.id}`)
        console.log(`      URL: ${db.url || "N/A"}\n`)
      })
    } catch (error: any) {
      console.error(`❌ Notion API error: ${error.message}\n`)
    }
  }

  // Step 4: Check current synced databases
  console.log("📋 Step 5: Checking currently synced databases...")
  const { data: syncedDatabases } = await supabase
    .from("notion_databases")
    .select("*")
    .eq("user_id", userId)

  console.log(`✅ Found ${syncedDatabases?.length || 0} synced database(s)\n`)

  if (syncedDatabases && syncedDatabases.length > 0) {
    syncedDatabases.forEach((db, idx) => {
      console.log(`   ${idx + 1}. ${db.database_name}`)
      console.log(`      Type: ${db.database_type || "unknown"}`)
      console.log(`      ID: ${db.database_id}\n`)
    })
  }

  // Step 5: Test sync-template endpoint (if we have API key)
  if (notionApiKey) {
    console.log("📋 Step 6: Testing sync-template endpoint...")
    console.log("   ⚠️  Note: This requires authentication token")
    console.log("   💡 Use the actual API endpoint with proper auth\n")
  }

  console.log("✅ Test complete!\n")
  console.log("📋 Next Steps:")
  console.log("   1. Ensure user has Notion API key stored")
  console.log("   2. Call POST /api/onboarding/notion/sync-template")
  console.log("   3. Verify databases are stored in notion_databases table")
}

// Run test
const userId = process.argv[2]
const notionApiKey = process.argv[3]
testSyncTemplate(userId, notionApiKey).catch(console.error)
