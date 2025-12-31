// Database configuration - uses Replit's built-in PostgreSQL or Supabase as fallback
export function getDatabaseUrl(): string {
  // Prioritize Replit's built-in DATABASE_URL for production deployments
  const databaseUrl = process.env.DATABASE_URL;
  if (databaseUrl) {
    return databaseUrl;
  }
  
  // Fallback: If SUPABASE_DB_PASSWORD is set, construct the Supabase pooler URL
  const supabasePassword = process.env.SUPABASE_DB_PASSWORD;
  if (supabasePassword) {
    return `postgresql://postgres.kkdnnrwhzofttzajnwlj:${supabasePassword}@aws-1-us-east-1.pooler.supabase.com:5432/postgres`;
  }
  
  // Check SUPABASE_DATABASE_URL if explicitly set with pooler URL
  const supabaseDbUrl = process.env.SUPABASE_DATABASE_URL;
  if (supabaseDbUrl && supabaseDbUrl.includes('pooler.supabase.com')) {
    return supabaseDbUrl;
  }
  
  throw new Error('No database connection configured. Please set DATABASE_URL or SUPABASE_DB_PASSWORD');
}
