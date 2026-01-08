"use client"

// Force dynamic rendering - prevent static generation
export const dynamic = 'force-dynamic'
export const revalidate = 0

// Minimal error page - client-side only to avoid Next.js static generation bug
// This prevents Next.js from trying to statically generate the error page
export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  if (typeof window !== "undefined") {
    // Try to reset, otherwise redirect to home
    try {
      reset()
    } catch {
      window.location.href = "/"
    }
  }
  return null
}
