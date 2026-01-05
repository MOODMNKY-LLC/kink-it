import type React from "react"
import { Roboto_Mono } from "next/font/google"
import "./globals.css"
import type { Metadata } from "next"
import { V0Provider } from "@/lib/v0-context"
import localFont from "next/font/local"
import { SidebarProvider } from "@/components/ui/sidebar"
import { MobileHeader } from "@/components/dashboard/mobile-header"
import { DashboardSidebar } from "@/components/dashboard/sidebar"
import mockDataJson from "@/mock.json"
import type { MockData } from "@/types/dashboard"
import Widget from "@/components/dashboard/widget"
import Notifications from "@/components/dashboard/notifications"
import { MobileChat } from "@/components/chat/mobile-chat"
import Chat from "@/components/chat"
import { getCurrentUser } from "@/lib/auth/get-user"
import { createClient } from "@/lib/supabase/server"
import type { Profile } from "@/types/profile"
import { CharacterBackground } from "@/components/backgrounds/character-background"
import { GradientMesh } from "@/components/backgrounds/gradient-mesh"
import { BokehEffect } from "@/components/backgrounds/bokeh-effect"
import { Toaster } from "sonner"

const mockData = mockDataJson as MockData

const robotoMono = Roboto_Mono({
  variable: "--font-roboto-mono",
  subsets: ["latin"],
})

const rebelGrotesk = localFont({
  src: "../public/fonts/Rebels-Fett.woff2",
  variable: "--font-rebels",
  display: "swap",
})

const isV0 = process.env["VERCEL_URL"]?.includes("vusercontent.net") ?? false

export const metadata: Metadata = {
  title: {
    template: "%s – KINK IT",
    default: "KINK IT",
  },
  description: "D/s relationship management application for Dominants and submissives.",
    generator: 'v0.app'
}

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  // Use getCurrentUser() instead of getUserProfile() to avoid redirect loops
  // getCurrentUser() doesn't redirect - it just returns null if no user
  const user = await getCurrentUser()
  
  // Only fetch profile if user exists (prevents redirect loop on auth pages)
  let profile: Profile | null = null
  if (user) {
    const supabase = await createClient()
    const { data, error } = await supabase.from("profiles").select("*").eq("id", user.id).single()
    
    if (error) {
      // Log error but don't block layout rendering
      console.error("[Layout] Error fetching profile:", {
        code: error.code,
        message: error.message,
        userId: user.id,
      })
    } else {
      profile = data as Profile | null
    }
  }

  return (
    <html lang="en">
      <head>
        <link rel="preload" href="/fonts/Rebels-Fett.woff2" as="font" type="font/woff2" crossOrigin="anonymous" />
      </head>
      <body className={`${rebelGrotesk.variable} ${robotoMono.variable} antialiased`} suppressHydrationWarning>
        <V0Provider isV0={isV0}>
          {profile ? (
            <div className="dark min-h-screen bg-background relative overflow-hidden">
              {/* Character-based backgrounds - dark mode first */}
              <CharacterBackground variant="corner" opacity={0.08} />
              <GradientMesh intensity="subtle" />
              <BokehEffect count={15} />
              
              <SidebarProvider>
                {/* Mobile Header - only visible on mobile */}
                <MobileHeader mockData={mockData} />

                {/* Desktop Layout */}
                <div className="w-full grid grid-cols-1 lg:grid-cols-12 gap-gap lg:px-sides relative z-10">
                  <div className="hidden lg:block col-span-2 top-0 relative">
                    <DashboardSidebar profile={profile} />
                  </div>
                  <div className="col-span-1 lg:col-span-7">{children}</div>
                  <div className="col-span-3 hidden lg:block">
                    <div className="space-y-gap py-sides min-h-screen max-h-screen sticky top-0 overflow-clip">
                      <Widget widgetData={mockData.widgetData} />
                      <Notifications initialNotifications={mockData.notifications} />
                      <Chat />
                    </div>
                  </div>
                </div>

                {/* Mobile Chat - floating CTA with drawer */}
                <MobileChat />
              </SidebarProvider>
            </div>
          ) : (
            <>{children}</>
          )}
        </V0Provider>
        <Toaster position="top-right" richColors />
      </body>
    </html>
  )
}
