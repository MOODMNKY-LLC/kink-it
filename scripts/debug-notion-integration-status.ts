/**
 * Debug Script: Notion Integration Status
 * 
 * This script helps debug why databases aren't showing as synced
 * even though there's a connection.
 * 
 * Usage:
 *   pnpm tsx scripts/debug-notion-integration-status.ts [user_id]
 */

import * as dotenv from "dotenv"
import { readFileSync } from "fs"
import { join } from "path"
import { createClient } from "@supabase/supabase-js"

// Load environment variables
dotenv.config({ path: join(process.cwd(), ".env.local") })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

if (!supabaseUrl || !supabaseAnonKey) {
  console.error("❌ Missing Supabase environment variables")
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseAnonKey)

async function debugIntegrationStatus(userId?: string) {
  console.log("🔍 Debugging Notion Integration Status...\n")

  // Step 1: Check if user_id provided or get from auth
  let targetUserId = userId

  if (!targetUserId) {
    console.log("⚠️  No user_id provided. Checking all users...\n")
  } else {
    console.log(`👤 Checking user: ${targetUserId}\n`)
  }

  // Step 2: Check user_notion_api_keys
  console.log("📋 Step 1: Checking user_notion_api_keys...")
  const { data: apiKeys, error: apiKeysError } = await supabase
    .from("user_notion_api_keys")
    .select("*")
    .order("created_at", { ascending: false })

  if (apiKeysError) {
    console.error("❌ Error fetching API keys:", apiKeysError)
  } else {
    console.log(`✅ Found ${apiKeys?.length || 0} API key(s)`)
    if (apiKeys && apiKeys.length > 0) {
      apiKeys.forEach((key, idx) => {
        console.log(`   ${idx + 1}. User: ${key.user_id}`)
        console.log(`      Name: ${key.key_name}`)
        console.log(`      Hash: ${key.key_hash}`)
        console.log(`      Active: ${key.is_active}`)
        console.log(`      Last Validated: ${key.last_validated_at || "Never"}`)
        console.log("")
      })
    } else {
      console.log("   ⚠️  No API keys found. Users need to add their Notion API key.\n")
    }
  }

  // Step 3: Check notion_databases
  console.log("📋 Step 2: Checking notion_databases...")
  let databasesQuery = supabase
    .from("notion_databases")
    .select("*")
    .order("created_at", { ascending: false })

  if (targetUserId) {
    databasesQuery = databasesQuery.eq("user_id", targetUserId)
  }

  const { data: databases, error: databasesError } = await databasesQuery

  if (databasesError) {
    console.error("❌ Error fetching databases:", databasesError)
  } else {
    console.log(`✅ Found ${databases?.length || 0} database(s)`)
    if (databases && databases.length > 0) {
      const groupedByType = databases.reduce((acc: any, db: any) => {
        if (!acc[db.database_type || "unknown"]) {
          acc[db.database_type || "unknown"] = []
        }
        acc[db.database_type || "unknown"].push(db)
        return acc
      }, {})

      Object.entries(groupedByType).forEach(([type, dbs]: [string, any]) => {
        console.log(`   📊 ${type}: ${dbs.length} database(s)`)
        dbs.forEach((db: any, idx: number) => {
          console.log(`      ${idx + 1}. ${db.database_name}`)
          console.log(`         ID: ${db.database_id}`)
          console.log(`         User: ${db.user_id}`)
          console.log(`         Created: ${db.created_at}`)
        })
        console.log("")
      })
    } else {
      console.log("   ⚠️  No databases found in notion_databases table.\n")
      console.log("   💡 This means:")
      console.log("      - Users haven't synced their Notion template yet")
      console.log("      - OR the sync process failed")
      console.log("      - OR databases weren't stored correctly\n")
    }
  }

  // Step 4: Check expected database types
  console.log("📋 Step 3: Expected database types...")
  const expectedTypes = [
    "image_generations",
    "kinkster_profiles",
    "tasks",
    "ideas",
  ]

  expectedTypes.forEach((type) => {
    const count = databases?.filter((db) => db.database_type === type).length || 0
    const status = count > 0 ? "✅" : "❌"
    console.log(`   ${status} ${type}: ${count} database(s)`)
  })
  console.log("")

  // Step 5: Check profiles vs auth.users relationship
  console.log("📋 Step 4: Checking user relationships...")
  if (targetUserId) {
    const { data: profile } = await supabase
      .from("profiles")
      .select("id, email")
      .eq("id", targetUserId)
      .single()

    if (profile) {
      console.log(`   ✅ Profile exists: ${profile.email}`)
    } else {
      console.log(`   ❌ Profile not found for user_id: ${targetUserId}`)
    }
  } else {
    console.log("   ⚠️  Skipping (no user_id provided)")
  }
  console.log("")

  // Step 6: Test integration status endpoint logic
  console.log("📋 Step 5: Simulating integration status check...")
  if (targetUserId) {
    const userDatabases = databases?.filter((db) => db.user_id === targetUserId) || []
    const userApiKeys = apiKeys?.filter((key) => key.user_id === targetUserId && key.is_active) || []

    console.log(`   API Keys: ${userApiKeys.length > 0 ? "✅ Connected" : "❌ Not Connected"}`)
    console.log(`   Databases: ${userDatabases.length > 0 ? `✅ ${userDatabases.length} synced` : "❌ None synced"}`)

    if (userApiKeys.length > 0 && userDatabases.length === 0) {
      console.log("\n   🔍 ISSUE IDENTIFIED:")
      console.log("      User has API key but no databases synced.")
      console.log("      Possible causes:")
      console.log("      1. User hasn't completed onboarding sync")
      console.log("      2. Sync process failed silently")
      console.log("      3. Database discovery failed")
      console.log("      4. Database storage failed\n")
    }
  } else {
    console.log("   ⚠️  Skipping (no user_id provided)")
  }

  // Step 7: Recommendations
  console.log("📋 Step 6: Recommendations...\n")
  
  if (!apiKeys || apiKeys.length === 0) {
    console.log("   1. Users need to add their Notion API key:")
    console.log("      POST /api/notion/api-keys")
    console.log("      { key_name: '...', api_key: '...' }\n")
  }

  if (!databases || databases.length === 0) {
    console.log("   2. Users need to sync their Notion template:")
    console.log("      POST /api/onboarding/notion/sync-template")
    console.log("      This should discover and store databases.\n")
  }

  if (apiKeys && apiKeys.length > 0 && (!databases || databases.length === 0)) {
    console.log("   3. Check sync-template endpoint logs for errors")
    console.log("   4. Verify Notion API key has access to databases")
    console.log("   5. Check if database discovery is working correctly\n")
  }

  console.log("✅ Debug complete!\n")
}

// Run debug
const userId = process.argv[2]
debugIntegrationStatus(userId).catch(console.error)
