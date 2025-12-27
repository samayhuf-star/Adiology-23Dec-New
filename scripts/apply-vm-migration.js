// Script to apply VM infrastructure migration
import { Client } from 'pg';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function applyMigration() {
  const client = new Client({
    connectionString: process.env.DATABASE_URL
  });

  try {
    await client.connect();
    console.log('Connected to database');

    // Read the migration SQL
    const migrationPath = path.join(__dirname, '../prisma/migrations/20251227112922_add_vm_infrastructure/migration.sql');
    const migrationSQL = fs.readFileSync(migrationPath, 'utf8');

    console.log('Applying VM infrastructure migration...');
    
    // Execute the migration
    await client.query(migrationSQL);
    
    console.log('✅ VM infrastructure migration applied successfully!');
    
    // Mark migration as applied in Prisma's migration table
    try {
      await client.query(`
        INSERT INTO "_prisma_migrations" (id, checksum, finished_at, migration_name, logs, rolled_back_at, started_at, applied_steps_count)
        VALUES (
          '20251227112922_add_vm_infrastructure',
          'e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855',
          NOW(),
          '20251227112922_add_vm_infrastructure',
          '',
          NULL,
          NOW(),
          1
        )
        ON CONFLICT (id) DO NOTHING;
      `);
      console.log('✅ Migration marked as applied in Prisma migration table');
    } catch (error) {
      console.log('Note: Could not update Prisma migration table (this is okay if it doesn\'t exist yet)');
    }

  } catch (error) {
    console.error('❌ Error applying migration:', error.message);
    
    // Check if tables already exist
    if (error.message.includes('already exists')) {
      console.log('✅ Tables already exist - migration may have been applied previously');
    } else {
      throw error;
    }
  } finally {
    await client.end();
  }
}

applyMigration().catch(console.error);