// Script to verify VM tables were created correctly
import { Client } from 'pg';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

async function verifyVMTables() {
  const client = new Client({
    connectionString: process.env.DATABASE_URL
  });

  try {
    await client.connect();
    console.log('Connected to database');

    // Check if VM tables exist
    const tablesResult = await client.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      AND table_name LIKE '%vm%' OR table_name = 'billing_accounts'
      ORDER BY table_name;
    `);
    
    console.log('VM-related tables:');
    console.table(tablesResult.rows);

    // Check vms table structure
    const vmsStructure = await client.query(`
      SELECT column_name, data_type, is_nullable, column_default
      FROM information_schema.columns 
      WHERE table_name = 'vms' AND table_schema = 'public'
      ORDER BY ordinal_position;
    `);
    
    console.log('\nVMs table structure:');
    console.table(vmsStructure.rows);

    // Test inserting a sample VM record (we'll delete it right after)
    console.log('\nTesting VM table functionality...');
    
    // First, get a user ID to test with
    const userResult = await client.query('SELECT id FROM users LIMIT 1');
    if (userResult.rows.length === 0) {
      console.log('No users found - cannot test VM insertion');
      return;
    }
    
    const testUserId = userResult.rows[0].id;
    console.log(`Using test user ID: ${testUserId}`);
    
    // Insert a test VM
    const insertResult = await client.query(`
      INSERT INTO vms (
        user_id, name, aws_region, instance_type, ami_id, 
        operating_system, cpu_cores, memory_gb, storage_gb,
        hourly_rate_cents, monthly_estimate_cents
      ) VALUES (
        $1, 'test-vm', 'us-east-1', 't3.micro', 'ami-12345',
        'ubuntu-22.04', 1, 1, 8, 104, 7592
      ) RETURNING id;
    `, [testUserId]);
    
    const testVmId = insertResult.rows[0].id;
    console.log(`✅ Successfully inserted test VM with ID: ${testVmId}`);
    
    // Clean up test VM
    await client.query('DELETE FROM vms WHERE id = $1', [testVmId]);
    console.log('✅ Test VM cleaned up successfully');
    
    console.log('\n🎉 VM infrastructure is working correctly!');

  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await client.end();
  }
}

verifyVMTables().catch(console.error);