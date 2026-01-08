"use client"

// Force dynamic rendering - prevent static generation
export const dynamic = 'force-dynamic'
export const revalidate = 0

// Minimal 404 page - client-side only to avoid Next.js static generation bug
// This prevents Next.js from trying to statically generate the 404 page
export default function NotFound() {
  if (typeof window !== "undefined") {
    // Redirect to home page
    window.location.href = "/"
  }
  return null
}
