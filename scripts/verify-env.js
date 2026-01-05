#!/usr/bin/env node

/**
 * Environment Variable Verification Script
 * 
 * This script checks if all required environment variables are set correctly
 * for local development with Supabase.
 */

console.log('\n🔍 Verifying Environment Variables...\n');

const requiredVars = {
  'NEXT_PUBLIC_SUPABASE_URL': {
    description: 'Public Supabase API URL',
    example: 'http://127.0.0.1:55321',
    required: true
  },
  'NEXT_PUBLIC_SUPABASE_ANON_KEY': {
    description: 'Public Supabase Anonymous Key',
    example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
    required: true
  },
  'NOTION_API_KEY': {
    description: 'Notion Integration API Key',
    example: 'ntn_...',
    required: false
  },
  'NOTION_APP_IDEAS_DATABASE_ID': {
    description: 'Notion App Ideas Database ID',
    example: 'cc491ef5f0a64eac8e05a6ea10dfb735',
    required: false
  }
};

let allGood = true;
let missingRequired = [];
let missingOptional = [];

console.log('Required Variables:');
console.log('─'.repeat(80));

for (const [varName, config] of Object.entries(requiredVars)) {
  const value = process.env[varName];
  const status = value ? '✅' : (config.required ? '❌' : '⚠️ ');
  
  console.log(`${status} ${varName}`);
  console.log(`   ${config.description}`);
  
  if (value) {
    // Show partial value for security
    const displayValue = value.length > 50 
      ? `${value.substring(0, 30)}...${value.substring(value.length - 10)}`
      : `${value.substring(0, 20)}...`;
    console.log(`   Current: ${displayValue}`);
  } else {
    console.log(`   Example: ${config.example}`);
    if (config.required) {
      allGood = false;
      missingRequired.push(varName);
    } else {
      missingOptional.push(varName);
    }
  }
  console.log('');
}

console.log('─'.repeat(80));
console.log('\n📊 Summary:\n');

if (allGood && missingOptional.length === 0) {
  console.log('✅ All environment variables are set correctly!\n');
} else {
  if (missingRequired.length > 0) {
    console.log('❌ Missing required variables:');
    missingRequired.forEach(v => console.log(`   - ${v}`));
    console.log('');
  }
  
  if (missingOptional.length > 0) {
    console.log('⚠️  Missing optional variables:');
    missingOptional.forEach(v => console.log(`   - ${v}`));
    console.log('');
  }
  
  console.log('📝 To fix this:');
  console.log('   1. Ensure Supabase is running: supabase status');
  console.log('   2. Create/update .env.local with the correct values');
  console.log('   3. Restart your dev server: pnpm dev');
  console.log('   4. Run this script again: node scripts/verify-env.js\n');
}

// Test Supabase connection
if (process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
  console.log('🔌 Testing Supabase Connection...\n');
  
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  
  fetch(`${supabaseUrl}/rest/v1/`, {
    headers: {
      'apikey': process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
      'Authorization': `Bearer ${process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY}`
    }
  })
    .then(response => {
      if (response.ok) {
        console.log('✅ Successfully connected to Supabase!\n');
      } else {
        console.log(`❌ Failed to connect to Supabase (Status: ${response.status})`);
        console.log('   Make sure Supabase is running: supabase status\n');
      }
    })
    .catch(error => {
      console.log('❌ Failed to connect to Supabase:');
      console.log(`   ${error.message}`);
      console.log('   Make sure Supabase is running: supabase status\n');
    });
} else {
  console.log('⏭️  Skipping connection test (missing credentials)\n');
}

process.exit(missingRequired.length > 0 ? 1 : 0);



