import { getUserProfile } from "@/lib/auth/get-user"
import { UserNav } from "@/components/auth/user-nav"
import { Bell } from "lucide-react"
import { Button } from "@/components/ui/button"

export async function DashboardHeader() {
  const profile = await getUserProfile()

  return (
    <header className="sticky top-0 z-50 w-full border-b border-zinc-800/50 bg-zinc-950/95 backdrop-blur supports-[backdrop-filter]:bg-zinc-950/60">
      <div className="flex h-16 items-center justify-between px-6">
        <div className="flex items-center gap-4">
          <h1 className="text-xl font-bold bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">
            KINK IT
          </h1>
        </div>

        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" className="text-zinc-400 hover:text-zinc-100">
            <Bell className="h-5 w-5" />
          </Button>

          {profile && <UserNav profile={profile} />}
        </div>
      </div>
    </header>
  )
}
