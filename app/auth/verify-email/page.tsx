"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { MagicCard } from "@/components/ui/magic-card"
import { ShineBorder } from "@/components/ui/shine-border"
import { CharacterBackground } from "@/components/backgrounds/character-background"
import { GradientMesh } from "@/components/backgrounds/gradient-mesh"
import { BokehEffect } from "@/components/backgrounds/bokeh-effect"
import Link from "next/link"
import { Mail } from "lucide-react"

export default function VerifyEmailPage() {
  return (
    <div className="flex min-h-screen w-full items-center justify-center p-6 md:p-10 bg-background relative overflow-hidden">
      {/* Character-based backgrounds - dark mode first */}
      <CharacterBackground variant="hero" opacity={0.12} />
      <GradientMesh intensity="medium" />
      <BokehEffect count={20} />
      
      <div className="w-full max-w-md relative z-10">
        <MagicCard
          className="border-primary/20 bg-card/80 backdrop-blur-2xl shadow-2xl shadow-primary/10"
          gradientSize={300}
          gradientFrom="#00BFFF"
          gradientTo="#FF6347"
          gradientColor="#00BFFF"
          gradientOpacity={0.2}
        >
          <ShineBorder
            borderWidth={1}
            duration={20}
            shineColor={["#00BFFF", "#FF6347", "#00BFFF"]}
            className="rounded-lg"
          />
          <Card className="border-transparent bg-transparent shadow-none">
            <CardHeader className="space-y-2 text-center pb-6">
              <div className="mx-auto w-12 h-12 bg-primary/20 rounded-full flex items-center justify-center mb-2">
                <Mail className="w-6 h-6 text-primary" />
              </div>
              <CardTitle className="text-2xl font-bold bg-gradient-to-r from-primary via-accent to-primary bg-clip-text text-transparent">
                Check Your Email
              </CardTitle>
              <CardDescription className="text-muted-foreground">
                We&apos;ve sent you a confirmation link to verify your account
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="text-sm text-muted-foreground space-y-2">
                <p>Please check your inbox and click the confirmation link to activate your account.</p>
                <p>Once confirmed, you&apos;ll be able to sign in and start using KINK IT.</p>
              </div>
              <Button
                asChild
                className="w-full bg-primary hover:bg-primary/90 text-primary-foreground font-semibold shadow-lg shadow-primary/30 transition-all duration-300 hover:scale-[1.02]"
              >
                <Link href="/auth/login">Back to Sign In</Link>
              </Button>
            </CardContent>
          </Card>
        </MagicCard>
      </div>
    </div>
  )
}
