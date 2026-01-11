import { getUserProfile } from "@/lib/auth/get-user"
import { redirect } from "next/navigation"
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs"
import Link from "next/link"
import { Settings, Key, Database } from "lucide-react"

export default async function SettingsLayout({
  children,
}: {
  children: React.ReactNode
}) {
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
            Settings
          </h1>
          <p className="text-muted-foreground">
            Manage your account settings and integrations
          </p>
        </div>

        {/* Tabs Navigation */}
        <Tabs defaultValue="general" className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="general" asChild>
              <Link href="/account/settings" className="flex items-center gap-2">
                <Settings className="h-4 w-4" />
                General
              </Link>
            </TabsTrigger>
            <TabsTrigger value="notion-api-keys" asChild>
              <Link href="/account/settings/notion-api-keys" className="flex items-center gap-2">
                <Key className="h-4 w-4" />
                Notion API Keys
              </Link>
            </TabsTrigger>
            <TabsTrigger value="data-recovery" asChild>
              <Link href="/account/settings/data-recovery" className="flex items-center gap-2">
                <Database className="h-4 w-4" />
                Data Recovery
              </Link>
            </TabsTrigger>
          </TabsList>
          <TabsContent value="general" className="mt-6">
            {children}
          </TabsContent>
          <TabsContent value="notion-api-keys" className="mt-6">
            {children}
          </TabsContent>
          <TabsContent value="data-recovery" className="mt-6">
            {children}
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}
