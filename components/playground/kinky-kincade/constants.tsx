/**
 * Constants for Kinky Kincade Playground
 * Aspect ratios and other configuration
 */

import React from "react"

export const ASPECT_RATIO_OPTIONS = [
  {
    value: "square",
    label: "1:1",
    icon: (
      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <rect x="3" y="3" width="18" height="18" rx="2" strokeWidth="2" />
      </svg>
    ),
  },
  {
    value: "landscape",
    label: "16:9",
    icon: (
      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <rect x="3" y="6" width="18" height="12" rx="2" strokeWidth="2" />
      </svg>
    ),
  },
  {
    value: "portrait",
    label: "9:16",
    icon: (
      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <rect x="6" y="3" width="12" height="18" rx="2" strokeWidth="2" />
      </svg>
    ),
  },
  {
    value: "4:3",
    label: "4:3",
    icon: (
      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <rect x="3" y="4" width="18" height="14" rx="2" strokeWidth="2" />
      </svg>
    ),
  },
  {
    value: "3:4",
    label: "3:4",
    icon: (
      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <rect x="4" y="3" width="14" height="18" rx="2" strokeWidth="2" />
      </svg>
    ),
  },
] as const

export const DEFAULT_ASPECT_RATIO = "square"

export const MAX_PROMPT_LENGTH = 5000
export const MAX_FILE_SIZE = 10 * 1024 * 1024 // 10MB
export const ALLOWED_IMAGE_TYPES = [
  "image/jpeg",
  "image/jpg",
  "image/png",
  "image/webp",
  "image/gif",
  "image/heic",
  "image/heif",
]
