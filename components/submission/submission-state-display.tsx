import { Badge } from "@/components/ui/badge"
import { CheckCircle2, BatteryLow, PauseCircle } from "lucide-react"
import { formatDistanceToNow } from "date-fns"
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
      className: "bg-green-500 hover:bg-green-600 text-white",
      description: "Full availability for routine, tasks, and play",
    },
    low_energy: {
      label: "Low Energy",
      icon: BatteryLow,
      variant: "secondary" as const,
      className: "bg-yellow-500 hover:bg-yellow-600 text-white",
      description: "Reduced capacity, fewer tasks preferred",
    },
    paused: {
      label: "Paused Play",
      icon: PauseCircle,
      variant: "destructive" as const,
      className: "bg-red-500 hover:bg-red-600 text-white",
      description: "Temporary suspension of D/s expectations",
    },
  }[state]

  const Icon = config.icon
  const timeAgo = formatDistanceToNow(new Date(updatedAt), { addSuffix: true })

  return (
    <div className="space-y-2">
      <div className="flex items-center gap-3">
        <Badge variant={config.variant} className={`${config.className} text-sm px-3 py-1`}>
          <Icon className="h-4 w-4 mr-1.5" />
          {partnerName ? `${partnerName}: ${config.label}` : config.label}
        </Badge>
        <span className="text-xs text-muted-foreground">Updated {timeAgo}</span>
      </div>
      <p className="text-xs text-muted-foreground">{config.description}</p>
    </div>
  )
}
