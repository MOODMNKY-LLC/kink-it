"use client"

import { ReactNode } from "react"
import { KinkyAvatar } from "./kinky-avatar"
import { cn } from "@/lib/utils"

interface KinkyPlaceholderProps {
  title: string
  description?: string
  action?: ReactNode
  size?: "sm" | "md" | "lg" | "xl"
  variant?: "empty" | "loading" | "error" | "success"
  className?: string
}

const sizeConfig = {
  sm: { avatar: 64, spacing: "gap-4" },
  md: { avatar: 96, spacing: "gap-6" },
  lg: { avatar: 128, spacing: "gap-8" },
  xl: { avatar: 200, spacing: "gap-10" },
}

export function KinkyPlaceholder({
  title,
  description,
  action,
  size = "md",
  variant = "empty",
  className,
}: KinkyPlaceholderProps) {
  const config = sizeConfig[size]

  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center py-12 px-4 text-center",
        config.spacing,
        className
      )}
    >
      <div className="relative">
        <KinkyAvatar size={config.avatar} variant="default" />
        {variant === "loading" && (
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="h-full w-full animate-pulse rounded-full bg-primary/20" />
          </div>
        )}
        {variant === "error" && (
          <div className="absolute -top-2 -right-2 flex h-6 w-6 items-center justify-center rounded-full bg-destructive text-destructive-foreground">
            !
          </div>
        )}
        {variant === "success" && (
          <div className="absolute -top-2 -right-2 flex h-6 w-6 items-center justify-center rounded-full bg-green-500 text-white">
            ✓
          </div>
        )}
      </div>
      <div className="space-y-2">
        <h3 className="text-lg font-semibold">{title}</h3>
        {description && (
          <p className="text-sm text-muted-foreground max-w-md">{description}</p>
        )}
      </div>
      {action && <div className="mt-4">{action}</div>}
    </div>
  )
}



