"use client"

import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { FileText, Settings, Heart } from "lucide-react"

export function RulesHeroSection() {
  return (
    <Card className="border-primary/20 bg-card/90 backdrop-blur-xl mb-6">
      <CardContent className="p-6">
        <div className="space-y-6">
          <div className="text-center space-y-2">
            <h2 className="text-2xl font-bold text-foreground">
              Understanding Rules, Protocols, and Expectations
            </h2>
            <p className="text-muted-foreground">
              Each serves a distinct purpose in your dynamic. Learn how they differ and when to use each.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-4">
            {/* Rules */}
            <div className="space-y-3 p-4 rounded-lg bg-primary/5 border border-primary/20">
              <div className="flex items-center gap-2">
                <FileText className="h-5 w-5 text-primary" />
                <h3 className="font-semibold text-lg">Rules</h3>
              </div>
              <p className="text-sm text-muted-foreground">
                <strong>Always-applicable behavioral requirements</strong> that define what is expected at all times.
              </p>
              <div className="space-y-2">
                <p className="text-xs font-medium text-foreground">Example:</p>
                <div className="p-2 bg-background/50 rounded border border-primary/10">
                  <p className="text-xs italic text-muted-foreground">
                    "The sub must always respect the dominant's authority"
                  </p>
                </div>
              </div>
              <Badge variant="outline" className="text-xs">
                Always in effect
              </Badge>
            </div>

            {/* Protocols */}
            <div className="space-y-3 p-4 rounded-lg bg-accent/5 border border-accent/20">
              <div className="flex items-center gap-2">
                <Settings className="h-5 w-5 text-accent" />
                <h3 className="font-semibold text-lg">Protocols</h3>
              </div>
              <p className="text-sm text-muted-foreground">
                <strong>Situational procedures</strong> that instruct how to behave in specific conditions or contexts.
              </p>
              <div className="space-y-2">
                <p className="text-xs font-medium text-foreground">Example:</p>
                <div className="p-2 bg-background/50 rounded border border-accent/10">
                  <p className="text-xs italic text-muted-foreground">
                    "Chastity is to be worn on days not in the office"
                  </p>
                </div>
              </div>
              <Badge variant="outline" className="text-xs">
                Conditional/Situational
              </Badge>
            </div>

            {/* Expectations */}
            <div className="space-y-3 p-4 rounded-lg bg-secondary/5 border border-secondary/20">
              <div className="flex items-center gap-2">
                <Heart className="h-5 w-5 text-secondary-foreground" />
                <h3 className="font-semibold text-lg">Expectations</h3>
              </div>
              <p className="text-sm text-muted-foreground">
                <strong>Preferences and choices</strong> within established conditions, indicating preferred approaches or selections.
              </p>
              <div className="space-y-2">
                <p className="text-xs font-medium text-foreground">Example:</p>
                <div className="p-2 bg-background/50 rounded border border-secondary/10">
                  <p className="text-xs italic text-muted-foreground">
                    "Choice of Bull Chastity over other devices per condition set"
                  </p>
                </div>
              </div>
              <Badge variant="outline" className="text-xs">
                Preference/Choice
              </Badge>
            </div>
          </div>

          <div className="pt-4 border-t border-border">
            <p className="text-xs text-muted-foreground text-center">
              <strong>Remember:</strong> Rules define <em>what</em> (always), Protocols define <em>how</em> (situational), 
              and Expectations define <em>preferences</em> (choices within conditions).
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
