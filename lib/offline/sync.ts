import { getDB } from './db'
import { createClient } from '@/lib/supabase/client'

const MAX_RETRIES = 3

export async function queueSyncOperation(
  type: 'create' | 'update' | 'delete',
  table: string,
  data: any
): Promise<void> {
  const db = await getDB()
  const id = `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`

  await db.add('syncQueue', {
    id,
    type,
    table,
    data,
    timestamp: Date.now(),
    retries: 0,
  })

  // Register background sync if available
  if ('serviceWorker' in navigator && 'sync' in (navigator.serviceWorker as any)) {
    try {
      const registration = await navigator.serviceWorker.ready
      await (registration as any).sync.register(`sync-${table}`)
    } catch (error) {
      console.warn('Background sync registration failed:', error)
      // Fallback: try to sync immediately if online
      if (navigator.onLine) {
        processSyncQueue()
      }
    }
  } else if (navigator.onLine) {
    // Fallback: sync immediately if online and background sync not available
    processSyncQueue()
  }
}

export async function processSyncQueue(): Promise<void> {
  const db = await getDB()
  const queue = await db.getAll('syncQueue')
  
  if (queue.length === 0) {
    return
  }

  // Sort by timestamp (oldest first)
  queue.sort((a, b) => a.timestamp - b.timestamp)

  const supabase = createClient()

  for (const item of queue) {
    // Skip if max retries reached
    if (item.retries >= MAX_RETRIES) {
      console.error(`Max retries reached for sync item: ${item.id}`)
      await db.delete('syncQueue', item.id)
      continue
    }

    try {
      switch (item.type) {
        case 'create':
          const { error: createError } = await supabase
            .from(item.table)
            .insert(item.data)
          
          if (createError) throw createError
          break

        case 'update':
          const { error: updateError } = await supabase
            .from(item.table)
            .update(item.data)
            .eq('id', item.data.id)
          
          if (updateError) throw updateError
          break

        case 'delete':
          const { error: deleteError } = await supabase
            .from(item.table)
            .delete()
            .eq('id', item.data.id)
          
          if (deleteError) throw deleteError
          break
      }

      // Success - remove from queue
      await db.delete('syncQueue', item.id)
    } catch (error) {
      console.error('Sync failed:', error)
      
      // Increment retry count
      await db.put('syncQueue', {
        ...item,
        retries: item.retries + 1,
      })
    }
  }
}

// Listen for online event to trigger sync
if (typeof window !== 'undefined') {
  window.addEventListener('online', () => {
    processSyncQueue()
  })

  // Listen for service worker messages
  if ('serviceWorker' in navigator) {
    navigator.serviceWorker.addEventListener('message', (event) => {
      if (event.data?.type === 'SYNC_QUEUE') {
        processSyncQueue()
      }
    })
  }
}

