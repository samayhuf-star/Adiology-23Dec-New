// Database configuration - uses Supabase PostgreSQL or Replit's built-in database
export function getDatabaseUrl(): string {
  // If SUPABASE_DB_PASSWORD is set, construct the Supabase pooler URL
  // This ensures we use the correct pooler connection that works from Replit's network
  const supabasePassword = process.env.SUPABASE_DB_PASSWORD;
  if (supabasePassword) {
    // Use the session pooler (port 5432) for better compatibility
    return `postgresql://postgres.kkdnnrwhzofttzajnwlj:${supabasePassword}@aws-1-us-east-1.pooler.supabase.com:5432/postgres`;
  }
  
  // Check SUPABASE_DATABASE_URL if explicitly set with pooler URL
  const supabaseDbUrl = process.env.SUPABASE_DATABASE_URL;
  if (supabaseDbUrl && supabaseDbUrl.includes('pooler.supabase.com')) {
    return supabaseDbUrl;
  }
  
  // Fall back to DATABASE_URL (Replit's built-in database)
  const databaseUrl = process.env.DATABASE_URL;
  if (databaseUrl) {
    return databaseUrl;
  }
  
  throw new Error('No database connection configured. Please set SUPABASE_DB_PASSWORD or DATABASE_URL');
}
