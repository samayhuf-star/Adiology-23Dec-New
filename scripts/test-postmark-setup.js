#!/usr/bin/env node

/**
 * Quick test script to verify Postmark setup
 * Tests if the email endpoints are working correctly
 */

const SUPABASE_URL = 'https://kkdnnrwhzofttzajnwlj.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImtrZG5ucndoem9mdHR6YWpud2xqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjM0Njk2ODAsImV4cCI6MjA3OTA0NTY4MH0.IVIEaP0Stc0AieekxDFMG_q76vu6KRRMsI_yIjOfmZM';
const API_BASE = `${SUPABASE_URL}/functions/v1/make-server-6757d0ca`;

const EMAIL = process.argv[2] || 'test@example.com';

console.log('\n🧪 Testing Postmark Email Setup');
console.log('================================\n');
console.log(`Supabase URL: ${SUPABASE_URL}`);
console.log(`Test Email: ${EMAIL}\n`);

async function testEmailEndpoint() {
  try {
    console.log('⏳ Sending test email...\n');
    
    const response = await fetch(`${API_BASE}/email/test`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
      },
      body: JSON.stringify({ email: EMAIL }),
    });

    // Try to parse as JSON, but handle text responses
    let data;
    const contentType = response.headers.get('content-type');
    if (contentType && contentType.includes('application/json')) {
      data = await response.json();
    } else {
      const text = await response.text();
      console.error('❌ Received non-JSON response:\n');
      console.error(text);
      console.error('\n⚠️  This error usually means:');
      console.error('  1. Edge Function is not deployed to Supabase');
      console.error('  2. Need to deploy the function first\n');
      console.error('📋 To deploy the Edge Function:');
      console.error('  1. Go to: https://supabase.com/dashboard/project/kkdnnrwhzofttzajnwlj');
      console.error('  2. Navigate to: Edge Functions → make-server-6757d0ca');
      console.error('  3. If function doesn\'t exist, create it');
      console.error('  4. Copy code from: supabase/functions/make-server-6757d0ca/index.tsx');
      console.error('  5. Set secrets: POSTMARK_API_KEY, POSTMARK_FROM_EMAIL, FRONTEND_URL');
      console.error('  6. Deploy the function\n');
      console.error('Or use the deploy script:');
      console.error('  ./scripts/deploy-edge-function.sh\n');
      process.exit(1);
    }

    if (!response.ok) {
      console.error('❌ Test Failed!\n');
      console.error(`Status: ${response.status} ${response.statusText}`);
      console.error('Response:', JSON.stringify(data, null, 2));
      
      if (data.error && data.error.includes('not configured')) {
        console.log('\n💡 Solution:');
        console.log('   Set POSTMARK_API_KEY in Supabase Edge Function secrets');
        console.log('   See POSTMARK_SETUP.md for instructions\n');
      }
      
      process.exit(1);
    }

    console.log('✅ Email sent successfully!\n');
    console.log('Response:', JSON.stringify(data, null, 2));
    
    if (data.messageId) {
      console.log(`\n📬 Message ID: ${data.messageId}`);
      console.log(`📧 Check ${EMAIL} inbox (and spam folder) for the test email`);
    }

    console.log('\n✨ Postmark is configured correctly!');
    console.log('\nNext steps:');
    console.log('  1. Check your email inbox');
    console.log('  2. Verify email was received');
    console.log('  3. Test verification email:');
    console.log(`     node scripts/test-email.js ${EMAIL} verification`);
    
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

testEmailEndpoint();

