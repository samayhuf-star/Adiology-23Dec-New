import { localStorageHistory, HistoryItem } from './localStorageHistory';
import { createWorkspaceQuery, getCurrentWorkspaceContext } from './workspace-api';
import { supabase } from './supabase/client';

/**
 * History service with workspace isolation
 * Provides a consistent API for saving and retrieving keyword plans, mixer results, etc.
 * Falls back to localStorage when workspace context is unavailable
 */
export const historyService = {
  /**
   * Save a history item with workspace context
   * Uses workspace-aware database storage when available, falls back to localStorage
   */
  async save(type: string, name: string, data: any, status: 'draft' | 'completed' = 'completed'): Promise<string> {
    try {
      const context = await getCurrentWorkspaceContext();
      
      if (context) {
        // Save to database with workspace context
        const { data: savedItem, error } = await supabase
          .from('campaign_history')
          .insert({
            user_id: context.userId,
            workspace_id: context.workspaceId,
            campaign_name: name,
            business_name: data.businessName || '',
            website_url: data.websiteUrl || '',
            status: status,
            campaign_data: data,
            source: type,
            step: data.step || 'completed'
          })
          .select()
          .single();

        if (error) {
          console.warn('Failed to save to database, falling back to localStorage:', error);
          throw error;
        }

        console.log('✅ Saved to database with workspace context:', savedItem.id);
        return savedItem.id;
      } else {
        throw new Error('No workspace context available');
      }
    } catch (error) {
      // Fallback to localStorage for reliability
      console.log('📁 Falling back to localStorage storage');
      await localStorageHistory.save(type, name, data, status);
      const items = localStorageHistory.getAll();
      const savedItem = items[items.length - 1];
      console.log('✅ Saved to localStorage:', savedItem?.id);
      return savedItem?.id || crypto.randomUUID();
    }
  },

  /**
   * Update an existing item (for drafts) with workspace validation
   * If item doesn't exist, creates a new one (upsert behavior)
   */
  async update(id: string, data: any, name?: string): Promise<void> {
    try {
      const context = await getCurrentWorkspaceContext();
      
      if (context) {
        // Update in database with workspace validation
        const { error } = await supabase
          .from('campaign_history')
          .update({
            campaign_data: data,
            campaign_name: name,
            updated_at: new Date().toISOString()
          })
          .eq('id', id)
          .eq('user_id', context.userId)
          .eq('workspace_id', context.workspaceId);

        if (error) {
          console.warn('Failed to update in database, falling back to localStorage:', error);
          throw error;
        }

        console.log('✅ Updated in database with workspace validation:', id);
        return;
      } else {
        throw new Error('No workspace context available');
      }
    } catch (error) {
      // Fallback to localStorage
      console.log('📁 Falling back to localStorage update');
      await localStorageHistory.update(id, data, name);
    }
  },

  /**
   * Mark a draft as completed with workspace validation
   */
  async markAsCompleted(id: string): Promise<void> {
    try {
      const context = await getCurrentWorkspaceContext();
      
      if (context) {
        // Update status in database with workspace validation
        const { error } = await supabase
          .from('campaign_history')
          .update({
            status: 'completed',
            updated_at: new Date().toISOString()
          })
          .eq('id', id)
          .eq('user_id', context.userId)
          .eq('workspace_id', context.workspaceId);

        if (error) {
          console.warn('Failed to mark as completed in database, falling back to localStorage:', error);
          throw error;
        }

        console.log('✅ Marked as completed in database:', id);
        return;
      } else {
        throw new Error('No workspace context available');
      }
    } catch (error) {
      // Fallback to localStorage
      console.log('📁 Falling back to localStorage completion');
      await localStorageHistory.markAsCompleted(id);
    }
  },

  /**
   * Get all history items for current workspace
   * Uses workspace-aware database query when available, falls back to localStorage
   */
  async getAll(): Promise<HistoryItem[]> {
    try {
      const workspaceQuery = await createWorkspaceQuery('campaign_history');
      
      if (workspaceQuery) {
        // Get from database with workspace filtering
        const { data, error } = await workspaceQuery
          .select('*')
          .order('updated_at', { ascending: false });

        if (error) {
          console.warn('Failed to load from database, falling back to localStorage:', error);
          throw error;
        }

        // Transform database records to HistoryItem format
        const items: HistoryItem[] = (data || []).map((record: any) => ({
          id: record.id,
          type: record.source || 'campaign',
          name: record.campaign_name || 'Unnamed',
          data: record.campaign_data || {},
          timestamp: record.created_at,
          status: record.status || 'completed',
          lastModified: record.updated_at,
        }));

        console.log(`✅ Loaded ${items.length} items from database`);
        return items;
      } else {
        throw new Error('No workspace context available');
      }
    } catch (error) {
      // Fallback to localStorage for reliability
      console.log('📁 Falling back to localStorage retrieval');
      try {
        const localItems = localStorageHistory.getAll();
        // Validate and sanitize localStorage items
        return localItems.map((item: any) => ({
          id: item.id || crypto.randomUUID(),
          type: item.type || 'unknown',
          name: item.name || 'Unnamed',
          data: item.data || {},
          timestamp: item.timestamp || new Date().toISOString(),
          status: item.status || 'completed',
          lastModified: item.lastModified,
        }));
      } catch (localError) {
        console.error('Failed to load from localStorage:', localError);
        return [];
      }
    }
  },

  /**
   * Get history (alias for getAll that returns the expected format)
   */
  async getHistory(): Promise<{ history: HistoryItem[] }> {
    const items = await this.getAll();
    return { history: items };
  },

  /**
   * Delete a history item with workspace validation
   */
  async delete(id: string): Promise<void> {
    try {
      const context = await getCurrentWorkspaceContext();
      
      if (context) {
        // Delete from database with workspace validation
        const { error } = await supabase
          .from('campaign_history')
          .delete()
          .eq('id', id)
          .eq('user_id', context.userId)
          .eq('workspace_id', context.workspaceId);

        if (error) {
          console.warn('Failed to delete from database, falling back to localStorage:', error);
          throw error;
        }

        console.log('✅ Deleted from database:', id);
        return;
      } else {
        throw new Error('No workspace context available');
      }
    } catch (error) {
      // Fallback to localStorage
      console.log('📁 Falling back to localStorage deletion');
      await localStorageHistory.delete(id);
    }
  },

  /**
   * Delete history (alias for delete)
   */
  async deleteHistory(id: string): Promise<void> {
    return this.delete(id);
  },

  /**
   * Get items by type for current workspace
   */
  async getByType(type: string): Promise<HistoryItem[]> {
    const items = await this.getAll();
    return items.filter(item => item.type === type);
  }
};