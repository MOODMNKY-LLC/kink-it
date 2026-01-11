import { getUserProfile } from "@/lib/auth/get-user"
import { redirect } from "next/navigation"
import { ProfileForm } from "@/components/account/profile-form"
import { KinkIdentityForm } from "@/components/account/kink-identity-form"
import { Card } from "@/components/ui/card"
import { BorderBeam } from "@/components/ui/border-beam"
import { MagicCard } from "@/components/ui/magic-card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"

export default async function ProfilePage() {
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
            Profile Settings
          </h1>
          <p className="text-muted-foreground">
            Manage your profile information and preferences
          </p>
        </div>

        {/* Profile Forms with Tabs */}
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
                <Tabs defaultValue="basic" className="w-full">
                  <TabsList className="grid w-full grid-cols-2 mb-6">
                    <TabsTrigger value="basic">Basic Information</TabsTrigger>
                    <TabsTrigger value="kink">Kink Identity</TabsTrigger>
                  </TabsList>
                  <TabsContent value="basic" className="mt-0">
                    <ProfileForm profile={profile} />
                  </TabsContent>
                  <TabsContent value="kink" className="mt-0">
                    <KinkIdentityForm profile={profile} />
                  </TabsContent>
                </Tabs>
              </div>
            </Card>
          </MagicCard>
        </div>
      </div>
    </div>
  )
}
