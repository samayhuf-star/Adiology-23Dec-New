/**
 * Published Websites Database Utilities
 */

import { supabase } from './supabase/client';

export interface PublishedWebsite {
  id: string;
  user_id: string;
  name: string;
  template_id: string;
  template_data: any; // JSON of the template
  vercel_deployment_id: string;
  vercel_url: string;
  vercel_project_id: string;
  status: 'deploying' | 'ready' | 'error';
  created_at: string;
  updated_at: string;
}

/**
 * Save published website to database
 */
export async function savePublishedWebsite(
  userId: string,
  websiteData: {
    name: string;
    template_id: string;
    template_data: any;
    vercel_deployment_id: string;
    vercel_url: string;
    vercel_project_id: string;
    status: 'deploying' | 'ready' | 'error';
  }
): Promise<PublishedWebsite> {
  const { data, error } = await supabase
    .from('published_websites')
    .insert({
      user_id: userId,
      name: websiteData.name,
      template_id: websiteData.template_id,
      template_data: websiteData.template_data,
      vercel_deployment_id: websiteData.vercel_deployment_id,
      vercel_url: websiteData.vercel_url,
      vercel_project_id: websiteData.vercel_project_id,
      status: websiteData.status,
    })
    .select()
    .single();

  if (error) {
    throw new Error(`Failed to save published website: ${error.message}`);
  }

  return data;
}

/**
 * Get all published websites for a user
 */
export async function getUserPublishedWebsites(
  userId: string
): Promise<PublishedWebsite[]> {
  try {
    const { data, error } = await supabase
      .from('published_websites')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    // If table doesn't exist, return empty array instead of throwing
    if (error) {
      // Check if error is about missing table (various error message formats)
      const errorMessage = error.message?.toLowerCase() || '';
      const errorCode = error.code || '';
      
      if (
        errorMessage.includes('schema cache') || 
        errorMessage.includes('does not exist') ||
        errorMessage.includes('could not find the table') ||
        errorMessage.includes('relation') && errorMessage.includes('does not exist') ||
        errorCode === 'PGRST116' || // PostgREST error code for missing table
        errorCode === '42P01' || // PostgreSQL error code for undefined table
        errorCode === 'PGRST204' // PostgREST 404 equivalent
      ) {
        // Silently return empty array for missing table (expected in some deployments)
        // Don't log this as an error - it's expected
        return [];
      }
      throw new Error(`Failed to fetch published websites: ${error.message}`);
    }

    return data || [];
  } catch (error: any) {
    // Gracefully handle any errors and return empty array
    // Check if it's a missing table error that wasn't caught above
    const errorMessage = error?.message?.toLowerCase() || '';
    if (
      errorMessage.includes('schema cache') || 
      errorMessage.includes('could not find the table') ||
      errorMessage.includes('does not exist')
    ) {
      // Silently return empty array for missing table
      return [];
    }
    // Only log non-table-missing errors
    console.warn('Error fetching published websites:', error);
    return [];
  }
}

/**
 * Update published website status
 */
export async function updatePublishedWebsiteStatus(
  websiteId: string,
  status: 'deploying' | 'ready' | 'error',
  vercel_url?: string
): Promise<PublishedWebsite> {
  const updateData: any = {
    status,
    updated_at: new Date().toISOString(),
  };

  if (vercel_url) {
    updateData.vercel_url = vercel_url;
  }

  const { data, error } = await supabase
    .from('published_websites')
    .update(updateData)
    .eq('id', websiteId)
    .select()
    .single();

  if (error) {
    throw new Error(`Failed to update website status: ${error.message}`);
  }

  return data;
}

/**
 * Update published website with all fields
 */
export async function updatePublishedWebsite(
  websiteId: string,
  updates: {
    name?: string;
    template_id?: string;
    vercel_url?: string;
    status?: 'deploying' | 'ready' | 'error';
    template_data?: any;
    vercel_deployment_id?: string;
    vercel_project_id?: string;
  }
): Promise<PublishedWebsite> {
  const updateData: any = {
    updated_at: new Date().toISOString(),
  };

  if (updates.name !== undefined) updateData.name = updates.name;
  if (updates.template_id !== undefined) updateData.template_id = updates.template_id;
  if (updates.vercel_url !== undefined) updateData.vercel_url = updates.vercel_url;
  if (updates.status !== undefined) updateData.status = updates.status;
  if (updates.template_data !== undefined) updateData.template_data = updates.template_data;
  if (updates.vercel_deployment_id !== undefined) updateData.vercel_deployment_id = updates.vercel_deployment_id;
  if (updates.vercel_project_id !== undefined) updateData.vercel_project_id = updates.vercel_project_id;

  const { data, error } = await supabase
    .from('published_websites')
    .update(updateData)
    .eq('id', websiteId)
    .select()
    .single();

  if (error) {
    throw new Error(`Failed to update website: ${error.message}`);
  }

  return data;
}

/**
 * Delete published website
 */
export async function deletePublishedWebsite(
  websiteId: string
): Promise<void> {
  const { error } = await supabase
    .from('published_websites')
    .delete()
    .eq('id', websiteId);

  if (error) {
    throw new Error(`Failed to delete website: ${error.message}`);
  }
}

