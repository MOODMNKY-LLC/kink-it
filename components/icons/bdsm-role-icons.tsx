/**
 * BDSM Role Icons
 * Based on traditional BDSM symbols and kink community iconography
 * 
 * Icons represent:
 * - Shield: Dominant/Owner (protection, authority)
 * - Circle/Collar: Submissive/Owned (unity, connection)
 * - Triskelion: Switch/BDSM symbol (three-part unity)
 */

import React from "react"
import { cn } from "@/lib/utils"

interface BDSMRoleIconProps {
  role: "dominant" | "submissive" | "switch"
  size?: number
  className?: string
  variant?: "filled" | "outline" | "minimal"
}

/**
 * Shield Icon - Represents Dominant/Owner
 * Based on traditional BDSM owner shield symbol
 */
export function DominantIcon({
  size = 24,
  className,
  variant = "filled",
}: Omit<BDSMRoleIconProps, "role">) {
  const baseClasses = "text-primary"
  
  if (variant === "minimal") {
    return (
      <svg
        width={size}
        height={size}
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        className={cn(baseClasses, className)}
      >
        <path d="M12 2L4 5v6c0 5.55 3.84 10.74 8 12 4.16-1.26 8-6.45 8-12V5l-8-3z" />
      </svg>
    )
  }

  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill={variant === "filled" ? "currentColor" : "none"}
      stroke="currentColor"
      strokeWidth={variant === "outline" ? "2" : "0"}
      className={cn(baseClasses, className)}
    >
      {/* Shield shape - traditional BDSM owner symbol */}
      <path d="M12 2L4 5v6c0 5.55 3.84 10.74 8 12 4.16-1.26 8-6.45 8-12V5l-8-3z" />
      {variant === "filled" && (
        <path
          d="M12 2L4 5v6c0 5.55 3.84 10.74 8 12 4.16-1.26 8-6.45 8-12V5l-8-3z"
          fill="currentColor"
        />
      )}
    </svg>
  )
}

/**
 * Circle/Collar Icon - Represents Submissive/Owned
 * Based on traditional BDSM collar symbol
 */
export function SubmissiveIcon({
  size = 24,
  className,
  variant = "filled",
}: Omit<BDSMRoleIconProps, "role">) {
  const baseClasses = "text-accent"
  
  if (variant === "minimal") {
    return (
      <svg
        width={size}
        height={size}
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        className={cn(baseClasses, className)}
      >
        <circle cx="12" cy="12" r="10" />
        <circle cx="12" cy="12" r="6" />
      </svg>
    )
  }

  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill={variant === "filled" ? "currentColor" : "none"}
      stroke="currentColor"
      strokeWidth={variant === "outline" ? "2" : "0"}
      className={cn(baseClasses, className)}
    >
      {/* Double circle - represents collar/owned symbol */}
      <circle cx="12" cy="12" r="10" />
      <circle cx="12" cy="12" r="6" />
    </svg>
  )
}

/**
 * Triskelion Icon - Represents Switch/BDSM Community
 * Based on traditional BDSM triskelion symbol
 */
export function SwitchIcon({
  size = 24,
  className,
  variant = "filled",
}: Omit<BDSMRoleIconProps, "role">) {
  const baseClasses = "text-primary"
  
  if (variant === "minimal") {
    return (
      <svg
        width={size}
        height={size}
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        className={cn(baseClasses, className)}
      >
        <circle cx="12" cy="12" r="10" />
        <path d="M12 2 L16 8 L8 8 Z" />
        <path d="M12 22 L8 16 L16 16 Z" />
        <path d="M2 12 L8 8 L8 16 Z" />
        <path d="M22 12 L16 8 L16 16 Z" />
      </svg>
    )
  }

  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill={variant === "filled" ? "currentColor" : "none"}
      stroke="currentColor"
      strokeWidth={variant === "outline" ? "2" : "0"}
      className={cn(baseClasses, className)}
    >
      {/* Triskelion - three spirals representing BDSM unity */}
      <circle cx="12" cy="12" r="10" />
      {/* Three-part spiral design */}
      <path
        d="M12 2 Q16 6 16 12 Q16 18 12 22 Q8 18 8 12 Q8 6 12 2"
        fill={variant === "filled" ? "currentColor" : "none"}
      />
    </svg>
  )
}

/**
 * Main component that renders the appropriate icon based on role
 */
export function BDSMRoleIcon({ role, size = 24, className, variant = "filled" }: BDSMRoleIconProps) {
  switch (role) {
    case "dominant":
      return <DominantIcon size={size} className={className} variant={variant} />
    case "submissive":
      return <SubmissiveIcon size={size} className={className} variant={variant} />
    case "switch":
      return <SwitchIcon size={size} className={className} variant={variant} />
    default:
      return null
  }
}
