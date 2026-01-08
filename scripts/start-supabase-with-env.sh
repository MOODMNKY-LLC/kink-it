#!/bin/bash
# Start Supabase with Notion OAuth environment variables
# Note: Set these environment variables in your shell or .env.local before running

export SUPABASE_AUTH_EXTERNAL_NOTION_CLIENT_ID="${SUPABASE_AUTH_EXTERNAL_NOTION_CLIENT_ID:-}"
export SUPABASE_AUTH_EXTERNAL_NOTION_SECRET="${SUPABASE_AUTH_EXTERNAL_NOTION_SECRET:-}"

cd "$(dirname "$0")/.."
supabase start
