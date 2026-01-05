/**
 * Push Notification Utilities
 * Handles Web Push API integration for PWA notifications
 */

export async function requestNotificationPermission(): Promise<boolean> {
  if (!('Notification' in window)) {
    console.log('This browser does not support notifications')
    return false
  }

  if (Notification.permission === 'granted') {
    return true
  }

  if (Notification.permission !== 'denied') {
    const permission = await Notification.requestPermission()
    return permission === 'granted'
  }

  return false
}

export async function subscribeToPushNotifications(): Promise<PushSubscription | null> {
  if (!('serviceWorker' in navigator)) {
    console.warn('Service workers not supported')
    return null
  }

  const permissionGranted = await requestNotificationPermission()
  if (!permissionGranted) {
    console.warn('Notification permission not granted')
    return null
  }

  try {
    const registration = await navigator.serviceWorker.ready

    // Check if already subscribed
    let subscription = await registration.pushManager.getSubscription()
    
    if (!subscription) {
      // Subscribe to push notifications
      const vapidPublicKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY
      
      if (!vapidPublicKey) {
        console.error('VAPID public key not configured')
        return null
      }

      subscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(vapidPublicKey),
      })
    }

    // Send subscription to backend
    const response = await fetch('/api/push/subscribe', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        subscription: subscription.toJSON(),
      }),
    })

    if (!response.ok) {
      throw new Error('Failed to save subscription')
    }

    return subscription
  } catch (error) {
    console.error('Push subscription failed:', error)
    return null
  }
}

export async function unsubscribeFromPushNotifications(): Promise<boolean> {
  if (!('serviceWorker' in navigator)) {
    return false
  }

  try {
    const registration = await navigator.serviceWorker.ready
    const subscription = await registration.pushManager.getSubscription()

    if (subscription) {
      await subscription.unsubscribe()
      
      // Notify backend
      await fetch('/api/push/unsubscribe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          subscription: subscription.toJSON(),
        }),
      })

      return true
    }

    return false
  } catch (error) {
    console.error('Unsubscribe failed:', error)
    return false
  }
}

// Convert VAPID key from base64 URL to Uint8Array
function urlBase64ToUint8Array(base64String: string): Uint8Array {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4)
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/')

  const rawData = window.atob(base64)
  const outputArray = new Uint8Array(rawData.length)

  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i)
  }

  return outputArray
}

