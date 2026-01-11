# Discord Bot Redirect URI Configuration

**Date**: 2026-01-27  
**Issue**: Bot not appearing in server after authentication  
**Solution**: Configure redirect URI in Discord Developer Portal

---

## 🔍 Current Redirect URI

Your app generates the redirect URI dynamically:

**Code Location**: `app/api/auth/discord/guild-install/route.ts`

\`\`\`typescript
const redirectUri = `${request.nextUrl.origin}/api/auth/discord/callback`
\`\`\`

This means:
- **Local Development**: `http://localhost:3000/api/auth/discord/callback`
- **Production**: `https://your-domain.com/api/auth/discord/callback`

---

## ✅ Required Configuration

### Step 1: Add Redirect URI to Discord Developer Portal

1. Go to [Discord Developer Portal](https://discord.com/developers/applications)
2. Select your **KINK IT** application
3. Click **"OAuth2"** in the left sidebar
4. Click **"General"** tab
5. Scroll to **"Redirects"** section
6. Click **"Add Redirect"**

### Step 2: Add Redirect URIs

Add **both** development and production URLs:

#### For Local Development:
\`\`\`
http://localhost:3000/api/auth/discord/callback
\`\`\`

#### For Production (when deployed):
\`\`\`
https://your-domain.com/api/auth/discord/callback
\`\`\`

**Important Notes**:
- ✅ Discord requires **exact match** of redirect URI
- ✅ Include the full path: `/api/auth/discord/callback`
- ✅ Use `http://` for localhost, `https://` for production
- ✅ No trailing slashes

---

## 🔧 Alternative: Use Environment Variable

If you want to use a fixed redirect URI, you can update the code:

### Option 1: Environment Variable (Recommended)

**Update**: `app/api/auth/discord/guild-install/route.ts`

\`\`\`typescript
const redirectUri = process.env.NEXT_PUBLIC_DISCORD_REDIRECT_URI || `${request.nextUrl.origin}/api/auth/discord/callback`
\`\`\`

**Add to `.env.local`**:
\`\`\`bash
# Discord OAuth Redirect URI
NEXT_PUBLIC_DISCORD_REDIRECT_URI=http://localhost:3000/api/auth/discord/callback
\`\`\`

**For Production**:
\`\`\`bash
NEXT_PUBLIC_DISCORD_REDIRECT_URI=https://your-domain.com/api/auth/discord/callback
\`\`\`

### Option 2: Hardcode for Development

**Update**: `app/api/auth/discord/guild-install/route.ts`

\`\`\`typescript
// For development
const redirectUri = "http://localhost:3000/api/auth/discord/callback"

// For production, use:
// const redirectUri = "https://your-domain.com/api/auth/discord/callback"
\`\`\`

---

## 🐛 Troubleshooting

### Issue: "Invalid redirect_uri" Error

**Symptom**: Discord shows error about invalid redirect URI

**Solution**:
1. ✅ Verify redirect URI in Discord Developer Portal matches exactly
2. ✅ Check for trailing slashes (should be none)
3. ✅ Ensure using correct protocol (`http://` for localhost, `https://` for production)
4. ✅ Verify the path is `/api/auth/discord/callback` (not `/auth/discord/callback`)

### Issue: Bot Not Appearing in Server

**Symptom**: Authentication succeeds but bot doesn't appear

**Possible Causes**:

1. **Redirect URI Mismatch**
   - ✅ Check Discord Developer Portal redirect URIs
   - ✅ Verify they match exactly what your app sends

2. **Missing Bot Scope**
   - ✅ Verify OAuth URL includes `scope=bot`
   - ✅ Check guild install route includes bot scope

3. **Permissions Issue**
   - ✅ Verify you have "Manage Server" permission
   - ✅ Check bot permissions were granted during OAuth

4. **Bot Not Running**
   - ✅ Bot appears offline until it connects
   - ✅ Check server member list (bot may be there but offline)

### Issue: Callback Not Receiving Parameters

**Symptom**: Callback route doesn't receive `guild_id` or `code`

**Solution**:
1. ✅ Check browser console for errors
2. ✅ Verify redirect URI is correct
3. ✅ Check callback route logs
4. ✅ Ensure state parameter matches

---

## 🔍 Verification Steps

### 1. Check Redirect URI in Code

Verify your redirect URI matches what's in Discord:

\`\`\`typescript
// In app/api/auth/discord/guild-install/route.ts
console.log("Redirect URI:", redirectUri)
\`\`\`

### 2. Check Discord Developer Portal

1. Go to OAuth2 → General
2. Verify redirect URIs are listed
3. Ensure they match your app's redirect URI exactly

### 3. Test OAuth Flow

1. Start your dev server: `pnpm dev`
2. Navigate to: `http://localhost:3000/api/auth/discord/guild-install`
3. You should be redirected to Discord
4. After authorization, check the callback URL
5. Verify `guild_id` parameter is present

### 4. Check Server Member List

1. Go to your Discord server
2. Check member list
3. Look for your bot name
4. Bot may appear offline (this is normal)

---

## 📋 Complete Checklist

- [ ] Redirect URI added to Discord Developer Portal
- [ ] Redirect URI matches exactly (no trailing slashes)
- [ ] Using correct protocol (`http://` for localhost)
- [ ] Bot scope included in OAuth URL
- [ ] Permissions granted during OAuth
- [ ] Callback route receives `guild_id` parameter
- [ ] Bot appears in server member list (may be offline)

---

## 🎯 Quick Fix

**Most Common Issue**: Redirect URI not added to Discord Developer Portal

**Quick Solution**:
1. Go to Discord Developer Portal → OAuth2 → General
2. Add redirect: `http://localhost:3000/api/auth/discord/callback`
3. Save changes
4. Try OAuth flow again

---

## 📝 Code Reference

**Guild Install Route**: `app/api/auth/discord/guild-install/route.ts`
- Generates OAuth URL with `bot` scope
- Sets redirect URI dynamically
- Stores state in cookie for CSRF protection

**Callback Route**: `app/api/auth/discord/callback/route.ts`
- Receives `code` and `guild_id` from Discord
- Exchanges code for access token
- Stores guild ID in user profile
- Redirects back to onboarding

---

**Last Updated**: 2026-01-27  
**Status**: Ready for Configuration
