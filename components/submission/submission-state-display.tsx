import { Badge } from "@/components/ui/badge"
import { CheckCircle2, BatteryLow, PauseCircle } from "lucide-react"
import type { SubmissionState } from "@/types/profile"

interface SubmissionStateDisplayProps {
  state: SubmissionState
  updatedAt: string
  partnerName?: string
}

export function SubmissionStateDisplay({
  state,
  updatedAt,
  partnerName,
}: SubmissionStateDisplayProps) {
  const config = {
    active: {
      label: "Active Submission",
      icon: CheckCircle2,
      variant: "default" as const,
      className: "bg-green-500 hover:bg-green-600",
    },
    low_energy: {
      label: "Low Energy",
      icon: BatteryLow,
      variant: "secondary" as const,
      className: "bg-yellow-500 hover:bg-yellow-600",
    },
    paused: {
      label: "Paused Play",
      icon: PauseCircle,
      variant: "destructive" as const,
      className: "bg-red-500 hover:bg-red-600",
    },
  }[state]

  const Icon = config.icon
  const timeAgo = new Date(updatedAt).toLocaleString()

  return (
    <div className="flex items-center gap-3">
      <Badge variant={config.variant} className={config.className}>
        <Icon className="h-3 w-3 mr-1" />
        {partnerName ? `${partnerName}: ${config.label}` : config.label}
      </Badge>
      <span className="text-xs text-muted-foreground">Updated {timeAgo}</span>
    </div>
  )
}



