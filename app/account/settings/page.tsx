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
    <div className="container mx-auto py-8 px-4 max-w-4xl">
      <div className="space-y-6">
        {/* Header */}
        <div className="space-y-2">
          <h1 className="text-3xl font-bold bg-gradient-to-r from-primary via-accent to-primary bg-clip-text text-transparent">
            Account Settings
          </h1>
          <p className="text-muted-foreground">
            Manage your account preferences and notifications
          </p>
        </div>

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
    </div>
  )
}

