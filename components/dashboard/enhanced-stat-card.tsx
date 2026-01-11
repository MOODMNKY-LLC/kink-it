"use client"

import React from "react"
import { MagicCard } from "@/components/ui/magic-card"
import DashboardStat from "@/components/dashboard/stat"
import GearIcon from "@/components/icons/gear"
import ProcessorIcon from "@/components/icons/proccesor"
import BoomIcon from "@/components/icons/boom"

interface EnhancedStatCardProps {
  label: string
  value: string
  description?: string
  tag?: string
  icon: string // Changed to string identifier
  intent?: "positive" | "negative" | "neutral"
  direction?: "up" | "down"
  gradientFrom?: string
  gradientTo?: string
}

// Icon mapping - maps string identifiers to React components
const iconMap: Record<string, React.ComponentType<{ className?: string }>> = {
  gear: GearIcon,
  proccesor: ProcessorIcon,
  boom: BoomIcon,
}

/**
 * Enhanced stat card with MagicCard spotlight effect
 * Wraps DashboardStat with MagicCard for visual enhancement
 */
export default function EnhancedStatCard({
  label,
  value,
  description,
  tag,
  icon,
  intent,
  direction,
  gradientFrom = "#9E7AFF",
  gradientTo = "#FE8BBB",
}: EnhancedStatCardProps) {
  const IconComponent = iconMap[icon] || GearIcon

  return (
    <MagicCard
      className="h-full"
      gradientFrom={gradientFrom}
      gradientTo={gradientTo}
      gradientSize={200}
      gradientOpacity={0.6}
    >
      <DashboardStat
        label={label}
        value={value}
        description={description}
        tag={tag}
        icon={IconComponent}
        intent={intent}
        direction={direction}
      />
    </MagicCard>
  )
}
