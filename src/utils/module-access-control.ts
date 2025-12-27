/**
 * Enhanced Module Access Control System
 * Provides workspace-aware module permission management with real-time updates
 */

import { supabase } from './supabase/client';
import { getCurrentWorkspaceContext, validateWorkspaceAccess, logSecurityViolation } from './workspace-api';
import { loggingService } from './loggingService';
import { z } from 'zod';

// Validation schemas
const ModulePermissionSchema = z.object({
  module_name: z.string().min(1, 'Module name is required'),
  enabled: z.boolean(),
  permissions: z.array(z.enum(['read', 'write', 'delete', 'admin'])).optional(),
});

const UpdateModulePermissionSchema = z.object({
  workspace_id: z.string().uuid('Invalid workspace ID'),
  module_name: z.string().min(1, 'Module name is required'),
  enabled: z.boolean(),
  permissions: z.array(z.enum(['read', 'write', 'delete', 'admin'])).optional(),
});

export interface ModulePermission {
  id: string;
  workspace_id: string;
  module_name: string;
  enabled: boolean;
  permissions: ('read' | 'write' | 'delete' | 'admin')[];
  created_at: string;
  updated_at: string;
}

export interface ModuleAccessResult {
  hasAccess: boolean;
  permissions: ('read' | 'write' | 'delete' | 'admin')[];
  isAdminWorkspace: boolean;
  reason?: string;
}

/**
 * Available modules in the system
 */
export const AVAILABLE_MODULES = {
  CAMPAIGN_BUILDER: 'campaign_builder',
  KEYWORD_PLANNER: 'keyword_planner',
  FORMS: 'forms',
  VM_MANAGEMENT: 'vm_management',
  ANALYTICS: 'analytics',
  BILLING: 'billing',
  TEAM_MANAGEMENT: 'team_management',
  API_ACCESS: 'api_access',
  INTEGRATIONS: 'integrations',
  ADVANCED_FEATURES: 'advanced_features',
} as const;

export type ModuleName = typeof AVAILABLE_MODULES[keyof typeof AVAILABLE_MODULES];

/**
 * Default permissions for admin workspaces
 */
const ADMIN_WORKSPACE_PERMISSIONS: ('read' | 'write' | 'delete' | 'admin')[] = ['read', 'write', 'delete', 'admin'];

/**
 * Module access control service with workspace isolation
 */
export class ModuleAccessControlService {
  private permissionCache = new Map<string, ModulePermission[]>();
  private cacheExpiry = new Map<string, number>();
  private readonly CACHE_TTL = 5 * 60 * 1000; // 5 minutes
  private subscriptions = new Map<string, any>();

  /**
   * Check if user has access to a specific module with detailed permissions
   */
  async checkModuleAccess(moduleName: string, requiredPermission: 'read' | 'write' | 'delete' | 'admin' = 'read'): Promise<ModuleAccessResult> {
    try {
      const context = await getCurrentWorkspaceContext();
      if (!context) {
        return {
          hasAccess: false,
          permissions: [],
          isAdminWorkspace: false,
          reason: 'No workspace context available'
        };
      }

      loggingService.logTransaction('ModuleAccessControl', 'checkModuleAccess', {
        workspaceId: context.workspaceId,
        moduleName,
        requiredPermission
      });

      // Admin workspaces have access to all modules with all permissions
      if (context.isAdminWorkspace) {
        return {
          hasAccess: true,
          permissions: ADMIN_WORKSPACE_PERMISSIONS,
          isAdminWorkspace: true,
          reason: 'Admin workspace has full access'
        };
      }

      // Get module permissions for the workspace
      const modulePermissions = await this.getWorkspaceModulePermissions(context.workspaceId);
      const modulePermission = modulePermissions.find(mp => mp.module_name === moduleName);

      if (!modulePermission || !modulePermission.enabled) {
        logSecurityViolation('module_access_denied', context.workspaceId, context.userId, {
          moduleName,
          requiredPermission,
          reason: 'Module not enabled for workspace'
        });

        return {
          hasAccess: false,
          permissions: [],
          isAdminWorkspace: false,
          reason: 'Module not enabled for workspace'
        };
      }

      // Check if user has the required permission
      const hasRequiredPermission = modulePermission.permissions.includes(requiredPermission) || 
                                   modulePermission.permissions.includes('admin');

      if (!hasRequiredPermission) {
        logSecurityViolation('insufficient_module_permissions', context.workspaceId, context.userId, {
          moduleName,
          requiredPermission,
          availablePermissions: modulePermission.permissions
        });

        return {
          hasAccess: false,
          permissions: modulePermission.permissions,
          isAdminWorkspace: false,
          reason: `Insufficient permissions. Required: ${requiredPermission}`
        };
      }

      return {
        hasAccess: true,
        permissions: modulePermission.permissions,
        isAdminWorkspace: false,
        reason: 'Access granted'
      };

    } catch (error) {
      loggingService.addLog('error', 'ModuleAccessControl', 'Error checking module access', {
        error: error instanceof Error ? error.message : String(error),
        moduleName,
        requiredPermission
      });

      return {
        hasAccess: false,
        permissions: [],
        isAdminWorkspace: false,
        reason: 'Error checking access'
      };
    }
  }

  /**
   * Get all module permissions for a workspace with caching
   */
  async getWorkspaceModulePermissions(workspaceId: string): Promise<ModulePermission[]> {
    try {
      // Check cache first
      const cached = this.permissionCache.get(workspaceId);
      const cacheTime = this.cacheExpiry.get(workspaceId);
      
      if (cached && cacheTime && Date.now() < cacheTime) {
        return cached;
      }

      // Validate workspace access
      if (!await validateWorkspaceAccess(workspaceId, 'read_modules')) {
        throw new Error('Access denied to workspace modules');
      }

      const { data, error } = await supabase
        .from('workspace_modules')
        .select('*')
        .eq('workspace_id', workspaceId)
        .order('module_name');

      if (error) {
        throw new Error(`Database error: ${error.message}`);
      }

      const permissions = data || [];
      
      // Update cache
      this.permissionCache.set(workspaceId, permissions);
      this.cacheExpiry.set(workspaceId, Date.now() + this.CACHE_TTL);

      return permissions;

    } catch (error) {
      loggingService.addLog('error', 'ModuleAccessControl', 'Error getting workspace module permissions', {
        error: error instanceof Error ? error.message : String(error),
        workspaceId
      });
      throw error;
    }
  }

  /**
   * Update module permissions for a workspace (admin only)
   */
  async updateModulePermissions(updates: {
    workspace_id: string;
    module_name: string;
    enabled: boolean;
    permissions?: ('read' | 'write' | 'delete' | 'admin')[];
  }): Promise<ModulePermission> {
    try {
      // Validate input
      const validatedData = UpdateModulePermissionSchema.parse(updates);
      
      const context = await getCurrentWorkspaceContext();
      if (!context) {
        throw new Error('No workspace context available');
      }

      // Check if user has admin access to manage modules
      const adminAccess = await this.checkModuleAccess('team_management', 'admin');
      if (!adminAccess.hasAccess && !context.isAdminWorkspace) {
        throw new Error('Insufficient permissions to manage module access');
      }

      // Validate workspace access
      if (!await validateWorkspaceAccess(validatedData.workspace_id, 'manage_modules')) {
        throw new Error('Access denied to manage workspace modules');
      }

      loggingService.logTransaction('ModuleAccessControl', 'updateModulePermissions', {
        workspaceId: context.workspaceId,
        targetWorkspaceId: validatedData.workspace_id,
        moduleName: validatedData.module_name,
        enabled: validatedData.enabled
      });

      // Update or insert module permission
      const { data, error } = await supabase
        .from('workspace_modules')
        .upsert({
          workspace_id: validatedData.workspace_id,
          module_name: validatedData.module_name,
          enabled: validatedData.enabled,
          permissions: validatedData.permissions || ['read'],
          updated_at: new Date().toISOString()
        }, {
          onConflict: 'workspace_id,module_name'
        })
        .select()
        .single();

      if (error) {
        throw new Error(`Database error: ${error.message}`);
      }

      // Clear cache for the workspace
      this.clearWorkspaceCache(validatedData.workspace_id);

      // Notify real-time subscribers
      this.notifyPermissionUpdate(validatedData.workspace_id, validatedData.module_name);

      return data;

    } catch (error) {
      loggingService.addLog('error', 'ModuleAccessControl', 'Error updating module permissions', {
        error: error instanceof Error ? error.message : String(error),
        updates
      });
      
      if (error instanceof z.ZodError) {
        throw new Error(`Validation error: ${error.errors[0].message}`);
      }
      
      throw error;
    }
  }

  /**
   * Get available modules for current workspace
   */
  async getAvailableModules(): Promise<string[]> {
    try {
      const context = await getCurrentWorkspaceContext();
      if (!context) {
        return [];
      }

      // Admin workspaces have access to all modules
      if (context.isAdminWorkspace) {
        return Object.values(AVAILABLE_MODULES);
      }

      const permissions = await this.getWorkspaceModulePermissions(context.workspaceId);
      return permissions
        .filter(p => p.enabled)
        .map(p => p.module_name);

    } catch (error) {
      loggingService.addLog('error', 'ModuleAccessControl', 'Error getting available modules', {
        error: error instanceof Error ? error.message : String(error)
      });
      return [];
    }
  }

  /**
   * Setup real-time subscription for module permission changes
   */
  async subscribeToPermissionUpdates(workspaceId: string, callback: (permissions: ModulePermission[]) => void): Promise<void> {
    try {
      // Validate workspace access
      if (!await validateWorkspaceAccess(workspaceId, 'read_modules')) {
        throw new Error('Access denied to workspace modules');
      }

      // Remove existing subscription if any
      this.unsubscribeFromPermissionUpdates(workspaceId);

      const subscription = supabase
        .channel(`workspace_modules:${workspaceId}`)
        .on(
          'postgres_changes',
          {
            event: '*',
            schema: 'public',
            table: 'workspace_modules',
            filter: `workspace_id=eq.${workspaceId}`
          },
          async (payload) => {
            loggingService.addLog('info', 'ModuleAccessControl', 'Real-time permission update received', {
              workspaceId,
              event: payload.eventType,
              moduleName: payload.new?.module_name || payload.old?.module_name
            });

            // Clear cache and fetch fresh data
            this.clearWorkspaceCache(workspaceId);
            const updatedPermissions = await this.getWorkspaceModulePermissions(workspaceId);
            callback(updatedPermissions);
          }
        )
        .subscribe();

      this.subscriptions.set(workspaceId, subscription);

      loggingService.addLog('info', 'ModuleAccessControl', 'Subscribed to permission updates', {
        workspaceId
      });

    } catch (error) {
      loggingService.addLog('error', 'ModuleAccessControl', 'Error subscribing to permission updates', {
        error: error instanceof Error ? error.message : String(error),
        workspaceId
      });
      throw error;
    }
  }

  /**
   * Unsubscribe from permission updates
   */
  unsubscribeFromPermissionUpdates(workspaceId: string): void {
    const subscription = this.subscriptions.get(workspaceId);
    if (subscription) {
      supabase.removeChannel(subscription);
      this.subscriptions.delete(workspaceId);
      
      loggingService.addLog('info', 'ModuleAccessControl', 'Unsubscribed from permission updates', {
        workspaceId
      });
    }
  }

  /**
   * Clear cache for a specific workspace
   */
  clearWorkspaceCache(workspaceId: string): void {
    this.permissionCache.delete(workspaceId);
    this.cacheExpiry.delete(workspaceId);
  }

  /**
   * Clear all caches
   */
  clearAllCaches(): void {
    this.permissionCache.clear();
    this.cacheExpiry.clear();
  }

  /**
   * Notify subscribers of permission updates
   */
  private notifyPermissionUpdate(workspaceId: string, moduleName: string): void {
    // Dispatch custom event for components to react to permission changes
    window.dispatchEvent(new CustomEvent('modulePermissionUpdated', {
      detail: {
        workspaceId,
        moduleName,
        timestamp: new Date()
      }
    }));
  }

  /**
   * Initialize default modules for a new workspace
   */
  async initializeWorkspaceModules(workspaceId: string, isAdminWorkspace: boolean = false): Promise<void> {
    try {
      const context = await getCurrentWorkspaceContext();
      if (!context) {
        throw new Error('No workspace context available');
      }

      loggingService.logTransaction('ModuleAccessControl', 'initializeWorkspaceModules', {
        workspaceId,
        isAdminWorkspace
      });

      // Default modules for regular workspaces
      const defaultModules = [
        { module_name: AVAILABLE_MODULES.CAMPAIGN_BUILDER, enabled: true, permissions: ['read', 'write'] },
        { module_name: AVAILABLE_MODULES.KEYWORD_PLANNER, enabled: true, permissions: ['read', 'write'] },
        { module_name: AVAILABLE_MODULES.FORMS, enabled: true, permissions: ['read', 'write'] },
        { module_name: AVAILABLE_MODULES.ANALYTICS, enabled: true, permissions: ['read'] },
      ];

      // Admin workspaces get all modules with full permissions
      if (isAdminWorkspace) {
        const allModules = Object.values(AVAILABLE_MODULES).map(moduleName => ({
          module_name: moduleName,
          enabled: true,
          permissions: ADMIN_WORKSPACE_PERMISSIONS
        }));
        
        await this.bulkUpdateModulePermissions(workspaceId, allModules);
      } else {
        await this.bulkUpdateModulePermissions(workspaceId, defaultModules);
      }

    } catch (error) {
      loggingService.addLog('error', 'ModuleAccessControl', 'Error initializing workspace modules', {
        error: error instanceof Error ? error.message : String(error),
        workspaceId,
        isAdminWorkspace
      });
      throw error;
    }
  }

  /**
   * Bulk update module permissions
   */
  private async bulkUpdateModulePermissions(workspaceId: string, modules: Array<{
    module_name: string;
    enabled: boolean;
    permissions: string[];
  }>): Promise<void> {
    const moduleData = modules.map(module => ({
      workspace_id: workspaceId,
      module_name: module.module_name,
      enabled: module.enabled,
      permissions: module.permissions,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    }));

    const { error } = await supabase
      .from('workspace_modules')
      .upsert(moduleData, {
        onConflict: 'workspace_id,module_name'
      });

    if (error) {
      throw new Error(`Database error: ${error.message}`);
    }

    // Clear cache
    this.clearWorkspaceCache(workspaceId);
  }
}

// Export singleton instance
export const moduleAccessControl = new ModuleAccessControlService();

/**
 * React hook for module access control
 */
export function useModuleAccess(moduleName: string, requiredPermission: 'read' | 'write' | 'delete' | 'admin' = 'read') {
  const [accessResult, setAccessResult] = React.useState<ModuleAccessResult>({
    hasAccess: false,
    permissions: [],
    isAdminWorkspace: false
  });
  const [isLoading, setIsLoading] = React.useState(true);

  React.useEffect(() => {
    let mounted = true;

    const checkAccess = async () => {
      try {
        setIsLoading(true);
        const result = await moduleAccessControl.checkModuleAccess(moduleName, requiredPermission);
        if (mounted) {
          setAccessResult(result);
        }
      } catch (error) {
        if (mounted) {
          setAccessResult({
            hasAccess: false,
            permissions: [],
            isAdminWorkspace: false,
            reason: 'Error checking access'
          });
        }
      } finally {
        if (mounted) {
          setIsLoading(false);
        }
      }
    };

    checkAccess();

    // Listen for permission updates
    const handlePermissionUpdate = () => {
      checkAccess();
    };

    window.addEventListener('modulePermissionUpdated', handlePermissionUpdate);
    window.addEventListener('workspaceChanged', handlePermissionUpdate);

    return () => {
      mounted = false;
      window.removeEventListener('modulePermissionUpdated', handlePermissionUpdate);
      window.removeEventListener('workspaceChanged', handlePermissionUpdate);
    };
  }, [moduleName, requiredPermission]);

  return { ...accessResult, isLoading };
}

// Import React for the hook
import React from 'react';