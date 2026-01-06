import { openDB, DBSchema, IDBPDatabase } from 'idb'

interface KinkItDB extends DBSchema {
  tasks: {
    key: string
    value: {
      id: string
      title: string
      description?: string
      completed: boolean
      due_date?: string
      created_at: string
      updated_at: string
      // Add other task fields as needed
    }
    indexes: { 'by-completed': boolean; 'by-due-date': string }
  }
  rules: {
    key: string
    value: {
      id: string
      title: string
      description?: string
      created_at: string
      updated_at: string
      // Add other rule fields as needed
    }
  }
  rewards: {
    key: string
    value: {
      id: string
      title: string
      description?: string
      points?: number
      created_at: string
      updated_at: string
    }
  }
  syncQueue: {
    key: string
    value: {
      id: string
      type: 'create' | 'update' | 'delete'
      table: string
      data: any
      timestamp: number
      retries: number
    }
    indexes: { 'by-table': string; 'by-timestamp': number }
  }
}

let dbInstance: IDBPDatabase<KinkItDB> | null = null

export async function getDB(): Promise<IDBPDatabase<KinkItDB>> {
  if (dbInstance) {
    return dbInstance
  }

  dbInstance = await openDB<KinkItDB>('kink-it-db', 1, {
    upgrade(db) {
      // Tasks store
      if (!db.objectStoreNames.contains('tasks')) {
        const taskStore = db.createObjectStore('tasks', { keyPath: 'id' })
        taskStore.createIndex('by-completed', 'completed')
        taskStore.createIndex('by-due-date', 'due_date')
      }

      // Rules store
      if (!db.objectStoreNames.contains('rules')) {
        db.createObjectStore('rules', { keyPath: 'id' })
      }

      // Rewards store
      if (!db.objectStoreNames.contains('rewards')) {
        db.createObjectStore('rewards', { keyPath: 'id' })
      }

      // Sync queue store
      if (!db.objectStoreNames.contains('syncQueue')) {
        const syncStore = db.createObjectStore('syncQueue', { keyPath: 'id' })
        syncStore.createIndex('by-table', 'table')
        syncStore.createIndex('by-timestamp', 'timestamp')
      }
    },
  })

  return dbInstance
}

// Helper functions for common operations
export async function getAllTasks(): Promise<KinkItDB['tasks']['value'][]> {
  const db = await getDB()
  return db.getAll('tasks')
}

export async function getTask(id: string): Promise<KinkItDB['tasks']['value'] | undefined> {
  const db = await getDB()
  return db.get('tasks', id)
}

export async function saveTask(task: KinkItDB['tasks']['value']): Promise<void> {
  const db = await getDB()
  await db.put('tasks', task)
}

export async function deleteTask(id: string): Promise<void> {
  const db = await getDB()
  await db.delete('tasks', id)
}

export async function getAllRules(): Promise<KinkItDB['rules']['value'][]> {
  const db = await getDB()
  return db.getAll('rules')
}

export async function saveRule(rule: KinkItDB['rules']['value']): Promise<void> {
  const db = await getDB()
  await db.put('rules', rule)
}

export async function deleteRule(id: string): Promise<void> {
  const db = await getDB()
  await db.delete('rules', id)
}



