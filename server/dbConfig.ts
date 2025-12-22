// Database configuration - uses Supabase PostgreSQL or Replit's built-in database
export function getDatabaseUrl(): string {
  // Prefer SUPABASE_DATABASE_URL if explicitly set
  const supabaseDbUrl = process.env.SUPABASE_DATABASE_URL;
  if (supabaseDbUrl) {
    return supabaseDbUrl;
  }
  
  // Fall back to DATABASE_URL (Replit's built-in database)
  const databaseUrl = process.env.DATABASE_URL;
  if (databaseUrl) {
    return databaseUrl;
  }
  
  throw new Error('No database connection configured. Please set SUPABASE_DATABASE_URL or DATABASE_URL');
}
