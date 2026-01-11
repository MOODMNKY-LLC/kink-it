import React from "react"

interface NotionIconProps {
  className?: string
  size?: number
  variant?: "gradient" | "solid" | "outline" | "official"
}

/**
 * Notion icon component with gradient variant matching app's color scheme
 * Gradient: Cyan-blue (#00BFFF) to Orange-red (#FF6347)
 * Based on Icons8 Notion icon styles, customized for KINK IT brand
 * 
 * New "official" variant uses the actual Notion app icon SVG
 */
export function NotionIcon({ className, size = 24, variant = "gradient" }: NotionIconProps) {
  // Official Notion icon from SVG file
  // Using regular img tag instead of Next.js Image to avoid loader issues with SVG files
  if (variant === "official") {
    return (
      <img
        src="/icons/notion-app-icon.svg"
        alt="Notion"
        width={size}
        height={Math.round(size * 0.66)}
        className={className}
        style={{ display: "inline-block" }}
      />
    )
  }
  const iconId = `notion-gradient-${size}`
  
  if (variant === "gradient") {
    return (
      <svg
        width={size}
        height={size}
        viewBox="0 0 24 24"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className={className}
      >
        <defs>
          <linearGradient id={iconId} x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#00BFFF" stopOpacity="1" />
            <stop offset="50%" stopColor="#1E90FF" stopOpacity="1" />
            <stop offset="100%" stopColor="#FF6347" stopOpacity="1" />
          </linearGradient>
        </defs>
        <path
          d="M4.459 4.208c.746.606 1.026.56 2.428.466l13.215-.793c.28 0 .047-.28-.046-.326L17.86 1.968c-.42-.326-.981-.7-2.055-.607L3.01 2.295c-.466.046-.56.28-.374.466zm.793 3.08v13.904c0 .747.373 1.027 1.214.98l14.523-.84c.841-.046.935-.56.935-1.167V6.354c0-.606-.233-.933-.748-.887l-15.177.887c-.56.047-.747.327-.747.933zm14.337.606c.093.42 0 .841-.42.888l-.7.14v10.264c-.608.327-1.168.514-1.635.514-.748 0-.935-.234-1.495-.933l-4.577-5.85v6.137c0 .747-.373.933-1.168.933l-3.222.186c-.093-.186 0-.653.327-.746l.84-.233 2.055-2.794v-7.98l-.374-.326c-.093-.467.14-.747.514-.794l4.577-.326 5.764 7.38v-5.61zm-1.635 2.794l-3.935 5.384c-.14.186-.327.047-.327-.233V9.76l4.262-5.85c.093-.186.28-.14.373 0z"
          fill={`url(#${iconId})`}
        />
      </svg>
    )
  }
  
  if (variant === "outline") {
    return (
      <svg
        width={size}
        height={size}
        viewBox="0 0 24 24"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className={className}
      >
        <path
          d="M4.459 4.208c.746.606 1.026.56 2.428.466l13.215-.793c.28 0 .047-.28-.046-.326L17.86 1.968c-.42-.326-.981-.7-2.055-.607L3.01 2.295c-.466.046-.56.28-.374.466zm.793 3.08v13.904c0 .747.373 1.027 1.214.98l14.523-.84c.841-.046.935-.56.935-1.167V6.354c0-.606-.233-.933-.748-.887l-15.177.887c-.56.047-.747.327-.747.933zm14.337.606c.093.42 0 .841-.42.888l-.7.14v10.264c-.608.327-1.168.514-1.635.514-.748 0-.935-.234-1.495-.933l-4.577-5.85v6.137c0 .747-.373.933-1.168.933l-3.222.186c-.093-.186 0-.653.327-.746l.84-.233 2.055-2.794v-7.98l-.374-.326c-.093-.467.14-.747.514-.794l4.577-.326 5.764 7.38v-5.61zm-1.635 2.794l-3.935 5.384c-.14.186-.327.047-.327-.233V9.76l4.262-5.85c.093-.186.28-.14.373 0z"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    )
  }
  
  // Solid variant (default, uses currentColor)
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
    >
      <path
        d="M4.459 4.208c.746.606 1.026.56 2.428.466l13.215-.793c.28 0 .047-.28-.046-.326L17.86 1.968c-.42-.326-.981-.7-2.055-.607L3.01 2.295c-.466.046-.56.28-.374.466zm.793 3.08v13.904c0 .747.373 1.027 1.214.98l14.523-.84c.841-.046.935-.56.935-1.167V6.354c0-.606-.233-.933-.748-.887l-15.177.887c-.56.047-.747.327-.747.933zm14.337.606c.093.42 0 .841-.42.888l-.7.14v10.264c-.608.327-1.168.514-1.635.514-.748 0-.935-.234-1.495-.933l-4.577-5.85v6.137c0 .747-.373.933-1.168.933l-3.222.186c-.093-.186 0-.653.327-.746l.84-.233 2.055-2.794v-7.98l-.374-.326c-.093-.467.14-.747.514-.794l4.577-.326 5.764 7.38v-5.61zm-1.635 2.794l-3.935 5.384c-.14.186-.327.047-.327-.233V9.76l4.262-5.85c.093-.186.28-.14.373 0z"
        fill="currentColor"
      />
    </svg>
  )
}
