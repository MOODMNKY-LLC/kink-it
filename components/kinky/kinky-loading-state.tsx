"use client"

import { KinkyPlaceholder } from "./kinky-placeholder"

interface KinkyLoadingStateProps {
  message?: string
  size?: "sm" | "md" | "lg" | "xl"
  className?: string
}

export function KinkyLoadingState({
  message = "Loading...",
  size = "md",
  className,
}: KinkyLoadingStateProps) {
  return (
    <KinkyPlaceholder
      title={message}
      description="Kinky is working on it..."
      size={size}
      variant="loading"
      className={className}
    />
  )
}



