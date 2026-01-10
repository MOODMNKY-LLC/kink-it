import type React from "react"
import { Roboto_Mono } from "next/font/google"
import "./globals.css"
import type { Metadata } from "next"
import { V0Provider } from "@/lib/v0-context"
import localFont from "next/font/local"
import { SidebarProvider } from "@/components/ui/sidebar"
import { MobileHeader } from "@/components/dashboard/mobile-header"
import { DashboardSidebar } from "@/components/dashboard/sidebar"
import { TerminalProvider } from "@/components/kinky/terminal-context"
import KinkyTerminalPopup from "@/components/kinky/kinky-terminal-popup"
import Notifications from "@/components/dashboard/notifications"
// Mobile Chat disabled until Module 7 (Communication Hub) is built
// import { MobileChat } from "@/components/chat/mobile-chat"
// Chat component disabled until Module 7 (Communication Hub) is built
// import Chat from "@/components/chat"
import { getCurrentUser } from "@/lib/auth/get-user"
import { createClient } from "@/lib/supabase/server"
import type { Profile } from "@/types/profile"
import { CharacterBackground } from "@/components/backgrounds/character-background"
import { GradientMesh } from "@/components/backgrounds/gradient-mesh"
import { BokehEffect } from "@/components/backgrounds/bokeh-effect"
import { Toaster } from "sonner"
import { getNotifications } from "@/lib/notifications/get-notifications"
import { ServiceWorkerRegister } from "@/components/pwa/service-worker-register"
import { InstallPrompt } from "@/components/pwa/install-prompt"
import { CertificateCheck } from "@/components/supabase/certificate-check"

const robotoMono = Roboto_Mono({
  variable: "--font-roboto-mono",
  subsets: ["latin"],
  display: "swap",
  preload: true,
})

const rebelGrotesk = localFont({
  src: "../public/fonts/Rebels-Fett.woff2",
  variable: "--font-rebels",
  display: "swap",
  preload: true,
})

const isV0 = process.env["VERCEL_URL"]?.includes("vusercontent.net") ?? false

// Force dynamic rendering since layout depends on user authentication state
export const dynamic = 'force-dynamic'

export const metadata: Metadata = {
  title: {
    template: "%s – KINK IT",
    default: "KINK IT",
  },
  description: "D/s relationship management application for Dominants and submissives.",
  generator: 'v0.app',
  manifest: "/manifest.webmanifest",
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "KINK IT",
    startupImage: [
      "/icons/apple-splash-2048-2732.png",
      "/icons/apple-splash-1668-2388.png",
      "/icons/apple-splash-1536-2048.png",
      "/icons/apple-splash-1242-2688.png",
      "/icons/apple-splash-1125-2436.png",
      "/icons/apple-splash-828-1792.png",
      "/icons/apple-splash-750-1334.png",
      "/icons/apple-splash-640-1136.png",
    ],
  },
  formatDetection: {
    telephone: false,
  },
  icons: {
    icon: "/icons/icon-192x192.png",
    apple: "/icons/icon-192x192.png",
  },
  openGraph: {
    title: "KINK IT",
    description: "D/s relationship management application for Dominants and submissives.",
    type: "website",
    images: [
      {
        url: "/images/kink-it-banner.png",
        width: 1200,
        height: 630,
        alt: "KINK IT",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "KINK IT",
    description: "D/s relationship management application for Dominants and submissives.",
    images: ["/images/kink-it-banner.png"],
  },
}

export const viewport = {
  themeColor: "#0ea5e9",
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
  userScalable: true,
  viewportFit: "cover" as const, // For safe area insets
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
        <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=5, viewport-fit=cover" />
        <meta name="theme-color" content="#0ea5e9" />
        <link rel="apple-touch-icon" href="/icons/icon-192x192.png" />
        <link rel="manifest" href="/manifest.webmanifest" />
      </head>
      <body className={`${rebelGrotesk.variable} ${robotoMono.variable} antialiased`} suppressHydrationWarning>
        <V0Provider isV0={isV0}>
          <CertificateCheck />
          {profile ? (
            <div className="dark min-h-screen bg-background relative overflow-hidden">
              {/* Character-based backgrounds - dark mode first */}
              <CharacterBackground variant="corner" opacity={0.08} />
              <GradientMesh intensity="subtle" />
              <BokehEffect count={15} />
              
              <TerminalProvider>
                <SidebarProvider>
                  {/* Mobile Header - only visible on mobile */}
                  {profile && <MobileHeader />}

                  {/* Desktop Layout - Expanded content area */}
                  <div className="w-full grid grid-cols-1 lg:grid-cols-12 gap-gap lg:px-sides relative z-10">
                    <div className="hidden lg:block col-span-2 top-0 relative">
                      <DashboardSidebar profile={profile} />
                    </div>
                    <div className="col-span-1 lg:col-span-10">{children}</div>
                  </div>

                  {/* Kinky Terminal Popup - Floating, toggleable */}
                  {profile && (
                    <KinkyTerminalPopup
                      userId={profile.id}
                      userName={
                        profile.display_name ||
                        profile.full_name ||
                        profile.email.split("@")[0]
                      }
                      profile={profile}
                      position="bottom-right"
                      triggerVariant="avatar"
                      width={420}
                      height={640}
                    />
                  )}

                  {/* Mobile Chat - disabled until Module 7 (Communication Hub) is built */}
                  {/* <MobileChat /> */}
                </SidebarProvider>
              </TerminalProvider>
            </div>
          ) : (
            <>{children}</>
          )}
        </V0Provider>
        <ServiceWorkerRegister />
        <InstallPrompt />
        <Toaster position="top-right" richColors />
      </body>
    </html>
  )
}
