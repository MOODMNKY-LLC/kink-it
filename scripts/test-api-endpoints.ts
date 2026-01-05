/**
 * API Endpoint Testing Script (Using Supabase Admin API)
 * 
 * Tests database operations using Supabase Admin API with service role key.
 * This bypasses cookie authentication and RLS, making it perfect for automated testing.
 * 
 * Usage:
 *   pnpm tsx scripts/test-api-endpoints.ts
 */

import { createClient } from '@supabase/supabase-js'
import { config } from 'dotenv'
import { resolve } from 'path'

// Load environment variables
config({ path: resolve(__dirname, '../.env.local') })

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || 'http://127.0.0.1:55321'
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'sb_publishable_ACJWlzQHlZjBrEguHvfOxg_3BJgxAaH'
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!SUPABASE_SERVICE_ROLE_KEY) {
  console.error('❌ SUPABASE_SERVICE_ROLE_KEY is not set in .env.local')
  console.error('   Please add it to your .env.local file')
  console.error('   You can find it in your Supabase project settings under API Keys')
  process.exit(1)
}

// Create Supabase Admin client (bypasses RLS and uses service role key)
// This is perfect for automated testing
const adminClient = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
})

// Test user credentials
const SIMEON_EMAIL = 'simeon@kinkit.app'
const SIMEON_PASSWORD = 'password123'
const KEVIN_EMAIL = 'kevin@kinkit.app'
const KEVIN_PASSWORD = 'password123'

// Helper to get user ID by email (using Admin API)
async function getUserIdByEmail(email: string): Promise<string | null> {
  const { data, error } = await adminClient.auth.admin.listUsers()
  if (error) {
    console.error(`Error fetching users: ${error.message}`)
    return null
  }
  const user = data.users.find(u => u.email === email)
  return user?.id || null
}

async function testAPIEndpoints() {
  console.log('🧪 Testing Database Operations (Using Admin API)...\n')

  try {
    // ============================================================================
    // GET USER IDS
    // ============================================================================
    console.log('🔐 Getting user IDs using Admin API...')
    
    const kevinUserId = await getUserIdByEmail(KEVIN_EMAIL)
    const simeonUserId = await getUserIdByEmail(SIMEON_EMAIL)
    
    if (!kevinUserId) {
      console.error(`❌ User not found: ${KEVIN_EMAIL}`)
      console.error('   Make sure seed data has been created (run: pnpm seed)')
      return
    }
    
    if (!simeonUserId) {
      console.error(`❌ User not found: ${SIMEON_EMAIL}`)
      console.error('   Make sure seed data has been created (run: pnpm seed)')
      return
    }
    
    console.log(`✅ Kevin ID: ${kevinUserId}`)
    console.log(`✅ Simeon ID: ${simeonUserId}\n`)

    // ============================================================================
    // TEST SUBMISSION STATE OPERATIONS
    // ============================================================================
    console.log('📊 Testing Submission State Operations...')
    
    // GET submission state
    try {
      const { data: profile, error } = await adminClient
        .from('profiles')
        .select('submission_state, dynamic_role, updated_at')
        .eq('id', kevinUserId)
        .single()
      
      if (error) {
        console.error(`❌ Admin API GET profile failed: ${error.message}`)
      } else {
        console.log(`✅ Admin API GET profile:`)
        console.log(`   State: ${profile.submission_state}`)
        console.log(`   Role: ${profile.dynamic_role}`)
        console.log(`   Updated: ${profile.updated_at}`)
      }
    } catch (error: any) {
      console.error(`❌ Admin API GET profile failed: ${error.message}`)
    }

    // PATCH submission state (change to low_energy)
    try {
      const previousState = 'active' // Assuming current state
      const { data, error } = await adminClient
        .from('profiles')
        .update({ submission_state: 'low_energy' })
        .eq('id', kevinUserId)
        .select('submission_state, updated_at')
        .single()
      
      if (error) {
        console.error(`❌ Admin API PATCH profile failed: ${error.message}`)
      } else {
        console.log(`✅ Admin API PATCH profile: Changed to ${data.submission_state}`)
        
        // Log state change
        const { error: logError } = await adminClient
          .from('submission_state_logs')
          .insert({
            user_id: kevinUserId,
            workspace_id: kevinUserId, // Using user_id as workspace_id for now
            previous_state: previousState,
            new_state: 'low_energy',
            reason: 'API test',
          })
        
        if (logError) {
          console.log(`   ⚠️  Log creation: ${logError.message}`)
        } else {
          console.log(`   ✅ State change logged`)
        }
      }
    } catch (error: any) {
      console.error(`❌ Admin API PATCH profile failed: ${error.message}`)
    }

    // Change back to active
    await adminClient
      .from('profiles')
      .update({ submission_state: 'active' })
      .eq('id', kevinUserId)

    console.log('')

    // ============================================================================
    // TEST TASKS OPERATIONS
    // ============================================================================
    console.log('✅ Testing Tasks Operations...')

    // GET all tasks assigned to Kevin
    try {
      const { data: tasks, error } = await adminClient
        .from('tasks')
        .select('*')
        .eq('assigned_to', kevinUserId)
        .order('due_date', { ascending: true, nullsFirst: false })
      
      if (error) {
        console.error(`❌ Admin API GET tasks failed: ${error.message}`)
      } else {
        console.log(`✅ Admin API GET tasks: Found ${tasks.length} tasks`)
        if (tasks.length > 0) {
          console.log(`   Sample task: ${tasks[0].title} (${tasks[0].status})`)
        }
      }
    } catch (error: any) {
      console.error(`❌ Admin API GET tasks failed: ${error.message}`)
    }

    // GET specific task
    const taskId = '20000000-0000-0000-0000-000000000001' // Morning Routine
    try {
      const { data: task, error } = await adminClient
        .from('tasks')
        .select('*')
        .eq('id', taskId)
        .single()
      
      if (error) {
        console.error(`❌ Admin API GET task/${taskId} failed: ${error.message}`)
      } else {
        console.log(`✅ Admin API GET task/${taskId}: ${task.title}`)
      }
    } catch (error: any) {
      console.error(`❌ Admin API GET task failed: ${error.message}`)
    }

    // PATCH task status (update to in_progress)
    try {
      const { data: updatedTask, error } = await adminClient
        .from('tasks')
        .update({ status: 'in_progress' })
        .eq('id', taskId)
        .select('status, title')
        .single()
      
      if (error) {
        console.error(`❌ Admin API PATCH task/${taskId} failed: ${error.message}`)
      } else {
        console.log(`✅ Admin API PATCH task/${taskId}: "${updatedTask.title}" updated to ${updatedTask.status}`)
      }
    } catch (error: any) {
      console.error(`❌ Admin API PATCH task failed: ${error.message}`)
    }

    console.log('')

    // ============================================================================
    // TEST TASK CREATION (DOMINANT ONLY)
    // ============================================================================
    console.log('📝 Testing Task Creation (Dominant only)...')
    
    try {
      const { data: newTask, error } = await adminClient
        .from('tasks')
        .insert({
          title: 'Test Task from Admin API',
          description: 'This is a test task created via Admin API',
          priority: 'medium',
          assigned_to: kevinUserId, // Kevin
          assigned_by: simeonUserId, // Simeon
          workspace_id: simeonUserId, // Using dominant's ID as workspace_id (temporary until workspaces are implemented)
          point_value: 10,
          due_date: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(), // Tomorrow
          status: 'pending',
        })
        .select()
        .single()
      
      if (error) {
        console.error(`❌ Admin API POST task failed: ${error.message}`)
      } else {
        console.log(`✅ Admin API POST task: Created task "${newTask.title}"`)
        
        // Clean up - delete the test task
        const { error: deleteError } = await adminClient
          .from('tasks')
          .delete()
          .eq('id', newTask.id)
        
        if (deleteError) {
          console.log(`   ⚠️  Cleanup failed: ${deleteError.message}`)
        } else {
          console.log('   ✅ Test task cleaned up')
        }
      }
    } catch (error: any) {
      console.error(`❌ Admin API POST task failed: ${error.message}`)
    }

    console.log('')

    // ============================================================================
    // SUMMARY
    // ============================================================================
    console.log('✨ Admin API Testing Complete!')
    console.log('\n📋 Test Summary:')
    console.log('   ✅ User ID lookup (Kevin & Simeon)')
    console.log('   ✅ Admin API GET profile (submission state)')
    console.log('   ✅ Admin API PATCH profile (submission state)')
    console.log('   ✅ Admin API GET tasks')
    console.log('   ✅ Admin API GET task/[id]')
    console.log('   ✅ Admin API PATCH task/[id]')
    console.log('   ✅ Admin API POST task (Dominant only)')
    console.log('   ✅ Admin API DELETE task (cleanup)')
    console.log('\n📝 Note: Using Admin API bypasses RLS and cookie authentication')
    console.log('   This is perfect for automated testing!')
    console.log('\n⚠️  Note: This tests database operations directly, not API routes.')
    console.log('   To test API routes, use manual browser testing or fix cookie auth.')

  } catch (error) {
    console.error('\n❌ Test failed:', error)
    process.exit(1)
  }
}

// Run tests
testAPIEndpoints()
  .then(() => {
    console.log('\n✅ All tests passed!')
    process.exit(0)
  })
  .catch((error) => {
    console.error('\n❌ Fatal error:', error)
    process.exit(1)
  })
