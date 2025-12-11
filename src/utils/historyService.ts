import { api } from './api';
import { localStorageHistory, HistoryItem } from './localStorageHistory';
import { campaignDatabaseService } from './campaignDatabaseService';

/**
 * History service with automatic fallback to localStorage
 * Tries to use the backend server first, falls back to localStorage if unavailable
 */
export const historyService = {
  /**
   * Save a history item
   * Tries server first, falls back to localStorage
   */
  async save(type: string, name: string, data: any, status: 'draft' | 'completed' = 'completed'): Promise<string> {
    try {
      // Try server first with timeout handling
      const response = await api.post('/history/save', { type, name, data, status });
      // Only return from server if it has a valid ID
      if (response?.id) {
        return response.id;
      }
      // If server returns success but no ID, fall through to localStorage
      console.log('⚠️ Server response missing ID, saving to localStorage instead');
    } catch (error: any) {
      // Check if it's an expected error (backend not deployed)
      const isExpectedError = 
        error?.name === 'NotFoundError' ||
        error?.name === 'TimeoutError' ||
        error?.message?.includes('timeout') ||
        error?.message?.includes('Network error') ||
        error?.message?.includes('404') ||
        error?.message?.includes('fetch') ||
        error?.message?.includes('Request failed') ||
        error?.message?.includes('Not Found');
      
      // Try direct database save as second fallback
      if (isExpectedError) {
        try {
          const dbId = await campaignDatabaseService.save(type, name, data, status);
          if (dbId) {
            console.log('✅ Saved to database directly');
            return dbId;
          }
        } catch (dbError) {
          console.warn('Direct database save failed, using localStorage:', dbError);
        }
      }
    }
    
    // Final fallback to localStorage (always reached if server fails or returns no ID)
    await localStorageHistory.save(type, name, data, status);
    const items = localStorageHistory.getAll();
    const savedItem = items[items.length - 1];
    console.log('✅ Saved to localStorage:', savedItem?.id);
    return savedItem?.id || crypto.randomUUID();
  },

  /**
   * Update an existing item (for drafts)
   * If item doesn't exist, creates a new one (upsert behavior)
   */
  async update(id: string, data: any, name?: string): Promise<void> {
    try {
      // Try server first with timeout handling
      await api.post('/history/update', { id, data, name });
    } catch (error: any) {
      // Silently fallback to localStorage (expected when server is not deployed or times out)
      // This includes timeout errors, network errors, and 404s
      const isExpectedError = 
        error?.name === 'NotFoundError' ||
        error?.name === 'TimeoutError' ||
        error?.message?.includes('timeout') ||
        error?.message?.includes('Network error') ||
        error?.message?.includes('404') ||
        error?.message?.includes('fetch') ||
        error?.message?.includes('Request failed');
      
      // Always fallback silently - don't log expected errors
      // localStorageHistory.update now handles "item not found" gracefully
      try {
        await localStorageHistory.update(id, data, name);
      } catch (localError: any) {
        // Silently handle localStorage errors - they're already handled internally
        // Only log if it's an unexpected error
        if (localError instanceof Error && !localError.message.includes('Item not found')) {
          console.warn('localStorage update had an issue, but continuing:', localError.message);
        }
      }
    }
  },

  /**
   * Mark a draft as completed
   */
  async markAsCompleted(id: string): Promise<void> {
    try {
      // Try server first
      await api.post('/history/mark-completed', { id });
    } catch (error) {
      // Silently fallback to localStorage (expected when server is not deployed)
      await localStorageHistory.markAsCompleted(id);
    }
  },

  /**
   * Get all history items
   * Tries server first, falls back to localStorage
   */
  async getAll(): Promise<HistoryItem[]> {
    try {
      // Try server first
      const response = await api.get('/history/list');
      const items = response.items || [];
      // Validate and sanitize items
      return items.map((item: any) => ({
        id: item.id || crypto.randomUUID(),
        type: item.type || 'unknown',
        name: item.name || 'Unnamed',
        data: item.data || {},
        timestamp: item.timestamp || item.created_at || new Date().toISOString(),
        status: item.status || 'completed',
        lastModified: item.lastModified || item.updated_at,
      }));
    } catch (error: any) {
      // Check if it's an expected error
      const isExpectedError = 
        error?.name === 'NotFoundError' ||
        error?.name === 'TimeoutError' ||
        error?.message?.includes('404') ||
        error?.message?.includes('timeout') ||
        error?.message?.includes('Network error') ||
        error?.message?.includes('fetch');
      
      // Try direct database as fallback
      if (isExpectedError) {
        try {
          const dbItems = await campaignDatabaseService.getAll();
          if (dbItems && dbItems.length > 0) {
            // Convert database format to HistoryItem format with validation
            return dbItems.map((item: any) => ({
              id: item.id || crypto.randomUUID(),
              type: item.type || 'unknown',
              name: item.name || 'Unnamed',
              data: item.data || {},
              timestamp: item.created_at || new Date().toISOString(),
              status: item.status || 'completed',
              lastModified: item.updated_at,
            }));
          }
        } catch (dbError) {
          console.warn('Direct database getAll failed, using localStorage:', dbError);
        }
      }
      
      // Final fallback to localStorage with error handling
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
   * Delete a history item
   * Tries server first, falls back to localStorage
   */
  async delete(id: string): Promise<void> {
    try {
      // Try server first
      await api.post('/history/delete', { id });
    } catch (error) {
      // Silently fallback to localStorage (expected when server is not deployed)
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
   * Get items by type
   */
  async getByType(type: string): Promise<HistoryItem[]> {
    const items = await this.getAll();
    return items.filter(item => item.type === type);
  }
};