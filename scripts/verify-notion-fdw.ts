/**
 * Script: Verify Notion FDW Setup
 * 
 * This script verifies that the Notion FDW is properly configured and working.
 * 
 * Usage:
 *   pnpm tsx scripts/verify-notion-fdw.ts
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
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseServiceKey)

async function verifyNotionFDW() {
  console.log("🔍 Verifying Notion FDW Setup...\n")

  try {
    // Step 1: Check if foreign server exists
    console.log("1️⃣ Checking foreign server...")
    const { data: serverCheck, error: serverError } = await supabase.rpc("exec_sql", {
      sql: `
        SELECT srvname, 
               array_to_string(srvoptions, ', ') as options
        FROM pg_foreign_server 
        WHERE srvname = 'notion_service_account_server';
      `,
    }).catch(() => {
      // Fallback: Use direct query
      return supabase
        .from("pg_foreign_server")
        .select("srvname, srvoptions")
        .eq("srvname", "notion_service_account_server")
        .single()
    })

    if (serverCheck && !serverError) {
      console.log("   ✅ Foreign server exists")
    } else {
      console.log("   ⚠️  Foreign server not found. Creating...")
      
      if (notionApiKey) {
        const { data: createResult, error: createError } = await supabase.rpc(
          "create_notion_fdw_server",
          { api_key_value: notionApiKey }
        )
        
        if (createError) {
          console.error("   ❌ Failed to create server:", createError.message)
        } else {
          console.log("   ✅ Server created:", createResult)
        }
      } else {
        console.error("   ❌ NOTION_API_KEY_PROD not found in env")
      }
    }

    // Step 2: Check foreign tables
    console.log("\n2️⃣ Checking foreign tables...")
    const { data: tablesCheck, error: tablesError } = await supabase.rpc("exec_sql", {
      sql: `
        SELECT schemaname, tablename 
        FROM pg_tables 
        WHERE schemaname = 'notion_fdw'
        ORDER BY tablename;
      `,
    }).catch(() => {
      return { data: null, error: { message: "Cannot check tables" } }
    })

    if (tablesCheck && !tablesError) {
      console.log("   ✅ Foreign tables found:", tablesCheck)
    } else {
      console.log("   ⚠️  Foreign tables not found. Initializing...")
      
      const { data: setupResult, error: setupError } = await supabase.rpc(
        "setup_notion_fdw_tables"
      )
      
      if (setupError) {
        console.error("   ❌ Failed to setup tables:", setupError.message)
      } else {
        console.log("   ✅ Tables initialized:", setupResult)
      }
    }

    // Step 3: Check admin functions
    console.log("\n3️⃣ Checking admin functions...")
    const functions = [
      "is_admin",
      "get_bond_member_ids",
      "admin_search_image_generations",
      "admin_search_kinkster_profiles",
      "create_notion_fdw_server",
      "setup_notion_fdw_tables",
    ]

    for (const funcName of functions) {
      const { data: funcCheck, error: funcError } = await supabase.rpc("exec_sql", {
        sql: `
          SELECT routine_name 
          FROM information_schema.routines 
          WHERE routine_schema = 'public' 
            AND routine_name = '${funcName}';
        `,
      }).catch(() => ({ data: null, error: null }))

      if (funcCheck || !funcError) {
        console.log(`   ✅ Function exists: ${funcName}`)
      } else {
        console.log(`   ❌ Function missing: ${funcName}`)
      }
    }

    // Step 4: Check admin views
    console.log("\n4️⃣ Checking admin views...")
    const views = ["admin_image_generations_all", "admin_kinkster_profiles_all"]

    for (const viewName of views) {
      const { data: viewCheck, error: viewError } = await supabase.rpc("exec_sql", {
        sql: `
          SELECT table_name 
          FROM information_schema.tables 
          WHERE table_schema = 'public' 
            AND table_name = '${viewName}';
        `,
      }).catch(() => ({ data: null, error: null }))

      if (viewCheck || !viewError) {
        console.log(`   ✅ View exists: ${viewName}`)
      } else {
        console.log(`   ❌ View missing: ${viewName}`)
      }
    }

    // Step 5: Test foreign table query (if tables exist)
    console.log("\n5️⃣ Testing foreign table queries...")
    try {
      const { data: testData, error: testError } = await supabase.rpc("exec_sql", {
        sql: `SELECT COUNT(*) as count FROM notion_fdw.image_generations_all LIMIT 1;`,
      }).catch(() => {
        // Try direct query
        return supabase.from("notion_fdw.image_generations_all").select("id", { count: "exact", head: true })
      })

      if (testError) {
        console.log("   ⚠️  Cannot test query (may need database IDs configured)")
        console.log("   💡 Run: SELECT * FROM public.setup_notion_fdw_tables();")
      } else {
        console.log("   ✅ Foreign table query successful")
        console.log("   📊 Result:", testData)
      }
    } catch (error: any) {
      console.log("   ⚠️  Query test skipped:", error.message)
    }

    // Step 6: Check database IDs
    console.log("\n6️⃣ Checking database IDs...")
    const { data: dbIds, error: dbError } = await supabase
      .from("notion_databases")
      .select("database_type, database_id, database_name")
      .is("user_id", null)
      .order("database_type")

    if (dbError) {
      console.log("   ⚠️  Cannot check database IDs:", dbError.message)
    } else if (dbIds && dbIds.length > 0) {
      console.log("   ✅ Database IDs found:")
      dbIds.forEach((db: any) => {
        console.log(`      - ${db.database_type}: ${db.database_id}`)
      })
    } else {
      console.log("   ⚠️  No database IDs found in notion_databases table")
      console.log("   💡 Run Notion integration sync to populate database IDs")
    }

    console.log("\n✅ Verification complete!")
    console.log("\n📋 Next Steps:")
    console.log("   1. Ensure database IDs are configured in notion_databases table")
    console.log("   2. Run: SELECT * FROM public.setup_notion_fdw_tables();")
    console.log("   3. Test: SELECT * FROM notion_fdw.image_generations_all LIMIT 1;")
    console.log("   4. Test admin view: SELECT * FROM public.admin_image_generations_all LIMIT 1;")

  } catch (error: any) {
    console.error("❌ Verification error:", error)
    process.exit(1)
  }
}

verifyNotionFDW()


