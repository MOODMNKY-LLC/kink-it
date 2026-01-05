/**
 * Seed Data Verification Script
 * 
 * Verifies that seed data was created correctly and relationships are intact.
 * 
 * Usage:
 *   pnpm tsx scripts/verify-seed-data.ts
 */

import { createClient } from '@supabase/supabase-js'
import { config } from 'dotenv'
import { resolve } from 'path'

// Load environment variables
config({ path: resolve(__dirname, '../.env.local') })

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || 'http://127.0.0.1:55321'
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || 'sb_secret_N7UND0UgjKTVK-Uodkm0Hg_xSvEMPvz'

// Test user UUIDs
const SIMEON_ID = '00000000-0000-0000-0000-000000000001'
const KEVIN_ID = '00000000-0000-0000-0000-000000000002'

// Create Supabase admin client (bypasses RLS)
const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
})

interface VerificationResult {
  name: string
  passed: boolean
  message: string
  details?: any
}

async function verifySeedData() {
  console.log('🔍 Verifying Seed Data...\n')
  const results: VerificationResult[] = []

  try {
    // ============================================================================
    // VERIFY PROFILES
    // ============================================================================
    console.log('👤 Verifying profiles...')

    const { data: profiles, error: profilesError } = await supabase
      .from('profiles')
      .select('*')
      .in('id', [SIMEON_ID, KEVIN_ID])

    if (profilesError) {
      results.push({
        name: 'Profiles Query',
        passed: false,
        message: `Error querying profiles: ${profilesError.message}`,
      })
    } else if (!profiles || profiles.length !== 2) {
      results.push({
        name: 'Profiles Count',
        passed: false,
        message: `Expected 2 profiles, found ${profiles?.length || 0}`,
      })
    } else {
      results.push({
        name: 'Profiles Count',
        passed: true,
        message: `Found ${profiles.length} profiles`,
        details: profiles.map(p => ({ id: p.id, email: p.email, role: p.dynamic_role })),
      })

      // Verify Simeon
      const simeon = profiles.find(p => p.id === SIMEON_ID)
      if (!simeon) {
        results.push({
          name: 'Simeon Profile',
          passed: false,
          message: 'Simeon profile not found',
        })
      } else {
        const checks = [
          { field: 'dynamic_role', expected: 'dominant', actual: simeon.dynamic_role },
          { field: 'system_role', expected: 'admin', actual: simeon.system_role },
          { field: 'partner_id', expected: KEVIN_ID, actual: simeon.partner_id },
        ]

        checks.forEach(check => {
          if (check.actual !== check.expected) {
            results.push({
              name: `Simeon ${check.field}`,
              passed: false,
              message: `Expected ${check.expected}, got ${check.actual}`,
            })
          } else {
            results.push({
              name: `Simeon ${check.field}`,
              passed: true,
              message: `Correct: ${check.expected}`,
            })
          }
        })
      }

      // Verify Kevin
      const kevin = profiles.find(p => p.id === KEVIN_ID)
      if (!kevin) {
        results.push({
          name: 'Kevin Profile',
          passed: false,
          message: 'Kevin profile not found',
        })
      } else {
        const checks = [
          { field: 'dynamic_role', expected: 'submissive', actual: kevin.dynamic_role },
          { field: 'system_role', expected: 'user', actual: kevin.system_role },
          { field: 'partner_id', expected: SIMEON_ID, actual: kevin.partner_id },
          { field: 'submission_state', expected: 'active', actual: kevin.submission_state },
        ]

        checks.forEach(check => {
          if (check.actual !== check.expected) {
            results.push({
              name: `Kevin ${check.field}`,
              passed: false,
              message: `Expected ${check.expected}, got ${check.actual}`,
            })
          } else {
            results.push({
              name: `Kevin ${check.field}`,
              passed: true,
              message: `Correct: ${check.expected}`,
            })
          }
        })
      }
    }

    // ============================================================================
    // VERIFY TASKS
    // ============================================================================
    console.log('✅ Verifying tasks...')

    const { data: tasks, error: tasksError } = await supabase
      .from('tasks')
      .select('*')

    if (tasksError) {
      results.push({
        name: 'Tasks Query',
        passed: false,
        message: `Error querying tasks: ${tasksError.message}`,
      })
    } else if (!tasks || tasks.length === 0) {
      results.push({
        name: 'Tasks Count',
        passed: false,
        message: 'No tasks found',
      })
    } else {
      results.push({
        name: 'Tasks Count',
        passed: true,
        message: `Found ${tasks.length} tasks`,
        details: tasks.map(t => ({ id: t.id, title: t.title, status: t.status, assigned_to: t.assigned_to })),
      })

      // Verify task relationships
      const tasksWithInvalidAssignee = tasks.filter(t => 
        t.assigned_to !== KEVIN_ID && t.assigned_to !== SIMEON_ID
      )
      if (tasksWithInvalidAssignee.length > 0) {
        results.push({
          name: 'Task Assignee Relationships',
          passed: false,
          message: `${tasksWithInvalidAssignee.length} tasks have invalid assignee`,
        })
      } else {
        results.push({
          name: 'Task Assignee Relationships',
          passed: true,
          message: 'All tasks have valid assignees',
        })
      }

      const tasksWithInvalidAssigner = tasks.filter(t => 
        t.assigned_by !== SIMEON_ID
      )
      if (tasksWithInvalidAssigner.length > 0) {
        results.push({
          name: 'Task Assigner Relationships',
          passed: false,
          message: `${tasksWithInvalidAssigner.length} tasks have invalid assigner (should all be Simeon)`,
        })
      } else {
        results.push({
          name: 'Task Assigner Relationships',
          passed: true,
          message: 'All tasks assigned by Simeon',
        })
      }
    }

    // ============================================================================
    // VERIFY TASK TEMPLATES
    // ============================================================================
    console.log('📋 Verifying task templates...')

    const { data: templates, error: templatesError } = await supabase
      .from('task_templates')
      .select('*')

    if (templatesError) {
      results.push({
        name: 'Task Templates Query',
        passed: false,
        message: `Error querying templates: ${templatesError.message}`,
      })
    } else if (!templates || templates.length === 0) {
      results.push({
        name: 'Task Templates Count',
        passed: false,
        message: 'No task templates found',
      })
    } else {
      results.push({
        name: 'Task Templates Count',
        passed: true,
        message: `Found ${templates.length} task templates`,
        details: templates.map(t => ({ id: t.id, title: t.title })),
      })
    }

    // ============================================================================
    // VERIFY SUBMISSION STATE LOGS
    // ============================================================================
    console.log('📊 Verifying submission state logs...')

    const { data: logs, error: logsError } = await supabase
      .from('submission_state_logs')
      .select('*')
      .eq('user_id', KEVIN_ID)

    if (logsError) {
      results.push({
        name: 'Submission State Logs Query',
        passed: false,
        message: `Error querying logs: ${logsError.message}`,
      })
    } else if (!logs || logs.length === 0) {
      results.push({
        name: 'Submission State Logs Count',
        passed: false,
        message: 'No submission state logs found for Kevin',
      })
    } else {
      results.push({
        name: 'Submission State Logs Count',
        passed: true,
        message: `Found ${logs.length} submission state log(s) for Kevin`,
        details: logs.map(l => ({ id: l.id, new_state: l.new_state, created_at: l.created_at })),
      })
    }

    // ============================================================================
    // VERIFY TASK PROOF
    // ============================================================================
    console.log('📸 Verifying task proof...')

    const { data: proofs, error: proofsError } = await supabase
      .from('task_proof')
      .select('*')

    if (proofsError) {
      results.push({
        name: 'Task Proof Query',
        passed: false,
        message: `Error querying proof: ${proofsError.message}`,
      })
    } else if (!proofs || proofs.length === 0) {
      results.push({
        name: 'Task Proof Count',
        passed: false,
        message: 'No task proof found',
      })
    } else {
      results.push({
        name: 'Task Proof Count',
        passed: true,
        message: `Found ${proofs.length} task proof submission(s)`,
        details: proofs.map(p => ({ id: p.id, proof_type: p.proof_type, task_id: p.task_id })),
      })
    }

    // ============================================================================
    // SUMMARY
    // ============================================================================
    console.log('\n📊 Verification Results:\n')

    const passed = results.filter(r => r.passed).length
    const failed = results.filter(r => !r.passed).length

    results.forEach(result => {
      const icon = result.passed ? '✅' : '❌'
      console.log(`${icon} ${result.name}: ${result.message}`)
      if (result.details && process.env.VERBOSE) {
        console.log('   Details:', JSON.stringify(result.details, null, 2))
      }
    })

    console.log(`\n📈 Summary: ${passed} passed, ${failed} failed`)

    if (failed === 0) {
      console.log('\n✨ All verifications passed! Seed data is correct.')
      console.log('\n🔗 Next Steps:')
      console.log('   1. Start dev server: pnpm dev')
      console.log('   2. Test API endpoints: pnpm test:api')
      console.log('   3. Test UI components manually')
      return true
    } else {
      console.log('\n⚠️  Some verifications failed. Please review the errors above.')
      return false
    }

  } catch (error) {
    console.error('\n❌ Verification failed:', error)
    return false
  }
}

// Run verification
verifySeedData()
  .then((success) => {
    process.exit(success ? 0 : 1)
  })
  .catch((error) => {
    console.error('\n❌ Fatal error:', error)
    process.exit(1)
  })



