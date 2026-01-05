/**
 * Database Seed Script for KINK IT
 * 
 * This script creates test users, profiles, tasks, and related data for local development.
 * 
 * Usage:
 *   pnpm tsx scripts/seed-db.ts
 * 
 * Or with environment variables:
 *   SUPABASE_URL=http://127.0.0.1:55321 SUPABASE_SERVICE_ROLE_KEY=your_key pnpm tsx scripts/seed-db.ts
 */

import { createClient } from '@supabase/supabase-js'
import { config } from 'dotenv'
import { resolve } from 'path'

// Load environment variables
config({ path: resolve(__dirname, '../.env.local') })

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || 'http://127.0.0.1:55321'
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || 'sb_secret_N7UND0UgjKTVK-Uodkm0Hg_xSvEMPvz'

if (!SUPABASE_SERVICE_ROLE_KEY) {
  console.error('❌ SUPABASE_SERVICE_ROLE_KEY is required')
  console.error('   Get it from: supabase status (look for "Secret" key)')
  process.exit(1)
}

// Create Supabase admin client (bypasses RLS)
const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
})

// Test user UUIDs (fixed for consistency)
const SIMEON_ID = '00000000-0000-0000-0000-000000000001'
const KEVIN_ID = '00000000-0000-0000-0000-000000000002'

async function seedDatabase() {
  console.log('🌱 Starting database seed...\n')

  try {
    // ============================================================================
    // CREATE AUTH USERS
    // ============================================================================
    console.log('📝 Creating auth users...')

    // Simeon (Dominant, Admin)
    const { data: simeonAuth, error: simeonAuthError } = await supabase.auth.admin.createUser({
      id: SIMEON_ID,
      email: 'simeon@kinkit.app',
      password: 'password123',
      email_confirm: true,
      user_metadata: {
        name: 'Simeon',
        full_name: 'Simeon',
        display_name: 'Simeon',
        dynamic_role: 'dominant',
      },
    })

    if (simeonAuthError && !simeonAuthError.message.includes('already registered')) {
      console.error('❌ Error creating Simeon auth user:', simeonAuthError.message)
    } else if (simeonAuth) {
      console.log('✅ Created Simeon auth user')
    } else {
      console.log('ℹ️  Simeon auth user already exists')
    }

    // Kevin (Submissive)
    const { data: kevinAuth, error: kevinAuthError } = await supabase.auth.admin.createUser({
      id: KEVIN_ID,
      email: 'kevin@kinkit.app',
      password: 'password123',
      email_confirm: true,
      user_metadata: {
        name: 'Kevin',
        full_name: 'Kevin',
        display_name: 'Kevin',
        dynamic_role: 'submissive',
      },
    })

    if (kevinAuthError && !kevinAuthError.message.includes('already registered')) {
      console.error('❌ Error creating Kevin auth user:', kevinAuthError.message)
    } else if (kevinAuth) {
      console.log('✅ Created Kevin auth user')
    } else {
      console.log('ℹ️  Kevin auth user already exists')
    }

    // Wait a moment for triggers to create profiles
    await new Promise((resolve) => setTimeout(resolve, 1000))

    // ============================================================================
    // UPDATE PROFILES
    // ============================================================================
    console.log('\n👤 Updating profiles...')

    // Simeon's profile (Dominant, Admin)
    const { error: simeonProfileError } = await supabase
      .from('profiles')
      .upsert({
        id: SIMEON_ID,
        email: 'simeon@kinkit.app',
        full_name: 'Simeon',
        display_name: 'Simeon',
        system_role: 'admin',
        dynamic_role: 'dominant',
        partner_id: KEVIN_ID,
        love_languages: ['words_of_affirmation', 'quality_time', 'physical_touch'],
        hard_limits: [],
        soft_limits: [],
        notifications_enabled: true,
        theme_preference: 'dark',
        submission_state: 'active', // Not used for dominants, but column exists
      }, {
        onConflict: 'id',
      })

    if (simeonProfileError) {
      console.error('❌ Error updating Simeon profile:', simeonProfileError.message)
    } else {
      console.log('✅ Updated Simeon profile (Dominant, Admin)')
    }

    // Kevin's profile (Submissive)
    const { error: kevinProfileError } = await supabase
      .from('profiles')
      .upsert({
        id: KEVIN_ID,
        email: 'kevin@kinkit.app',
        full_name: 'Kevin',
        display_name: 'Kevin',
        system_role: 'user',
        dynamic_role: 'submissive',
        partner_id: SIMEON_ID,
        love_languages: ['acts_of_service', 'receiving_gifts', 'words_of_affirmation'],
        hard_limits: ['no_permanent_damage', 'no_public_humiliation'],
        soft_limits: ['light_impact', 'temperature_play'],
        notifications_enabled: true,
        theme_preference: 'dark',
        submission_state: 'active',
      }, {
        onConflict: 'id',
      })

    if (kevinProfileError) {
      console.error('❌ Error updating Kevin profile:', kevinProfileError.message)
    } else {
      console.log('✅ Updated Kevin profile (Submissive)')
    }

    // ============================================================================
    // SUBMISSION STATE LOGS
    // ============================================================================
    console.log('\n📊 Creating submission state logs...')

    const { error: stateLogError } = await supabase
      .from('submission_state_logs')
      .upsert({
        user_id: KEVIN_ID,
        workspace_id: SIMEON_ID,
        previous_state: null,
        new_state: 'active',
        reason: 'Initial submission state - ready for tasks and protocols',
        created_at: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(), // 2 days ago
      }, {
        onConflict: 'id',
        ignoreDuplicates: true,
      })

    if (stateLogError) {
      console.error('❌ Error creating submission state log:', stateLogError.message)
    } else {
      console.log('✅ Created submission state log')
    }

    // ============================================================================
    // TASK TEMPLATES
    // ============================================================================
    console.log('\n📋 Creating task templates...')

    const templates = [
      {
        id: '10000000-0000-0000-0000-000000000001',
        workspace_id: SIMEON_ID,
        title: 'Daily Check-In',
        description: 'Complete your daily check-in form with mood, energy level, and any concerns.',
        default_priority: 'medium',
        default_point_value: 10,
        proof_required: true,
        proof_type: 'text',
        created_by: SIMEON_ID,
      },
      {
        id: '10000000-0000-0000-0000-000000000002',
        workspace_id: SIMEON_ID,
        title: 'Exercise Routine',
        description: 'Complete your assigned exercise routine for the day.',
        default_priority: 'high',
        default_point_value: 20,
        proof_required: true,
        proof_type: 'photo',
        created_by: SIMEON_ID,
      },
      {
        id: '10000000-0000-0000-0000-000000000003',
        workspace_id: SIMEON_ID,
        title: 'Protocol Review',
        description: 'Review and acknowledge the updated protocol document.',
        default_priority: 'medium',
        default_point_value: 15,
        proof_required: true,
        proof_type: 'text',
        created_by: SIMEON_ID,
      },
    ]

    for (const template of templates) {
      const { error } = await supabase
        .from('task_templates')
        .upsert(template, {
          onConflict: 'id',
        })

      if (error) {
        console.error(`❌ Error creating template "${template.title}":`, error.message)
      } else {
        console.log(`✅ Created template: ${template.title}`)
      }
    }

    // ============================================================================
    // TASKS
    // ============================================================================
    console.log('\n✅ Creating tasks...')

    const now = new Date()
    const tasks = [
      {
        id: '20000000-0000-0000-0000-000000000001',
        workspace_id: SIMEON_ID,
        title: 'Complete Morning Routine',
        description: 'Follow your morning protocol: meditation, journaling, and breakfast.',
        priority: 'high',
        status: 'pending',
        due_date: new Date(now.getTime() + 24 * 60 * 60 * 1000).toISOString(), // 1 day from now
        point_value: 25,
        proof_required: true,
        proof_type: 'text',
        template_id: null,
        assigned_by: SIMEON_ID,
        assigned_to: KEVIN_ID,
        created_at: new Date(now.getTime() - 24 * 60 * 60 * 1000).toISOString(), // 1 day ago
        updated_at: new Date(now.getTime() - 24 * 60 * 60 * 1000).toISOString(),
      },
      {
        id: '20000000-0000-0000-0000-000000000002',
        workspace_id: SIMEON_ID,
        title: 'Daily Check-In',
        description: 'Complete your daily check-in form.',
        priority: 'medium',
        status: 'in_progress',
        due_date: new Date(now.getTime() + 6 * 60 * 60 * 1000).toISOString(), // 6 hours from now
        point_value: 10,
        proof_required: true,
        proof_type: 'text',
        template_id: '10000000-0000-0000-0000-000000000001',
        assigned_by: SIMEON_ID,
        assigned_to: KEVIN_ID,
        created_at: new Date(now.getTime() - 2 * 60 * 60 * 1000).toISOString(), // 2 hours ago
        updated_at: new Date(now.getTime() - 30 * 60 * 1000).toISOString(), // 30 minutes ago
      },
      {
        id: '20000000-0000-0000-0000-000000000003',
        workspace_id: SIMEON_ID,
        title: 'Exercise Routine',
        description: 'Complete 30 minutes of cardio and strength training.',
        priority: 'high',
        status: 'completed',
        due_date: new Date(now.getTime() - 24 * 60 * 60 * 1000).toISOString(), // 1 day ago
        point_value: 20,
        proof_required: true,
        proof_type: 'photo',
        template_id: '10000000-0000-0000-0000-000000000002',
        assigned_by: SIMEON_ID,
        assigned_to: KEVIN_ID,
        completed_at: new Date(now.getTime() - 2 * 60 * 60 * 1000).toISOString(), // 2 hours ago
        completion_notes: 'Completed all exercises as assigned. Feeling good!',
        created_at: new Date(now.getTime() - 2 * 24 * 60 * 60 * 1000).toISOString(), // 2 days ago
        updated_at: new Date(now.getTime() - 2 * 60 * 60 * 1000).toISOString(),
      },
      {
        id: '20000000-0000-0000-0000-000000000004',
        workspace_id: SIMEON_ID,
        title: 'Protocol Review',
        description: 'Review the updated consent and protocol document.',
        priority: 'medium',
        status: 'approved',
        due_date: new Date(now.getTime() - 3 * 24 * 60 * 60 * 1000).toISOString(), // 3 days ago
        point_value: 15,
        proof_required: true,
        proof_type: 'text',
        template_id: '10000000-0000-0000-0000-000000000003',
        assigned_by: SIMEON_ID,
        assigned_to: KEVIN_ID,
        completed_at: new Date(now.getTime() - 3 * 24 * 60 * 60 * 1000 + 2 * 60 * 60 * 1000).toISOString(),
        approved_at: new Date(now.getTime() - 3 * 24 * 60 * 60 * 1000 + 4 * 60 * 60 * 1000).toISOString(),
        completion_notes: 'Reviewed and understood all protocols.',
        created_at: new Date(now.getTime() - 4 * 24 * 60 * 60 * 1000).toISOString(), // 4 days ago
        updated_at: new Date(now.getTime() - 3 * 24 * 60 * 60 * 1000 + 4 * 60 * 60 * 1000).toISOString(),
      },
      {
        id: '20000000-0000-0000-0000-000000000005',
        workspace_id: SIMEON_ID,
        title: 'Read Assigned Article',
        description: 'Read the article about communication in D/s dynamics and prepare discussion points.',
        priority: 'low',
        status: 'pending',
        due_date: new Date(now.getTime() + 3 * 24 * 60 * 60 * 1000).toISOString(), // 3 days from now
        point_value: 5,
        proof_required: false,
        proof_type: null,
        template_id: null,
        assigned_by: SIMEON_ID,
        assigned_to: KEVIN_ID,
        created_at: new Date(now.getTime() - 5 * 60 * 60 * 1000).toISOString(), // 5 hours ago
        updated_at: new Date(now.getTime() - 5 * 60 * 60 * 1000).toISOString(),
      },
      {
        id: '20000000-0000-0000-0000-000000000006',
        workspace_id: SIMEON_ID,
        title: 'Immediate Check-In Required',
        description: 'Please check in immediately regarding your current state and any concerns.',
        priority: 'urgent',
        status: 'pending',
        due_date: new Date(now.getTime() + 60 * 60 * 1000).toISOString(), // 1 hour from now
        point_value: 0,
        proof_required: true,
        proof_type: 'text',
        template_id: null,
        assigned_by: SIMEON_ID,
        assigned_to: KEVIN_ID,
        created_at: new Date(now.getTime() - 15 * 60 * 1000).toISOString(), // 15 minutes ago
        updated_at: new Date(now.getTime() - 15 * 60 * 1000).toISOString(),
      },
    ]

    for (const task of tasks) {
      const { error } = await supabase
        .from('tasks')
        .upsert(task, {
          onConflict: 'id',
        })

      if (error) {
        console.error(`❌ Error creating task "${task.title}":`, error.message)
      } else {
        console.log(`✅ Created task: ${task.title} (${task.status})`)
      }
    }

    // ============================================================================
    // TASK PROOF
    // ============================================================================
    console.log('\n📸 Creating task proof...')

    const proofs = [
      {
        id: '30000000-0000-0000-0000-000000000001',
        task_id: '20000000-0000-0000-0000-000000000003', // Exercise Routine
        proof_type: 'photo',
        proof_url: 'https://storage.supabase.co/kink-it/proofs/exercise-20260105.jpg',
        proof_text: null,
        submitted_at: new Date(now.getTime() - 2 * 60 * 60 * 1000).toISOString(),
        created_by: KEVIN_ID,
      },
      {
        id: '30000000-0000-0000-0000-000000000002',
        task_id: '20000000-0000-0000-0000-000000000004', // Protocol Review
        proof_type: 'text',
        proof_url: null,
        proof_text: 'I have reviewed the updated protocol document dated 2026-01-02. I understand all sections including consent boundaries, communication protocols, and safety measures. I acknowledge my submission and agree to follow these guidelines.',
        submitted_at: new Date(now.getTime() - 3 * 24 * 60 * 60 * 1000 + 2 * 60 * 60 * 1000).toISOString(),
        created_by: KEVIN_ID,
      },
    ]

    for (const proof of proofs) {
      const { error } = await supabase
        .from('task_proof')
        .upsert(proof, {
          onConflict: 'id',
        })

      if (error) {
        console.error(`❌ Error creating proof for task ${proof.task_id}:`, error.message)
      } else {
        console.log(`✅ Created proof: ${proof.proof_type}`)
      }
    }

    // ============================================================================
    // SUMMARY
    // ============================================================================
    console.log('\n✨ Seed completed successfully!')
    console.log('\n📝 Test Credentials:')
    console.log('   Simeon (Dominant/Admin): simeon@kinkit.app / password123')
    console.log('   Kevin (Submissive):      kevin@kinkit.app / password123')
    console.log('\n🔗 Next Steps:')
    console.log('   1. Test login with these credentials')
    console.log('   2. Verify tasks appear in the UI')
    console.log('   3. Test submission state changes')
    console.log('   4. Test task creation and completion')

  } catch (error) {
    console.error('\n❌ Seed failed:', error)
    process.exit(1)
  }
}

// Run seed
seedDatabase()
  .then(() => {
    console.log('\n✅ All done!')
    process.exit(0)
  })
  .catch((error) => {
    console.error('\n❌ Fatal error:', error)
    process.exit(1)
  })

