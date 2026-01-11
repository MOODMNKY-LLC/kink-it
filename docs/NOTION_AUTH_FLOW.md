# Notion OAuth Authentication Flow

## 🔄 Complete Authentication Flow

Here's exactly what happens when a user authenticates with Notion in your app:

### Step 1: User Initiates OAuth

**Location:** `app/auth/login/page.tsx`

When user clicks **"Continue with Notion"** button:

\`\`\`typescript
const handleNotionLogin = async () => {
  const supabase = createClient()
  setIsOAuthLoading(true)
  
  const { error } = await supabase.auth.signInWithOAuth({
    provider: "notion",
    options: {
      redirectTo: `${window.location.origin}/auth/callback`,
    },
  })
}
\`\`\`

**What happens:**
- ✅ Supabase generates OAuth authorization URL
- ✅ User is redirected to Notion OAuth page
- ✅ User authenticates with Notion

### Step 2: Notion Redirects to Supabase

**Flow:**
1. Notion authenticates the user
2. Notion redirects to: `https://127.0.0.1:55321/auth/v1/callback?code=...`
3. Supabase processes the OAuth callback
4. Supabase redirects to your app: `http://localhost:3000/auth/callback?code=...`

### Step 3: App Handles Callback

**Location:** `app/auth/callback/route.ts`

\`\`\`typescript
export async function GET(request: NextRequest) {
  const code = requestUrl.searchParams.get("code")
  const error = requestUrl.searchParams.get("error")
  
  // Handle errors
  if (error) {
    return NextResponse.redirect("/auth/login?error=...")
  }
  
  // Exchange code for session
  if (code) {
    const supabase = await createClient()
    const { error } = await supabase.auth.exchangeCodeForSession(code)
    
    if (error) {
      return NextResponse.redirect("/auth/login?error=...")
    }
  }
  
  // Redirect to home page
  return NextResponse.redirect(new URL("/", requestUrl.origin))
}
\`\`\`

**What happens:**
- ✅ Extracts `code` from URL query parameters
- ✅ Exchanges authorization code for user session
- ✅ Supabase sets authentication cookies
- ✅ Redirects user to home page (`/`)

### Step 4: Database Trigger Creates Profile

**Location:** `scripts/002_create_profiles.sql`

When a new user is created in `auth.users`, a database trigger automatically fires:

\`\`\`sql
create trigger on_auth_user_created
  after insert on auth.users
  for each row
  execute function public.handle_new_user();
\`\`\`

**The trigger function:**
\`\`\`sql
create or replace function public.handle_new_user()
returns trigger
as $$
begin
  -- Check if this is the first user (becomes admin)
  select count(*) into user_count from auth.users;
  is_admin := (user_count = 1);
  
  -- Insert profile with user data
  insert into public.profiles (
    id, 
    email, 
    full_name, 
    display_name, 
    dynamic_role,
    system_role,
    love_languages
  )
  values (
    new.id,
    new.email,
    coalesce(new.raw_user_meta_data->>'full_name', ''),
    coalesce(new.raw_user_meta_data->>'display_name', split_part(new.email, '@', 1)),
    coalesce((new.raw_user_meta_data->>'dynamic_role')::dynamic_role, 'submissive'),
    case when is_admin then 'admin'::user_role else 'user'::user_role end,
    coalesce((select array_agg(x) from jsonb_array_elements_text(new.raw_user_meta_data->'love_languages') x), array[]::text[])
  );
  
  return new;
end;
$$;
\`\`\`

**What happens:**
- ✅ Profile is automatically created in `profiles` table
- ✅ First user becomes `admin`, others become `user`
- ✅ Default `dynamic_role` is `submissive` (if not provided)
- ✅ `display_name` defaults to email username if not provided

### Step 5: Middleware Updates Session

**Location:** `middleware.ts` → `lib/supabase/middleware.ts`

On every request (except `/auth/*` routes):

\`\`\`typescript
export async function middleware(request: NextRequest) {
  if (request.nextUrl.pathname.startsWith("/auth/")) {
    return NextResponse.next()
  }
  
  return await updateSession(request)
}
\`\`\`

**What `updateSession` does:**
- ✅ Refreshes user session from cookies
- ✅ Updates session tokens if needed
- ✅ Ensures user stays authenticated

### Step 6: Home Page Loads

**Location:** `app/page.tsx`

\`\`\`typescript
export default async function DashboardOverview() {
  await requireAuth()  // Redirects to /auth/login if not authenticated
  const profile = await getUserProfile()  // Fetches profile from database
  
  return (
    <DashboardPageLayout>
      {profile && (
        <div>
          <h2>Welcome back, {profile.display_name || profile.full_name}</h2>
          <p>Role: {profile.role}</p>
        </div>
      )}
      {/* Dashboard content */}
    </DashboardPageLayout>
  )
}
\`\`\`

**What happens:**
- ✅ `requireAuth()` checks if user is authenticated
- ✅ If not authenticated → redirects to `/auth/login`
- ✅ If authenticated → fetches user profile
- ✅ Displays welcome message with user's name and role
- ✅ Shows dashboard content

### Step 7: Layout Checks Authentication

**Location:** `app/layout.tsx`

\`\`\`typescript
export default async function RootLayout({ children }) {
  const user = await getCurrentUser()  // Returns null if not authenticated
  
  let profile: Profile | null = null
  if (user) {
    const supabase = await createClient()
    const { data } = await supabase
      .from("profiles")
      .select("*")
      .eq("id", user.id)
      .single()
    profile = data
  }
  
  return (
    <html>
      <body>
        {profile ? (
          // Show dashboard layout with sidebar
          <SidebarProvider>
            <DashboardSidebar profile={profile} />
            {children}
          </SidebarProvider>
        ) : (
          // Show auth pages without sidebar
          <>{children}</>
        )}
      </body>
    </html>
  )
}
\`\`\`

**What happens:**
- ✅ Checks if user is authenticated
- ✅ If authenticated → fetches profile and shows dashboard layout
- ✅ If not authenticated → shows auth pages without sidebar

## 📊 Complete Flow Diagram

\`\`\`
User clicks "Continue with Notion"
         ↓
Supabase generates OAuth URL
         ↓
User redirected to Notion
         ↓
User authenticates with Notion
         ↓
Notion redirects to Supabase callback
         ↓
Supabase processes OAuth
         ↓
Supabase redirects to /auth/callback?code=...
         ↓
App exchanges code for session
         ↓
Database trigger creates profile (if new user)
         ↓
User redirected to home page (/)
         ↓
Middleware refreshes session
         ↓
Home page checks authentication
         ↓
Home page fetches profile
         ↓
Dashboard displayed with user info
\`\`\`

## 🔐 Session Management

### How Sessions Work

1. **Session Storage:** Stored in HTTP-only cookies (set by Supabase)
2. **Session Refresh:** Middleware automatically refreshes sessions
3. **Session Expiry:** Default JWT expiry is 1 hour (configurable)

### Authentication State

- **Client-side:** Use `createClient()` from `lib/supabase/client.ts`
- **Server-side:** Use `createClient()` from `lib/supabase/server.ts`
- **Middleware:** Automatically refreshes sessions on every request

## 👤 Profile Creation

### Automatic Profile Creation

When a user authenticates for the first time:

1. **User created** in `auth.users` table (by Supabase)
2. **Trigger fires** → `handle_new_user()` function
3. **Profile created** in `profiles` table with:
   - User ID (from `auth.users`)
   - Email (from Notion OAuth)
   - Display name (from email or Notion metadata)
   - System role (`admin` for first user, `user` for others)
   - Dynamic role (`submissive` by default)

### Profile Fields

\`\`\`typescript
interface Profile {
  id: string                    // UUID from auth.users
  email: string                 // From Notion OAuth
  full_name: string | null      // From Notion metadata
  display_name: string | null   // From Notion or email username
  system_role: 'admin' | 'user' // First user = admin
  dynamic_role: 'dominant' | 'submissive' | 'switch' // Default: submissive
  partner_id: string | null     // Linked partner profile
  love_languages: string[]      // Empty array by default
  hard_limits: string[]         // Empty array by default
  soft_limits: string[]         // Empty array by default
  notifications_enabled: boolean // Default: true
  theme_preference: string      // Default: 'dark'
}
\`\`\`

## 🚨 Error Handling

### OAuth Errors

If OAuth fails:
- User redirected to `/auth/login?error=...`
- Error message displayed on login page

### Session Exchange Errors

If code exchange fails:
- User redirected to `/auth/login?error=...`
- Error message displayed

### Profile Fetch Errors

If profile doesn't exist:
- `getUserProfile()` returns `null`
- App may show error or redirect to profile setup

## 🔍 Key Files

| File | Purpose |
|------|---------|
| `app/auth/login/page.tsx` | Initiates OAuth flow |
| `app/auth/callback/route.ts` | Handles OAuth callback |
| `lib/supabase/client.ts` | Client-side Supabase client |
| `lib/supabase/server.ts` | Server-side Supabase client |
| `lib/supabase/middleware.ts` | Session refresh middleware |
| `middleware.ts` | Next.js middleware entry |
| `lib/auth/get-user.ts` | Auth helper functions |
| `scripts/002_create_profiles.sql` | Profile creation trigger |
| `app/page.tsx` | Home page (dashboard) |
| `app/layout.tsx` | Root layout (checks auth) |

## 🎯 What Happens After Authentication

### For New Users

1. ✅ User account created in `auth.users`
2. ✅ Profile automatically created in `profiles` table
3. ✅ First user becomes `admin`, others become `user`
4. ✅ Redirected to home page (`/`)
5. ✅ Dashboard displayed with welcome message

### For Returning Users

1. ✅ Session refreshed
2. ✅ Profile fetched from database
3. ✅ Redirected to home page (`/`)
4. ✅ Dashboard displayed with user info

## 📝 Notes

- **No manual profile creation needed** - Trigger handles it automatically
- **First user is admin** - Useful for initial setup
- **Default role is submissive** - Can be changed later
- **Sessions auto-refresh** - Middleware handles it
- **Auth pages bypass middleware** - `/auth/*` routes don't check auth

## 🔗 Related Documentation

- [FIX_SUPABASE_HTTPS_ERROR.md](./FIX_SUPABASE_HTTPS_ERROR.md) - HTTPS setup
- [NOTION_OAUTH_HTTPS_SETUP.md](../NOTION_OAUTH_HTTPS_SETUP.md) - OAuth configuration
- [AUTH_VERIFICATION.md](../AUTH_VERIFICATION.md) - Auth setup verification
