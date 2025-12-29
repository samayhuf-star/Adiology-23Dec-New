import { localStorageHistory, HistoryItem } from './localStorageHistory';
import { supabase } from './supabase/client';

/**
 * History service
 * Provides a consistent API for saving and retrieving keyword plans, mixer results, etc.
 * Uses backend API for database storage, falls back to localStorage when unavailable
 */

async function getAuthToken(): Promise<string | null> {
  try {
    const { data: { session } } = await supabase.auth.getSession();
    return session?.access_token || null;
  } catch {
    return null;
  }
}

export const historyService = {
  /**
   * Save a history item
   * Uses backend API when available, falls back to localStorage
   */
  async save(type: string, name: string, data: any, status: 'draft' | 'completed' = 'completed'): Promise<string> {
    try {
      const token = await getAuthToken();
      
      if (token) {
        const response = await fetch('/api/campaign-history', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify({ type, name, data, status })
        });

        if (!response.ok) {
          const errorData = await response.json();
          console.warn('Failed to save to database:', errorData);
          throw new Error(errorData.error || 'Failed to save');
        }

        const result = await response.json();
        console.log('Saved to database:', result.data?.id);
        return result.data?.id || crypto.randomUUID();
      } else {
        throw new Error('No auth token available');
      }
    } catch (error) {
      console.log('Falling back to localStorage storage');
      await localStorageHistory.save(type, name, data, status);
      const items = localStorageHistory.getAll();
      const savedItem = items[items.length - 1];
      console.log('Saved to localStorage:', savedItem?.id);
      return savedItem?.id || crypto.randomUUID();
    }
  },

  /**
   * Update an existing item (for drafts)
   */
  async update(id: string, data: any, name?: string): Promise<void> {
    try {
      const token = await getAuthToken();
      
      if (token) {
        const updatePayload: any = { data };
        if (name) {
          updatePayload.name = name;
        }
        
        const response = await fetch(`/api/campaign-history/${id}`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify(updatePayload)
        });

        if (!response.ok) {
          const errorData = await response.json();
          console.warn('Failed to update in database:', errorData);
          throw new Error(errorData.error || 'Failed to update');
        }

        console.log('Updated in database:', id);
        return;
      } else {
        throw new Error('No auth token available');
      }
    } catch (error) {
      console.log('Falling back to localStorage update');
      await localStorageHistory.update(id, data, name);
    }
  },

  /**
   * Mark a draft as completed
   */
  async markAsCompleted(id: string): Promise<void> {
    try {
      const token = await getAuthToken();
      
      if (token) {
        const response = await fetch(`/api/campaign-history/${id}`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify({ status: 'completed' })
        });

        if (!response.ok) {
          const errorData = await response.json();
          console.warn('Failed to mark as completed in database:', errorData);
          throw new Error(errorData.error || 'Failed to update status');
        }

        console.log('Marked as completed in database:', id);
        return;
      } else {
        throw new Error('No auth token available');
      }
    } catch (error) {
      console.log('Falling back to localStorage completion');
      await localStorageHistory.markAsCompleted(id);
    }
  },

  /**
   * Get all history items for current user
   * Uses backend API when available, falls back to localStorage
   */
  async getAll(): Promise<HistoryItem[]> {
    try {
      const token = await getAuthToken();
      
      if (token) {
        const response = await fetch('/api/campaign-history', {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });

        if (!response.ok) {
          const errorData = await response.json();
          console.warn('Failed to load from database:', errorData);
          throw new Error(errorData.error || 'Failed to load');
        }

        const result = await response.json();
        
        // Transform database records to HistoryItem format
        const items: HistoryItem[] = (result.data || []).map((record: any) => ({
          id: record.id,
          type: record.type || 'campaign',
          name: record.name || 'Unnamed',
          data: typeof record.data === 'string' ? JSON.parse(record.data) : (record.data || {}),
          timestamp: record.created_at,
          status: record.status || 'completed',
          lastModified: record.updated_at,
        }));

        console.log(`Loaded ${items.length} items from database`);
        
        // If no items from database, try localStorage for legacy data
        if (items.length === 0) {
          const localItems = localStorageHistory.getAll();
          if (localItems.length > 0) {
            console.log(`Found ${localItems.length} legacy items in localStorage`);
            return localItems;
          }
        }
        
        return items;
      } else {
        throw new Error('No auth token available');
      }
    } catch (error) {
      console.log('Falling back to localStorage retrieval');
      try {
        const localItems = localStorageHistory.getAll();
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
   * Delete a history item
   */
  async delete(id: string): Promise<void> {
    try {
      const token = await getAuthToken();
      
      if (token) {
        const response = await fetch(`/api/campaign-history/${id}`, {
          method: 'DELETE',
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });

        if (!response.ok) {
          const errorData = await response.json();
          console.warn('Failed to delete from database:', errorData);
          throw new Error(errorData.error || 'Failed to delete');
        }

        console.log('Deleted from database:', id);
        return;
      } else {
        throw new Error('No auth token available');
      }
    } catch (error) {
      console.log('Falling back to localStorage deletion');
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
   * Get items by type for current user
   */
  async getByType(type: string): Promise<HistoryItem[]> {
    const items = await this.getAll();
    return items.filter(item => item.type === type);
  }
};
