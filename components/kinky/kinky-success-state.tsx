"use client"

import { KinkyPlaceholder } from "./kinky-placeholder"

interface KinkySuccessStateProps {
  title: string
  description?: string
  size?: "sm" | "md" | "lg" | "xl"
  className?: string
}

export function KinkySuccessState({
  title,
  description,
  size = "md",
  className,
}: KinkySuccessStateProps) {
  return (
    <KinkyPlaceholder
      title={title}
      description={description}
      size={size}
      variant="success"
      className={className}
    />
  )
}



