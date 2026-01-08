const STORAGE_CONFIG = {
  maxStorageBytes: 4 * 1024 * 1024,
  warningThreshold: 0.8,
  maxItemAgeMs: 7 * 24 * 60 * 60 * 1000,
  essentialKeys: [
    'user_preferences',
    'theme',
    'sidebar_state',
  ],
  cacheKeys: [
    'analysis_cache',
    'saved_websites',
    'draft_campaigns',
    'url_analysis_',
    'campaign_builder_',
    'keyword_',
    'negative_keywords_',
    'form_data_',
    'autofill_',
    // NOTE: adiology-campaign-history is NOT included here - it's handled by trimHistoryStorage() 
    // to preserve recent user saves instead of deleting all history
  ],
};

interface StorageItem {
  key: string;
  size: number;
  timestamp?: number;
  isCache: boolean;
}

export function getStorageUsage(): { used: number; total: number; percentage: number } {
  let totalSize = 0;
  
  try {
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key) {
        const value = localStorage.getItem(key);
        if (value) {
          totalSize += key.length + value.length;
        }
      }
    }
  } catch (error) {
    console.error('[StorageManager] Error calculating usage:', error);
  }
  
  const totalBytes = STORAGE_CONFIG.maxStorageBytes;
  return {
    used: totalSize * 2,
    total: totalBytes,
    percentage: (totalSize * 2) / totalBytes,
  };
}

export function getStorageItems(): StorageItem[] {
  const items: StorageItem[] = [];
  
  try {
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key) {
        const value = localStorage.getItem(key);
        const size = value ? (key.length + value.length) * 2 : 0;
        const isCache = STORAGE_CONFIG.cacheKeys.some(cacheKey => key.includes(cacheKey));
        
        let timestamp: number | undefined;
        try {
          const parsed = JSON.parse(value || '{}');
          timestamp = parsed.timestamp || parsed.createdAt || parsed.updated_at;
        } catch {}
        
        items.push({ key, size, timestamp, isCache });
      }
    }
  } catch (error) {
    console.error('[StorageManager] Error getting items:', error);
  }
  
  return items.sort((a, b) => b.size - a.size);
}

export function clearCacheData(): number {
  let clearedBytes = 0;
  const keysToRemove: string[] = [];
  
  try {
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key) {
        const isEssential = STORAGE_CONFIG.essentialKeys.some(k => key === k || key.startsWith(k));
        const isCache = STORAGE_CONFIG.cacheKeys.some(cacheKey => key.includes(cacheKey));
        
        if (!isEssential && isCache) {
          const value = localStorage.getItem(key);
          clearedBytes += (key.length + (value?.length || 0)) * 2;
          keysToRemove.push(key);
        }
      }
    }
    
    keysToRemove.forEach(key => localStorage.removeItem(key));
    console.log(`[StorageManager] Cleared ${keysToRemove.length} cache items (${(clearedBytes / 1024).toFixed(1)} KB)`);
  } catch (error) {
    console.error('[StorageManager] Error clearing cache:', error);
  }
  
  return clearedBytes;
}

export function clearOldData(maxAgeMs: number = STORAGE_CONFIG.maxItemAgeMs): number {
  let clearedBytes = 0;
  const now = Date.now();
  const keysToRemove: string[] = [];
  
  try {
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key) {
        const isEssential = STORAGE_CONFIG.essentialKeys.some(k => key === k || key.startsWith(k));
        if (isEssential) continue;
        
        const value = localStorage.getItem(key);
        if (!value) continue;
        
        try {
          const parsed = JSON.parse(value);
          const timestamp = parsed.timestamp || parsed.createdAt || parsed.updated_at;
          
          if (timestamp && typeof timestamp === 'number' && (now - timestamp) > maxAgeMs) {
            clearedBytes += (key.length + value.length) * 2;
            keysToRemove.push(key);
          }
        } catch {}
      }
    }
    
    keysToRemove.forEach(key => localStorage.removeItem(key));
    if (keysToRemove.length > 0) {
      console.log(`[StorageManager] Cleared ${keysToRemove.length} old items (${(clearedBytes / 1024).toFixed(1)} KB)`);
    }
  } catch (error) {
    console.error('[StorageManager] Error clearing old data:', error);
  }
  
  return clearedBytes;
}

export function clearAllStorage(): void {
  try {
    const essentialData: Record<string, string> = {};
    
    STORAGE_CONFIG.essentialKeys.forEach(key => {
      const value = localStorage.getItem(key);
      if (value) essentialData[key] = value;
    });
    
    localStorage.clear();
    
    Object.entries(essentialData).forEach(([key, value]) => {
      localStorage.setItem(key, value);
    });
    
    console.log('[StorageManager] Cleared all non-essential storage');
  } catch (error) {
    console.error('[StorageManager] Error clearing storage:', error);
  }
}

export function safeSetItem(key: string, value: string): boolean {
  try {
    const itemSize = (key.length + value.length) * 2;
    const usage = getStorageUsage();
    
    if (usage.used + itemSize > usage.total * 0.95) {
      console.warn('[StorageManager] Storage near limit, clearing old data...');
      clearOldData();
      clearCacheData();
    }
    
    localStorage.setItem(key, value);
    return true;
  } catch (error: any) {
    if (error.name === 'QuotaExceededError' || error.code === 22) {
      console.warn('[StorageManager] Quota exceeded, clearing cache...');
      clearCacheData();
      clearOldData();
      
      try {
        localStorage.setItem(key, value);
        return true;
      } catch {
        console.error('[StorageManager] Still cannot save after cleanup');
        return false;
      }
    }
    console.error('[StorageManager] Error saving:', error);
    return false;
  }
}

export function safeGetItem(key: string): string | null {
  try {
    return localStorage.getItem(key);
  } catch (error) {
    console.error('[StorageManager] Error reading:', error);
    return null;
  }
}

// Trim history items to keep only most recent ones
export function trimHistoryStorage(keepCount: number = 15): number {
  let clearedBytes = 0;
  
  try {
    // Find all history keys
    const historyKeys: string[] = [];
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && key.includes('adiology-campaign-history')) {
        historyKeys.push(key);
      }
    }
    
    for (const key of historyKeys) {
      const value = localStorage.getItem(key);
      if (!value) continue;
      
      try {
        const history = JSON.parse(value);
        if (!Array.isArray(history) || history.length <= keepCount) continue;
        
        const originalSize = value.length;
        
        // Sort by timestamp and keep most recent
        history.sort((a: any, b: any) => 
          new Date(b.timestamp || 0).getTime() - new Date(a.timestamp || 0).getTime()
        );
        const trimmed = history.slice(0, keepCount);
        
        localStorage.setItem(key, JSON.stringify(trimmed));
        const newSize = JSON.stringify(trimmed).length;
        clearedBytes += (originalSize - newSize) * 2;
        console.log(`[StorageManager] Trimmed history ${key} from ${history.length} to ${trimmed.length} items`);
      } catch (parseError) {
        // If can't parse, just skip
      }
    }
  } catch (error) {
    console.error('[StorageManager] Error trimming history:', error);
  }
  
  return clearedBytes;
}

export function initStorageManager(): void {
  const usage = getStorageUsage();
  console.log(`[StorageManager] Storage: ${(usage.used / 1024).toFixed(1)} KB / ${(usage.total / 1024).toFixed(0)} KB (${(usage.percentage * 100).toFixed(1)}%)`);
  
  if (usage.percentage > STORAGE_CONFIG.warningThreshold) {
    console.warn('[StorageManager] Storage above threshold, auto-cleaning...');
    
    // First, trim history to keep only recent items (smarter than deleting all)
    trimHistoryStorage(15);
    
    let newUsage = getStorageUsage();
    if (newUsage.percentage > STORAGE_CONFIG.warningThreshold) {
      clearOldData();
    }
    
    newUsage = getStorageUsage();
    if (newUsage.percentage > STORAGE_CONFIG.warningThreshold) {
      // More aggressive trim
      trimHistoryStorage(5);
      clearCacheData();
    }
  }
  
  clearOldData();
}

export function clearStorageNow(): void {
  console.log('[StorageManager] Performing immediate storage cleanup...');
  
  // First trim history (keep recent items)
  trimHistoryStorage(10);
  
  // Then clear other cache items
  clearCacheData();
  clearOldData(24 * 60 * 60 * 1000);
  
  const usage = getStorageUsage();
  console.log(`[StorageManager] After cleanup: ${(usage.used / 1024).toFixed(1)} KB used`);
}
