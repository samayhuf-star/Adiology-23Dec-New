// Local storage fallback for history when server is unavailable

const STORAGE_KEY = 'adiology-campaign-history';

export interface HistoryItem {
  id: string;
  type: string;
  name: string;
  data: any;
  timestamp: string;
  status?: 'draft' | 'completed'; // Add status field for drafts vs completed items
  lastModified?: string; // Track when draft was last modified
}

// Save to backend API (fallback for large campaigns)
async function saveToBackend(item: HistoryItem): Promise<string> {
  const response = await fetch('/api/campaigns/save', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      campaign_name: item.name,
      business_name: item.data?.businessName || item.name,
      website_url: item.data?.url || '',
      campaign_data: item.data,
      source: 'campaign-builder'
    })
  });
  
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Failed to save to server');
  }
  
  const result = await response.json();
  console.log('✅ Saved to backend database:', result.id);
  return result.id;
}

export const localStorageHistory = {
  // Save an item to local storage with backend fallback
  async save(type: string, name: string, data: any, status: 'draft' | 'completed' = 'completed'): Promise<void> {
    const newItem: HistoryItem = {
      id: crypto.randomUUID(),
      type,
      name,
      data,
      timestamp: new Date().toISOString(),
      status,
      lastModified: new Date().toISOString()
    };
    
    try {
      const history = this.getAll();
      history.push(newItem);
      localStorage.setItem(STORAGE_KEY, JSON.stringify(history));
      console.log(`✅ Saved to local storage as ${status}:`, newItem.id);
    } catch (error: any) {
      // Check if it's a quota exceeded error
      if (error?.name === 'QuotaExceededError' || 
          error?.code === 22 || 
          (error?.message && error.message.includes('quota'))) {
        console.warn('localStorage quota exceeded, saving to backend instead...');
        
        // Try to save to backend
        try {
          await saveToBackend(newItem);
          
          // Save a reference in localStorage (without the large data)
          const history = this.getAll();
          const reference: HistoryItem = {
            ...newItem,
            data: { 
              savedToServer: true, 
              url: data?.url,
              structure: data?.structure,
              keywordCount: data?.keywords?.length || data?.selectedKeywords?.length || 0,
              adCount: data?.ads?.length || 0
            }
          };
          history.push(reference);
          try {
            localStorage.setItem(STORAGE_KEY, JSON.stringify(history));
          } catch {
            // If still fails, just continue - data is saved on server
          }
          return;
        } catch (backendError) {
          console.error('Backend save also failed:', backendError);
          throw backendError;
        }
      }
      
      console.error('Failed to save to localStorage:', error);
      throw error;
    }
  },

  // Update an existing item (for draft updates)
  // If item doesn't exist, creates a new one (upsert behavior)
  async update(id: string, data: any, name?: string): Promise<void> {
    try {
      const history = this.getAll();
      const itemIndex = history.findIndex(item => item.id === id);
      
      if (itemIndex >= 0) {
        // Update existing item
        history[itemIndex].data = data;
        history[itemIndex].lastModified = new Date().toISOString();
        if (name) {
          history[itemIndex].name = name;
        }
        localStorage.setItem(STORAGE_KEY, JSON.stringify(history));
        console.log('✅ Updated in local storage:', id);
      } else {
        // Item not found - create new item instead (upsert behavior)
        // This handles cases where localStorage was cleared or item was deleted
        const newItem: HistoryItem = {
          id,
          type: 'campaign', // Default type, can be inferred from data if needed
          name: name || 'Draft',
          data,
          timestamp: new Date().toISOString(),
          status: 'draft',
          lastModified: new Date().toISOString()
        };
        
        history.push(newItem);
        localStorage.setItem(STORAGE_KEY, JSON.stringify(history));
        console.log('✅ Created new item in local storage (item not found for update):', id);
      }
    } catch (error) {
      // Only log unexpected errors, not "item not found" since we handle it above
      if (error instanceof Error && !error.message.includes('Item not found')) {
        console.error('Failed to update in localStorage:', error);
      }
      // Don't throw - gracefully handle the error
    }
  },

  // Mark a draft as completed
  async markAsCompleted(id: string): Promise<void> {
    try {
      const history = this.getAll();
      const itemIndex = history.findIndex(item => item.id === id);
      
      if (itemIndex >= 0) {
        history[itemIndex].status = 'completed';
        history[itemIndex].lastModified = new Date().toISOString();
        localStorage.setItem(STORAGE_KEY, JSON.stringify(history));
        console.log('✅ Marked as completed in local storage:', id);
      }
    } catch (error) {
      console.error('Failed to mark as completed in localStorage:', error);
      throw error;
    }
  },

  // Get all history items
  getAll(): HistoryItem[] {
    try {
      const data = localStorage.getItem(STORAGE_KEY);
      return data ? JSON.parse(data) : [];
    } catch (error) {
      console.error('Failed to read from localStorage:', error);
      return [];
    }
  },

  // Delete an item by ID
  async delete(id: string): Promise<void> {
    try {
      const history = this.getAll();
      const filtered = history.filter(item => item.id !== id);
      localStorage.setItem(STORAGE_KEY, JSON.stringify(filtered));
      console.log('✅ Deleted from local storage:', id);
    } catch (error) {
      console.error('Failed to delete from localStorage:', error);
      throw error;
    }
  },

  // Get items by type
  getByType(type: string): HistoryItem[] {
    return this.getAll().filter(item => item.type === type);
  },

  // Clear all history
  clear(): void {
    localStorage.removeItem(STORAGE_KEY);
  }
};
