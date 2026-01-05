/**
 * Share API Utilities
 * Provides native sharing capabilities for mobile devices
 */

export interface ShareData {
  title: string
  text?: string
  url?: string
  files?: File[]
}

export async function shareContent(data: ShareData): Promise<boolean> {
  // Check if Share API is available
  if (!navigator.share) {
    // Fallback: copy URL to clipboard
    if (data.url) {
      try {
        await navigator.clipboard.writeText(data.url)
        // You might want to show a toast notification here
        return true
      } catch (error) {
        console.error('Failed to copy to clipboard:', error)
        return false
      }
    }
    return false
  }

  try {
    await navigator.share(data)
    return true
  } catch (error) {
    // User cancelled or error occurred
    if ((error as Error).name !== 'AbortError') {
      console.error('Share failed:', error)
    }
    return false
  }
}

/**
 * Share a task completion or achievement
 */
export async function shareAchievement(
  title: string,
  description: string,
  url?: string
): Promise<boolean> {
  return shareContent({
    title: `🎉 ${title}`,
    text: description,
    url: url || window.location.href,
  })
}

/**
 * Share a task or rule
 */
export async function shareTaskOrRule(
  type: 'task' | 'rule',
  title: string,
  description?: string
): Promise<boolean> {
  return shareContent({
    title: `Check out this ${type} from KINK IT`,
    text: `${title}${description ? `\n\n${description}` : ''}`,
    url: window.location.href,
  })
}

