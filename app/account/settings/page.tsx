import { getUserProfile } from "@/lib/auth/get-user"
import { redirect } from "next/navigation"
import { SettingsForm } from "@/components/account/settings-form"
import { Card } from "@/components/ui/card"
import { BorderBeam } from "@/components/ui/border-beam"
import { MagicCard } from "@/components/ui/magic-card"

export default async function SettingsPage() {
  const profile = await getUserProfile()

  if (!profile) {
    redirect("/auth/login")
  }

  return (
    <div className="space-y-6">
      {/* Settings Form Card */}
      <div className="relative">
        <MagicCard
          className="p-6"
          gradientFrom="hsl(var(--primary))"
          gradientTo="hsl(var(--accent))"
        >
          <Card className="border-primary/20 bg-card/90 backdrop-blur-xl p-6">
            <BorderBeam
              size={100}
              duration={8}
              colorFrom="hsl(var(--primary))"
              colorTo="hsl(var(--accent))"
              borderWidth={2}
            />
            <div className="relative z-10">
              <SettingsForm profile={profile} />
            </div>
          </Card>
        </MagicCard>
      </div>
    </div>
  )
}
