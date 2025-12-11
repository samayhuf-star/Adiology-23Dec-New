#!/usr/bin/env node

/**
 * Test script for Postmark email functionality
 * 
 * Usage:
 *   node scripts/test-email.js <email> [type]
 * 
 * Examples:
 *   node scripts/test-email.js test@example.com test
 *   node scripts/test-email.js test@example.com verification
 *   node scripts/test-email.js test@example.com activation
 * 
 * Environment variables required:
 *   - SUPABASE_URL: Your Supabase project URL
 *   - SUPABASE_ANON_KEY: Your Supabase anonymous key
 */

const SUPABASE_URL = process.env.SUPABASE_URL || '';
const SUPABASE_ANON_KEY = process.env.SUPABASE_ANON_KEY || '';
const EMAIL = process.argv[2];
const EMAIL_TYPE = process.argv[3] || 'test';

if (!EMAIL) {
  console.error('❌ Error: Email address is required');
  console.log('\nUsage: node scripts/test-email.js <email> [type]');
  console.log('\nTypes:');
  console.log('  - test (default): Send a test email');
  console.log('  - verification: Send a verification email');
  console.log('  - activation: Send an activation email');
  process.exit(1);
}

if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
  console.error('❌ Error: Missing environment variables');
  console.log('\nRequired environment variables:');
  console.log('  - SUPABASE_URL');
  console.log('  - SUPABASE_ANON_KEY');
  console.log('\nExample:');
  console.log('  SUPABASE_URL=https://xxx.supabase.co SUPABASE_ANON_KEY=xxx node scripts/test-email.js test@example.com');
  process.exit(1);
}

// Extract project ID from Supabase URL
const projectId = SUPABASE_URL.match(/https?:\/\/([^.]+)\.supabase\.co/)?.[1];
if (!projectId) {
  console.error('❌ Error: Invalid SUPABASE_URL format');
  console.log('Expected format: https://<project-id>.supabase.co');
  process.exit(1);
}

const API_BASE = `https://${projectId}.supabase.co/functions/v1/make-server-6757d0ca`;

async function testEmail() {
  console.log('\n📧 Testing Postmark Email Integration');
  console.log('=====================================\n');
  console.log(`Email: ${EMAIL}`);
  console.log(`Type: ${EMAIL_TYPE}`);
  console.log(`API Endpoint: ${API_BASE}\n`);

  let endpoint;
  let body = { email: EMAIL };

  switch (EMAIL_TYPE.toLowerCase()) {
    case 'test':
      endpoint = '/email/test';
      console.log('Sending test email...\n');
      break;
    
    case 'verification':
      endpoint = '/email/send-verification';
      const verificationToken = `verify_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      body = {
        email: EMAIL,
        token: verificationToken,
        baseUrl: 'https://adiology.online',
      };
      console.log('Sending verification email...\n');
      console.log(`Token: ${verificationToken}\n`);
      break;
    
    case 'activation':
      endpoint = '/email/send-activation';
      const activationToken = `activate_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      body = {
        email: EMAIL,
        token: activationToken,
        baseUrl: 'https://adiology.online',
      };
      console.log('Sending activation email...\n');
      console.log(`Token: ${activationToken}\n`);
      break;
    
    default:
      console.error(`❌ Error: Unknown email type "${EMAIL_TYPE}"`);
      console.log('\nValid types: test, verification, activation');
      process.exit(1);
  }

  try {
    console.log('⏳ Sending request...');
    const response = await fetch(`${API_BASE}${endpoint}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
      },
      body: JSON.stringify(body),
    });

    const data = await response.json();

    if (!response.ok) {
      console.error('❌ Request failed');
      console.error(`Status: ${response.status} ${response.statusText}`);
      console.error('Response:', JSON.stringify(data, null, 2));
      process.exit(1);
    }

    console.log('✅ Email sent successfully!\n');
    console.log('Response:', JSON.stringify(data, null, 2));
    
    if (data.messageId) {
      console.log(`\n📬 Message ID: ${data.messageId}`);
      console.log('Check your email inbox (and spam folder) for the email.');
    }

    if (EMAIL_TYPE === 'verification' && body.token) {
      const verificationUrl = `${body.baseUrl}/verify-email?token=${encodeURIComponent(body.token)}&email=${encodeURIComponent(EMAIL)}`;
      console.log(`\n🔗 Verification URL: ${verificationUrl}`);
    }

    if (EMAIL_TYPE === 'activation' && body.token) {
      const activationUrl = `${body.baseUrl}/verify-email?token=${encodeURIComponent(body.token)}&email=${encodeURIComponent(EMAIL)}`;
      console.log(`\n🔗 Activation URL: ${activationUrl}`);
    }

    console.log('\n✨ Test completed successfully!');
  } catch (error) {
    console.error('\n❌ Error occurred:');
    console.error(error.message);
    if (error.stack) {
      console.error('\nStack trace:');
      console.error(error.stack);
    }
    process.exit(1);
  }
}

// Run the test
testEmail();

