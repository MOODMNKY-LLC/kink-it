"use client"

import { ReactNode } from "react"
import { KinkyPlaceholder } from "./kinky-placeholder"
import { Button } from "@/components/ui/button"

interface KinkyEmptyStateProps {
  title: string
  description?: string
  actionLabel?: string
  onAction?: () => void
  actionIcon?: ReactNode
  size?: "sm" | "md" | "lg" | "xl"
  className?: string
}

export function KinkyEmptyState({
  title,
  description,
  actionLabel,
  onAction,
  actionIcon,
  size = "md",
  className,
}: KinkyEmptyStateProps) {
  return (
    <KinkyPlaceholder
      title={title}
      description={description}
      size={size}
      variant="empty"
      className={className}
      action={
        actionLabel && onAction ? (
          <Button onClick={onAction} className="gap-2">
            {actionIcon}
            {actionLabel}
          </Button>
        ) : undefined
      }
    />
  )
}
