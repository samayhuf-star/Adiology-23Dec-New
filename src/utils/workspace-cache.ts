/**
 * Workspace data caching and optimization utilities
 * Implements intelligent caching strategies for workspace data
 */

import { type Workspace } from './workspaces';

interface CacheEntry<T> {
  data: T;
  timestamp: number;
  expiresAt: number;
}

interface WorkspaceCacheConfig {
  workspacesTTL: number; // Time to live for workspace list
  modulesTTL: number; // Time to live for module permissions
  membersTTL: number; // Time to live for member data
  maxCacheSize: number; // Maximum number of entries to cache
}

class WorkspaceCache {
  private cache = new Map<string, CacheEntry<unknown>>();
  private config: WorkspaceCacheConfig = {
    workspacesTTL: 5 * 60 * 1000, // 5 minutes
    modulesTTL: 10 * 60 * 1000, // 10 minutes
    membersTTL: 2 * 60 * 1000, // 2 minutes
    maxCacheSize: 100
  };

  /**
   * Generate cache key for workspace data
   */
  private getCacheKey(type: string, identifier: string): string {
    return `workspace_${type}_${identifier}`;
  }

  /**
   * Check if cache entry is valid
   */
  private isValid(entry: CacheEntry<unknown>): boolean {
    return Date.now() < entry.expiresAt;
  }

  /**
   * Clean expired entries from cache
   */
  private cleanExpired(): void {
    const now = Date.now();
    for (const [key, entry] of this.cache.entries()) {
      if (now >= entry.expiresAt) {
        this.cache.delete(key);
      }
    }
  }

  /**
   * Ensure cache doesn't exceed maximum size
   */
  private enforceMaxSize(): void {
    if (this.cache.size <= this.config.maxCacheSize) return;

    // Remove oldest entries first
    const entries = Array.from(this.cache.entries())
      .sort(([, a], [, b]) => a.timestamp - b.timestamp);
    
    const toRemove = entries.slice(0, this.cache.size - this.config.maxCacheSize);
    toRemove.forEach(([key]) => this.cache.delete(key));
  }

  /**
   * Get cached data
   */
  get<T>(type: string, identifier: string): T | null {
    this.cleanExpired();
    
    const key = this.getCacheKey(type, identifier);
    const entry = this.cache.get(key) as CacheEntry<T> | undefined;
    
    if (!entry || !this.isValid(entry)) {
      this.cache.delete(key);
      return null;
    }
    
    return entry.data;
  }

  /**
   * Set cached data
   */
  set<T>(type: string, identifier: string, data: T, customTTL?: number): void {
    this.cleanExpired();
    this.enforceMaxSize();
    
    const key = this.getCacheKey(type, identifier);
    const now = Date.now();
    
    // Determine TTL based on data type
    let ttl = customTTL;
    if (!ttl) {
      switch (type) {
        case 'workspaces':
          ttl = this.config.workspacesTTL;
          break;
        case 'modules':
          ttl = this.config.modulesTTL;
          break;
        case 'members':
          ttl = this.config.membersTTL;
          break;
        default:
          ttl = this.config.workspacesTTL;
      }
    }
    
    const entry: CacheEntry<T> = {
      data,
      timestamp: now,
      expiresAt: now + ttl
    };
    
    this.cache.set(key, entry);
  }

  /**
   * Invalidate specific cache entry
   */
  invalidate(type: string, identifier: string): void {
    const key = this.getCacheKey(type, identifier);
    this.cache.delete(key);
  }

  /**
   * Invalidate all cache entries for a workspace
   */
  invalidateWorkspace(workspaceId: string): void {
    const keysToDelete: string[] = [];
    
    for (const key of this.cache.keys()) {
      if (key.includes(workspaceId)) {
        keysToDelete.push(key);
      }
    }
    
    keysToDelete.forEach(key => this.cache.delete(key));
  }

  /**
   * Clear all cache entries
   */
  clear(): void {
    this.cache.clear();
  }

  /**
   * Get cache statistics
   */
  getStats(): {
    size: number;
    maxSize: number;
    hitRate: number;
    entries: Array<{ key: string; age: number; expiresIn: number }>;
  } {
    const now = Date.now();
    const entries = Array.from(this.cache.entries()).map(([key, entry]) => ({
      key,
      age: now - entry.timestamp,
      expiresIn: entry.expiresAt - now
    }));

    return {
      size: this.cache.size,
      maxSize: this.config.maxCacheSize,
      hitRate: 0, // Would need to track hits/misses for accurate calculation
      entries
    };
  }

  /**
   * Update cache configuration
   */
  updateConfig(newConfig: Partial<WorkspaceCacheConfig>): void {
    this.config = { ...this.config, ...newConfig };
  }
}

// Singleton instance
export const workspaceCache = new WorkspaceCache();

/**
 * Workspace-specific caching utilities
 */
export class WorkspaceCacheManager {
  /**
   * Cache workspace list for a user
   */
  static cacheUserWorkspaces(userId: string, workspaces: Workspace[]): void {
    workspaceCache.set('workspaces', userId, workspaces);
  }

  /**
   * Get cached workspace list for a user
   */
  static getCachedUserWorkspaces(userId: string): Workspace[] | null {
    return workspaceCache.get<Workspace[]>('workspaces', userId);
  }

  /**
   * Cache workspace modules
   */
  static cacheWorkspaceModules(workspaceId: string, modules: string[]): void {
    workspaceCache.set('modules', workspaceId, modules);
  }

  /**
   * Get cached workspace modules
   */
  static getCachedWorkspaceModules(workspaceId: string): string[] | null {
    return workspaceCache.get<string[]>('modules', workspaceId);
  }

  /**
   * Cache workspace member count
   */
  static cacheWorkspaceMemberCount(workspaceId: string, count: number): void {
    workspaceCache.set('members', workspaceId, count, 2 * 60 * 1000); // 2 minutes TTL
  }

  /**
   * Get cached workspace member count
   */
  static getCachedWorkspaceMemberCount(workspaceId: string): number | null {
    return workspaceCache.get<number>('members', workspaceId);
  }

  /**
   * Invalidate all cache for a workspace when switching
   */
  static invalidateWorkspaceCache(workspaceId: string): void {
    workspaceCache.invalidateWorkspace(workspaceId);
  }

  /**
   * Preload workspace data for better performance
   */
  static async preloadWorkspaceData(workspaceId: string): Promise<void> {
    // This would be implemented to prefetch commonly needed data
    // for a workspace to improve perceived performance
    console.log(`Preloading data for workspace: ${workspaceId}`);
  }

  /**
   * Get cache performance metrics
   */
  static getCacheMetrics(): {
    size: number;
    maxSize: number;
    hitRate: number;
    entries: Array<{ key: string; age: number; expiresIn: number }>;
  } {
    return workspaceCache.getStats();
  }
}

/**
 * React hook for workspace caching
 */
export function useWorkspaceCache() {
  return {
    cacheUserWorkspaces: WorkspaceCacheManager.cacheUserWorkspaces,
    getCachedUserWorkspaces: WorkspaceCacheManager.getCachedUserWorkspaces,
    cacheWorkspaceModules: WorkspaceCacheManager.cacheWorkspaceModules,
    getCachedWorkspaceModules: WorkspaceCacheManager.getCachedWorkspaceModules,
    invalidateWorkspaceCache: WorkspaceCacheManager.invalidateWorkspaceCache,
    preloadWorkspaceData: WorkspaceCacheManager.preloadWorkspaceData,
    getCacheMetrics: WorkspaceCacheManager.getCacheMetrics
  };
}