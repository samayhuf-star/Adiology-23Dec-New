/**
 * Saved Sites Service
 * Handles CRUD operations for saved sites
 */

import { supabase } from './supabase';

export interface SavedSite {
  id: string;
  user_id: string;
  template_id: string | null;
  slug: string;
  title: string;
  html: string;
  assets: Array<{ path: string; content: string; encoding?: string }>;
  metadata: {
    theme?: string;
    accent?: string;
    [key: string]: any;
  };
  status: 'draft' | 'published';
  vercel: {
    projectId?: string;
    deploymentId?: string;
    url?: string;
  };
  created_at: string;
  updated_at: string;
}

export interface ActivityLog {
  id: string;
  user_id: string;
  saved_site_id: string | null;
  action: 'edit' | 'download' | 'publish' | 'duplicate' | 'delete' | 'domain_connect';
  metadata: Record<string, any>;
  created_at: string;
}

/**
 * Get all saved sites for current user
 */
export async function getSavedSites(): Promise<SavedSite[]> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('User not authenticated');

  const { data, error } = await supabase
    .from('saved_sites')
    .select('*')
    .eq('user_id', user.id)
    .order('updated_at', { ascending: false });

  if (error) throw error;
  return data || [];
}

/**
 * Get a single saved site by ID
 */
export async function getSavedSite(id: string): Promise<SavedSite | null> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('User not authenticated');

  const { data, error } = await supabase
    .from('saved_sites')
    .select('*')
    .eq('id', id)
    .eq('user_id', user.id)
    .single();

  if (error) {
    if (error.code === 'PGRST116') return null; // Not found
    throw error;
  }

  return data;
}

/**
 * Get saved site by slug
 */
export async function getSavedSiteBySlug(slug: string): Promise<SavedSite | null> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('User not authenticated');

  const { data, error } = await supabase
    .from('saved_sites')
    .select('*')
    .eq('slug', slug)
    .eq('user_id', user.id)
    .single();

  if (error) {
    if (error.code === 'PGRST116') return null;
    throw error;
  }

  return data;
}

/**
 * Create a new saved site from template
 */
export async function createSavedSiteFromTemplate(
  templateId: string,
  slug: string,
  title: string,
  html: string,
  assets: Array<{ path: string; content: string; encoding?: string }> = [],
  metadata: Record<string, any> = {}
): Promise<SavedSite> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('User not authenticated');

  const { data, error } = await supabase
    .from('saved_sites')
    .insert({
      user_id: user.id,
      template_id: templateId,
      slug,
      title,
      html,
      assets,
      metadata,
      status: 'draft',
    })
    .select()
    .single();

  if (error) throw error;

  // Log activity
  await logActivity(data.id, 'edit', { templateId });

  return data;
}

/**
 * Update saved site
 */
export async function updateSavedSite(
  id: string,
  updates: Partial<Pick<SavedSite, 'title' | 'html' | 'assets' | 'metadata' | 'status' | 'vercel' | 'slug'>>
): Promise<SavedSite> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('User not authenticated');

  const { data, error } = await supabase
    .from('saved_sites')
    .update(updates)
    .eq('id', id)
    .eq('user_id', user.id)
    .select()
    .single();

  if (error) throw error;

  // Log activity if HTML was updated
  if (updates.html) {
    await logActivity(id, 'edit', {});
  }

  return data;
}

/**
 * Delete saved site
 */
export async function deleteSavedSite(id: string): Promise<void> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('User not authenticated');

  const { error } = await supabase
    .from('saved_sites')
    .delete()
    .eq('id', id)
    .eq('user_id', user.id);

  if (error) throw error;

  // Log activity
  await logActivity(id, 'delete', {});
}

/**
 * Duplicate saved site
 */
export async function duplicateSavedSite(id: string, newSlug: string, newTitle: string): Promise<SavedSite> {
  const original = await getSavedSite(id);
  if (!original) throw new Error('Saved site not found');

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('User not authenticated');

  const { data, error } = await supabase
    .from('saved_sites')
    .insert({
      user_id: user.id,
      template_id: original.template_id,
      slug: newSlug,
      title: newTitle,
      html: original.html,
      assets: original.assets,
      metadata: original.metadata,
      status: 'draft',
    })
    .select()
    .single();

  if (error) throw error;

  // Log activity
  await logActivity(data.id, 'duplicate', { originalId: id });

  return data;
}

/**
 * Log activity
 */
export async function logActivity(
  savedSiteId: string | null,
  action: ActivityLog['action'],
  metadata: Record<string, any> = {}
): Promise<void> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return; // Silently fail if not authenticated

  await supabase.from('activity_log').insert({
    user_id: user.id,
    saved_site_id: savedSiteId,
    action,
    metadata,
  });
}

/**
 * Get activity log for user
 */
export async function getActivityLog(limit: number = 50): Promise<ActivityLog[]> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('User not authenticated');

  const { data, error } = await supabase
    .from('activity_log')
    .select('*')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })
    .limit(limit);

  if (error) throw error;
  return data || [];
}

/**
 * Get activity log for a specific saved site
 */
export async function getSavedSiteActivity(savedSiteId: string): Promise<ActivityLog[]> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('User not authenticated');

  const { data, error } = await supabase
    .from('activity_log')
    .select('*')
    .eq('saved_site_id', savedSiteId)
    .eq('user_id', user.id)
    .order('created_at', { ascending: false });

  if (error) throw error;
  return data || [];
}

