"use client"

import { ReactNode } from "react"
import { KinkyPlaceholder } from "./kinky-placeholder"
import { Button } from "@/components/ui/button"

interface KinkyErrorStateProps {
  title: string
  description?: string
  actionLabel?: string
  onAction?: () => void
  size?: "sm" | "md" | "lg" | "xl"
  className?: string
}

export function KinkyErrorState({
  title,
  description,
  actionLabel = "Try Again",
  onAction,
  size = "md",
  className,
}: KinkyErrorStateProps) {
  return (
    <KinkyPlaceholder
      title={title}
      description={description}
      size={size}
      variant="error"
      className={className}
      action={
        onAction ? (
          <Button onClick={onAction} variant="outline">
            {actionLabel}
          </Button>
        ) : undefined
      }
    />
  )
}



