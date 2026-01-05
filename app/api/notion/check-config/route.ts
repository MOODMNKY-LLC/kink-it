import { NextResponse } from "next/server"

export async function GET() {
  // Check if Notion API key is configured
  const notionApiKey = process.env.NOTION_API_KEY
  const databaseId = process.env.NOTION_APP_IDEAS_DATABASE_ID || "cc491ef5f0a64eac8e05a6ea10dfb735"

  return NextResponse.json({
    configured: !!notionApiKey,
    databaseId: databaseId,
  })
}
