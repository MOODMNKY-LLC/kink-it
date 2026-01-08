#!/bin/bash
# Script to set Vercel environment variables for production Supabase

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Load environment variables
if [ -f .env.local ]; then
  source .env.local
else
  echo -e "${RED}Error: .env.local not found${NC}"
  exit 1
fi

# Check if VERCEL_ACCESS_TOKEN is set
if [ -z "$VERCEL_ACCESS_TOKEN" ]; then
  echo -e "${RED}Error: VERCEL_ACCESS_TOKEN not found in .env.local${NC}"
  exit 1
fi

# Project configuration
PROJECT_ID="prj_j1cfDo37sJwQctAX6JwG6gErupez"
TEAM_ID="team_4VdnVxvnFkQg6uxXYa1mNpsN"
API_URL="https://api.vercel.com/v9/projects/${PROJECT_ID}/env?teamId=${TEAM_ID}"

# Production Supabase configuration
SUPABASE_URL="https://rbloeqwxivfzxmfropek.supabase.co"

echo -e "${GREEN}🚀 Setting Vercel Environment Variables${NC}"
echo ""

# Check if production anon key is provided
if [ -z "$PRODUCTION_SUPABASE_ANON_KEY" ]; then
  echo -e "${YELLOW}⚠️  Production Supabase Anon Key not provided${NC}"
  echo ""
  echo "To get it:"
  echo "1. Go to: https://supabase.com/dashboard/project/rbloeqwxivfzxmfropek/settings/api"
  echo "2. Copy the 'anon' or 'public' key"
  echo "3. Set it as: export PRODUCTION_SUPABASE_ANON_KEY='your-key-here'"
  echo ""
  echo "Or run this script with:"
  echo "  PRODUCTION_SUPABASE_ANON_KEY='your-key' ./scripts/set-vercel-env-vars.sh"
  echo ""
  exit 1
fi

# Set NEXT_PUBLIC_SUPABASE_URL
echo -e "${GREEN}📝 Setting NEXT_PUBLIC_SUPABASE_URL...${NC}"
RESPONSE=$(curl -s -X POST "$API_URL" \
  -H "Authorization: Bearer ${VERCEL_ACCESS_TOKEN}" \
  -H "Content-Type: application/json" \
  -d "{
    \"key\": \"NEXT_PUBLIC_SUPABASE_URL\",
    \"value\": \"${SUPABASE_URL}\",
    \"type\": \"encrypted\",
    \"target\": [\"production\", \"preview\", \"development\"]
  }")

if echo "$RESPONSE" | grep -q "error"; then
  echo -e "${RED}Error setting NEXT_PUBLIC_SUPABASE_URL:${NC}"
  echo "$RESPONSE" | jq '.' 2>/dev/null || echo "$RESPONSE"
else
  echo -e "${GREEN}✅ NEXT_PUBLIC_SUPABASE_URL set successfully${NC}"
fi

echo ""

# Set NEXT_PUBLIC_SUPABASE_ANON_KEY
echo -e "${GREEN}📝 Setting NEXT_PUBLIC_SUPABASE_ANON_KEY...${NC}"
RESPONSE=$(curl -s -X POST "$API_URL" \
  -H "Authorization: Bearer ${VERCEL_ACCESS_TOKEN}" \
  -H "Content-Type: application/json" \
  -d "{
    \"key\": \"NEXT_PUBLIC_SUPABASE_ANON_KEY\",
    \"value\": \"${PRODUCTION_SUPABASE_ANON_KEY}\",
    \"type\": \"encrypted\",
    \"target\": [\"production\", \"preview\", \"development\"]
  }")

if echo "$RESPONSE" | grep -q "error"; then
  echo -e "${RED}Error setting NEXT_PUBLIC_SUPABASE_ANON_KEY:${NC}"
  echo "$RESPONSE" | jq '.' 2>/dev/null || echo "$RESPONSE"
else
  echo -e "${GREEN}✅ NEXT_PUBLIC_SUPABASE_ANON_KEY set successfully${NC}"
fi

echo ""
echo -e "${GREEN}✅ Environment variables set!${NC}"
echo ""
echo "Next steps:"
echo "1. Redeploy your application in Vercel Dashboard"
echo "2. Or trigger a new deployment by pushing to your main branch"
echo "3. Verify the Edge Function connection works in production"
