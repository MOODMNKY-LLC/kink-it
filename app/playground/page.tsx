"use client"

import Link from "next/link"
import { BentoCard, BentoGrid } from "@/components/ui/bento-grid"
import { MagicCard } from "@/components/ui/magic-card"
import { BorderBeam } from "@/components/ui/border-beam"
import {
  Sparkles,
  Wand2,
  User,
  Layers,
  Library,
  ArrowRight,
  ImageIcon,
} from "lucide-react"
import { KinkyAvatar } from "@/components/kinky/kinky-avatar"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"

const playgroundTools = [
  {
    name: "Creative Studio",
    description:
      "Unified AI-powered creative suite for image generation, pose variation, scene composition, and character creation",
    href: "/playground/creative-studio",
    cta: "Launch Studio",
    icon: Sparkles,
    className: "col-span-3 lg:col-span-2 lg:row-span-2",
    featured: true,
    background: (
      <div className="absolute inset-0 overflow-hidden rounded-xl">
        <MagicCard className="h-full w-full">
          <BorderBeam size={350} duration={12} />
          <div className="absolute inset-0 bg-gradient-to-br from-primary/20 via-purple-500/10 to-pink-500/10" />
          <div className="absolute inset-0 flex items-center justify-center opacity-20">
            <KinkyAvatar size={180} variant="icon" />
          </div>
        </MagicCard>
      </div>
    ),
  },
  {
    name: "Generate",
    description: "AI-powered image generation with props and prompts",
    href: "/playground/creative-studio?mode=generate-props",
    cta: "Generate images",
    icon: Wand2,
    className: "col-span-3 lg:col-span-1",
    background: (
      <div className="absolute inset-0 overflow-hidden rounded-xl bg-gradient-to-br from-purple-500/10 via-purple-500/5 to-transparent">
        <div className="absolute inset-0 flex items-center justify-center opacity-30">
          <Wand2 className="h-16 w-16 text-purple-500" />
        </div>
      </div>
    ),
  },
  {
    name: "Pose Variation",
    description: "Create pose variations while maintaining character consistency",
    href: "/playground/creative-studio?mode=pose-variation",
    cta: "Generate poses",
    icon: User,
    className: "col-span-3 lg:col-span-1",
    background: (
      <div className="absolute inset-0 overflow-hidden rounded-xl bg-gradient-to-br from-blue-500/10 via-cyan-500/5 to-transparent">
        <div className="absolute inset-0 flex items-center justify-center opacity-30">
          <User className="h-16 w-16 text-blue-500" />
        </div>
      </div>
    ),
  },
  {
    name: "Scene Composition",
    description: "Compose characters in AI-generated scenes and backgrounds",
    href: "/playground/creative-studio?mode=scene-composition",
    cta: "Compose scene",
    icon: Layers,
    className: "col-span-3 lg:col-span-1",
    background: (
      <div className="absolute inset-0 overflow-hidden rounded-xl bg-gradient-to-br from-green-500/10 via-emerald-500/5 to-transparent">
        <div className="absolute inset-0 flex items-center justify-center opacity-30">
          <Layers className="h-16 w-16 text-green-500" />
        </div>
      </div>
    ),
  },
  {
    name: "Library",
    description: "Browse and manage all your AI-generated images",
    href: "/playground/creative-studio?mode=library",
    cta: "View library",
    icon: Library,
    className: "col-span-3 lg:col-span-1",
    background: (
      <div className="absolute inset-0 overflow-hidden rounded-xl bg-gradient-to-br from-orange-500/10 via-yellow-500/5 to-transparent">
        <div className="absolute inset-0 flex items-center justify-center opacity-30">
          <Library className="h-16 w-16 text-orange-500" />
        </div>
      </div>
    ),
  },
  {
    name: "KINKSTER Creator",
    description: "Create and manage your KINKSTER characters with custom avatars",
    href: "/playground/creative-studio?mode=kinkster-creator",
    cta: "Create character",
    icon: ImageIcon,
    className: "col-span-3 lg:col-span-1",
    background: (
      <div className="absolute inset-0 overflow-hidden rounded-xl bg-gradient-to-br from-pink-500/10 via-rose-500/5 to-transparent">
        <div className="absolute inset-0 flex items-center justify-center opacity-30">
          <ImageIcon className="h-16 w-16 text-pink-500" />
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
            <h1 className="text-3xl font-bold font-display">
              Kinky&apos;s Playground
            </h1>
            <p className="text-muted-foreground">
              Discover creative tools and AI-powered features to enhance your
              KINK IT experience
            </p>
          </div>
        </div>
      </div>

      {/* Featured Action */}
      <div className="flex items-center justify-between rounded-xl border bg-gradient-to-r from-primary/10 via-purple-500/10 to-pink-500/10 p-6">
        <div className="flex items-center gap-4">
          <div className="rounded-lg bg-primary/20 p-3">
            <Sparkles className="h-6 w-6 text-primary" />
          </div>
          <div>
            <h2 className="text-lg font-semibold">Creative Studio</h2>
            <p className="text-sm text-muted-foreground">
              All-in-one creative suite for AI-powered image generation
            </p>
          </div>
        </div>
        <Button asChild>
          <Link href="/playground/creative-studio">
            Launch Studio
            <ArrowRight className="ml-2 h-4 w-4" />
          </Link>
        </Button>
      </div>

      {/* Tools Grid */}
      <BentoGrid className="md:grid-cols-3 lg:grid-cols-3">
        {playgroundTools.map((tool) => (
          <BentoCard
            key={tool.name}
            name={tool.name}
            description={tool.description}
            href={tool.href}
            cta={tool.cta}
            Icon={tool.icon}
            className={cn(
              tool.className,
              tool.featured && "ring-2 ring-primary/20"
            )}
            background={tool.background}
          />
        ))}
      </BentoGrid>

      {/* Info Section */}
      <div className="mt-4 rounded-lg border bg-muted/50 p-6">
        <h2 className="mb-2 text-lg font-semibold">About the Playground</h2>
        <p className="text-muted-foreground">
          The Playground is your creative workspace within KINK IT. The{" "}
          <strong>Creative Studio</strong> combines all image generation tools
          into a single, powerful interface. Generate character avatars,
          experiment with poses, compose scenes, and manage your library - all
          in one place. More tools and features are being added regularly.
        </p>
      </div>
    </div>
  )
}
