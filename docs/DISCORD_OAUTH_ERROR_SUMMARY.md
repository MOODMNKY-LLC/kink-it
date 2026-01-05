# Discord OAuth Error - Quick Summary

## Error Message
```
GET /auth/discord/callback?error=invalid_scope&error_description=The+requested+scope+is+invalid%2C+unknown%2C+or+malformed.
AuthApiError: Invalid Refresh Token: Refresh Token Not Found
```

## What's Happening

Someone (or something) is trying to authenticate with Discord OAuth2, but:
1. ✅ Discord OAuth is **not configured** in Supabase (and not needed)
2. ✅ KINK IT uses **Notion OAuth** for user authentication
3. ✅ KINK IT uses **Discord Bot** for notifications (different thing)

## Is This a Problem?

**No** - This is expected behavior:
- The error is caught and handled correctly ✅
- Users are redirected back to login page ✅
- No functionality is broken ✅

## Why Does It Happen?

- Someone accidentally tries Discord authentication
- A bookmark or old link points to Discord OAuth
- Browser autocomplete suggests Discord login

## What Was Fixed

1. ✅ Improved error handling in `app/auth/callback/route.ts`
2. ✅ Added user-friendly error messages
3. ✅ Better handling of refresh token errors
4. ✅ Created documentation explaining the issue

## Current Status

- ✅ Error handling improved
- ✅ User-friendly messages added
- ✅ Documentation created
- ✅ No action required (unless you want Discord user auth)

## If You Want Discord User Authentication

See `docs/DISCORD_OAUTH_ERROR_FIX.md` for configuration instructions.

**Recommendation**: Keep current setup (Notion OAuth + Discord Bot) ✅


