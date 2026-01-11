/**
 * Script: Get Notion Database IDs
 * 
 * This script uses your production Notion API key to retrieve all database IDs
 * from your Notion workspace. Use this to find the database IDs needed for FDW.
 * 
 * Usage:
 *   pnpm tsx scripts/get-notion-database-ids.ts
 */

import * as dotenv from "dotenv"
import { readFileSync } from "fs"
import { join } from "path"

// Load environment variables
dotenv.config({ path: join(process.cwd(), ".env.local") })

const notionApiKey = process.env.NOTION_API_KEY_PROD!

if (!notionApiKey) {
  console.error("❌ NOTION_API_KEY_PROD not found in .env.local")
  process.exit(1)
}

async function getNotionDatabaseIds() {
  console.log("🔍 Fetching database IDs from Notion workspace...")
  console.log(`🔑 Using API Key: ${notionApiKey.substring(0, 10)}...\n`)

  try {
    // Search for all databases in workspace
    const response = await fetch("https://api.notion.com/v1/search", {
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

    if (!response.ok) {
      const error = await response.text()
      throw new Error(`Notion API error: ${response.status} - ${error}`)
    }

    const data = await response.json()
    const databases = data.results || []

    if (databases.length === 0) {
      console.log("⚠️  No databases found in workspace")
      console.log("💡 Make sure your API key has access to the workspace")
      return
    }

    console.log(`✅ Found ${databases.length} database(s):\n`)

    databases.forEach((db: any, index: number) => {
      const dbId = db.id
      const title =
        db.title?.[0]?.plain_text ||
        db.title ||
        "Untitled Database"
      const url = db.url || `https://notion.so/${dbId.replace(/-/g, "")}`

      console.log(`${index + 1}. ${title}`)
      console.log(`   ID: ${dbId}`)
      console.log(`   URL: ${url}`)
      console.log("")

      // Try to identify database type by title
      const titleLower = title.toLowerCase()
      let suggestedType = "unknown"

      if (titleLower.includes("image") || titleLower.includes("generation")) {
        suggestedType = "image_generations"
      } else if (
        titleLower.includes("kinkster") ||
        titleLower.includes("profile") ||
        titleLower.includes("character")
      ) {
        suggestedType = "kinkster_profiles"
      } else if (titleLower.includes("task")) {
        suggestedType = "tasks"
      } else if (titleLower.includes("idea")) {
        suggestedType = "ideas"
      }

      if (suggestedType !== "unknown") {
        console.log(`   💡 Suggested type: ${suggestedType}`)
        console.log(
          `   📝 SQL: INSERT INTO notion_databases (database_type, database_id, database_name, user_id) VALUES ('${suggestedType}', '${dbId}', '${title}', NULL);`
        )
      }
      console.log("")
    })

    console.log("\n📋 Next Steps:")
    console.log("1. Copy the database IDs you need")
    console.log("2. Insert them into notion_databases table:")
    console.log("   INSERT INTO notion_databases (database_type, database_id, database_name, user_id)")
    console.log("   VALUES ('image_generations', 'YOUR-DB-ID', 'Image Generations', NULL);")
    console.log("3. Run: SELECT * FROM public.setup_notion_fdw_tables();")
  } catch (error: any) {
    console.error("❌ Error fetching databases:", error.message)
    if (error.message.includes("401") || error.message.includes("403")) {
      console.error("\n💡 Check that:")
      console.error("   - Your API key is valid")
      console.error("   - The API key has access to the workspace")
      console.error("   - The integration is added to the databases")
    }
    process.exit(1)
  }
}

getNotionDatabaseIds()
