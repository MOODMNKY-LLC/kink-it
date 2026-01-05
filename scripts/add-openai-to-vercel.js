// Script to add OpenAI API key to Vercel production environment
// Run with: node scripts/add-openai-to-vercel.js

const { VercelClient } = require('@vercel/client');
const readline = require('readline');

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

async function addEnvVar() {
  const client = new VercelClient({
    token: process.env.VERCEL_TOKEN || process.env.VERCEL_ACCESS_TOKEN,
  });

  // Get values from environment variables or Notion
  const apiKey = process.env.OPENAI_API_KEY || 'YOUR_OPENAI_API_KEY_HERE';
  const orgId = process.env.OPENAI_ORG_ID || 'YOUR_OPENAI_ORG_ID_HERE';
  const projectId = 'prj_j1cFDo37sJwQctAX6JwG6fErupeZ'; // From .vercel/project.json

  try {
    // Add OPENAI_API_KEY
    await client.env.create({
      projectId,
      key: 'OPENAI_API_KEY',
      value: apiKey,
      type: 'encrypted',
      target: ['production'],
    });
    console.log('✅ Added OPENAI_API_KEY to Vercel production');

    // Add OPENAI_ORG_ID
    await client.env.create({
      projectId,
      key: 'OPENAI_ORG_ID',
      value: orgId,
      type: 'encrypted',
      target: ['production'],
    });
    console.log('✅ Added OPENAI_ORG_ID to Vercel production');
  } catch (error) {
    if (error.message.includes('already exists')) {
      console.log('⚠️  Environment variable already exists in Vercel');
    } else {
      console.error('❌ Error:', error.message);
    }
  }
}

addEnvVar();

