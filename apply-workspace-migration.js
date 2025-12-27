#!/usr/bin/env node

import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Missing Supabase configuration. Please check your .env file.');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function applyMigration() {
  try {
    console.log('🚀 Applying workspace isolation migration...');
    
    // Read the migration file
    const migrationPath = path.join(__dirname, 'supabase/migrations/20251227000000_add_workspace_isolation.sql');
    const migrationSQL = fs.readFileSync(migrationPath, 'utf8');
    
    // Split the migration into individual statements
    const statements = migrationSQL
      .split(';')
      .map(stmt => stmt.trim())
      .filter(stmt => stmt.length > 0 && !stmt.startsWith('--'));
    
    console.log(`📝 Found ${statements.length} SQL statements to execute`);
    
    // Execute each statement
    for (let i = 0; i < statements.length; i++) {
      const statement = statements[i];
      if (statement.trim()) {
        console.log(`⚡ Executing statement ${i + 1}/${statements.length}...`);
        
        const { error } = await supabase.rpc('exec_sql', { 
          sql: statement + ';' 
        });
        
        if (error) {
          console.error(`❌ Error executing statement ${i + 1}:`, error);
          // Continue with other statements for non-critical errors
          if (error.message.includes('already exists') || error.message.includes('does not exist')) {
            console.log('⚠️  Non-critical error, continuing...');
            continue;
          }
          throw error;
        }
        
        console.log(`✅ Statement ${i + 1} executed successfully`);
      }
    }
    
    console.log('🎉 Migration applied successfully!');
    
    // Now run the data migration function
    console.log('📊 Running data migration to assign existing data to workspaces...');
    
    const { error: migrationError } = await supabase.rpc('migrate_user_data_to_workspaces');
    
    if (migrationError) {
      console.error('❌ Error running data migration:', migrationError);
      throw migrationError;
    }
    
    console.log('✅ Data migration completed successfully!');
    console.log('🏁 Workspace isolation is now fully implemented!');
    
  } catch (error) {
    console.error('💥 Migration failed:', error);
    process.exit(1);
  }
}

// Create the exec_sql function if it doesn't exist
async function createExecSqlFunction() {
  const { error } = await supabase.rpc('exec_sql', { 
    sql: `
      CREATE OR REPLACE FUNCTION exec_sql(sql text)
      RETURNS void AS $$
      BEGIN
        EXECUTE sql;
      END;
      $$ LANGUAGE plpgsql SECURITY DEFINER;
    `
  });
  
  if (error && !error.message.includes('already exists')) {
    // Try direct SQL execution
    const { error: directError } = await supabase
      .from('_supabase_migrations')
      .select('*')
      .limit(1);
    
    if (directError) {
      console.error('❌ Cannot create exec_sql function:', error);
      throw error;
    }
  }
}

// Run the migration
createExecSqlFunction().then(() => {
  return applyMigration();
}).catch(error => {
  console.error('💥 Failed to setup or run migration:', error);
  process.exit(1);
});