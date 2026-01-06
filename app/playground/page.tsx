"use client"

import Link from "next/link"
import { BentoCard, BentoGrid } from "@/components/ui/bento-grid"
import { MagicCard } from "@/components/ui/magic-card"
import { BorderBeam } from "@/components/ui/border-beam"
import { ImageIcon, Sparkles, Wand2, Palette, Zap, User } from "lucide-react"
import { KinkyAvatar } from "@/components/kinky/kinky-avatar"

const playgroundTools = [
  {
    name: "Image Generation",
    description: "Create and manage KINKSTER avatars with AI-powered image generation",
    href: "/playground/image-generation",
    cta: "Start creating",
    icon: ImageIcon,
    className: "col-span-3 md:col-span-1",
    background: (
      <div className="absolute inset-0 overflow-hidden rounded-xl">
        <MagicCard className="h-full w-full">
          <BorderBeam size={250} duration={12} />
          <div className="absolute inset-0 flex items-center justify-center opacity-20">
            <KinkyAvatar size={120} variant="icon" />
          </div>
        </MagicCard>
      </div>
    ),
  },
  {
    name: "Scene Composition",
    description: "Place your KINKSTER characters into AI-generated scenes for roleplay experiences",
    href: "/playground/scene-composition",
    cta: "Compose scene",
    icon: Sparkles,
    className: "col-span-3 md:col-span-1",
    background: (
      <div className="absolute inset-0 overflow-hidden rounded-xl bg-gradient-to-br from-primary/10 via-primary/5 to-transparent">
        <div className="absolute inset-0 flex items-center justify-center opacity-30">
          <Sparkles className="h-24 w-24 text-primary" />
        </div>
      </div>
    ),
  },
  {
    name: "Kinky Kincade Playground",
    description: "Advanced AI image generation with multi-image workflows and creative controls",
    href: "/playground/kinky-kincade",
    cta: "Open playground",
    icon: Wand2,
    className: "col-span-3 md:col-span-1",
    background: (
      <div className="absolute inset-0 overflow-hidden rounded-xl bg-gradient-to-br from-purple-500/10 via-pink-500/5 to-transparent">
        <div className="absolute inset-0 flex items-center justify-center opacity-30">
          <Wand2 className="h-24 w-24 text-purple-500" />
        </div>
      </div>
    ),
  },
  {
    name: "Pose Variation",
    description: "Generate pose variations for your characters while maintaining consistency",
    href: "/playground/pose-variation",
    cta: "Generate poses",
    icon: User,
    className: "col-span-3 md:col-span-1",
    background: (
      <div className="absolute inset-0 overflow-hidden rounded-xl bg-gradient-to-br from-blue-500/10 via-cyan-500/5 to-transparent">
        <div className="absolute inset-0 flex items-center justify-center opacity-30">
          <User className="h-24 w-24 text-blue-500" />
        </div>
      </div>
    ),
  },
]

export default function PlaygroundPage() {
  return (
    <div className="flex flex-col gap-8">
      {/* Header */}
      <div className="flex flex-col gap-4">
        <div className="flex items-center gap-4">
          <KinkyAvatar size={64} className="shrink-0" />
          <div>
            <h1 className="text-3xl font-bold font-display">Playground</h1>
            <p className="text-muted-foreground">
              Creative tools and utilities to enhance your KINK IT experience
            </p>
          </div>
        </div>
      </div>

      {/* Tools Grid */}
      <BentoGrid className="md:grid-cols-3">
        {playgroundTools.map((tool) => (
          <BentoCard
            key={tool.name}
            name={tool.name}
            description={tool.description}
            href={tool.href}
            cta={tool.cta}
            Icon={tool.icon}
            className={tool.className}
            background={tool.background}
          />
        ))}
      </BentoGrid>

      {/* Info Section */}
      <div className="mt-8 rounded-lg border bg-muted/50 p-6">
        <h2 className="mb-2 text-lg font-semibold">About the Playground</h2>
        <p className="text-muted-foreground">
          The Playground is your creative workspace within KINK IT. Use these tools to generate
          avatars, experiment with designs, and customize your experience. More tools and features
          are being added regularly.
        </p>
      </div>
    </div>
  )
}

