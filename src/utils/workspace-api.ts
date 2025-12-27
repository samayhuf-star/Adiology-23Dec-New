/**
 * Workspace-aware API utilities for multi-tenant data isolation
 * Ensures all API calls include proper workspace context
 */

import { supabase } from './supabase/client';
import { getCurrentAuthUser } from './auth';
import { loggingService } from './loggingService';

export interface WorkspaceContext {
  workspaceId: string;
  userId: string;
  isAdminWorkspace: boolean;
}

/**
 * Get current workspace context from localStorage and validate access
 */
export async function getCurrentWorkspaceContext(): Promise<WorkspaceContext | null> {
  try {
    const user = await getCurrentAuthUser();
    if (!user) {
      loggingService.addLog('warning', 'WorkspaceAPI', 'No authenticated user found');
      return null;
    }

    const workspaceId = localStorage.getItem('current_workspace_id');
    if (!workspaceId) {
      loggingService.addLog('warning', 'WorkspaceAPI', 'No workspace selected');
      return null;
    }

    // Verify user has access to this workspace
    const { data: membership, error } = await supabase
      .from('workspace_members')
      .select('workspace_id, workspaces!inner(is_admin_workspace)')
      .eq('workspace_id', workspaceId)
      .eq('user_id', user.id)
      .eq('status', 'active')
      .single();

    if (error || !membership) {
      loggingService.addLog('error', 'WorkspaceAPI', 'User does not have access to workspace', { 
        workspaceId, 
        userId: user.id,
        error: error?.message 
      });
      // Clear invalid workspace from localStorage
      localStorage.removeItem('current_workspace_id');
      return null;
    }

    return {
      workspaceId,
      userId: user.id,
      isAdminWorkspace: (membership as any).workspaces.is_admin_workspace
    };
  } catch (error) {
    loggingService.addLog('error', 'WorkspaceAPI', 'Error getting workspace context', { 
      error: error instanceof Error ? error.message : String(error) 
    });
    return null;
  }
}

/**
 * Workspace-aware query builder for Supabase
 * Automatically adds workspace filtering to queries
 */
export class WorkspaceQueryBuilder {
  private tableName: string;
  private workspaceContext: WorkspaceContext;

  constructor(tableName: string, workspaceContext: WorkspaceContext) {
    this.tableName = tableName;
    this.workspaceContext = workspaceContext;
  }

  /**
   * Select with automatic workspace filtering
   */
  select(columns: string = '*') {
    const query = supabase
      .from(this.tableName)
      .select(columns);

    // Add workspace filtering based on table structure
    if (this.hasWorkspaceColumn()) {
      return query.eq('workspace_id', this.workspaceContext.workspaceId);
    } else if (this.hasUserColumn()) {
      // For user-scoped tables, filter by user_id
      return query.eq('user_id', this.workspaceContext.userId);
    }

    return query;
  }

  /**
   * Insert with automatic workspace context
   */
  insert(data: any | any[]) {
    const insertData = Array.isArray(data) ? data : [data];
    
    // Add workspace context to each record
    const enrichedData = insertData.map(record => {
      const enriched = { ...record };
      
      if (this.hasWorkspaceColumn()) {
        enriched.workspace_id = this.workspaceContext.workspaceId;
      }
      
      if (this.hasUserColumn() && !enriched.user_id) {
        enriched.user_id = this.workspaceContext.userId;
      }

      return enriched;
    });

    return supabase
      .from(this.tableName)
      .insert(Array.isArray(data) ? enrichedData : enrichedData[0]);
  }

  /**
   * Update with workspace filtering
   */
  update(data: any) {
    const query = supabase
      .from(this.tableName)
      .update(data);

    // Add workspace filtering
    if (this.hasWorkspaceColumn()) {
      return query.eq('workspace_id', this.workspaceContext.workspaceId);
    } else if (this.hasUserColumn()) {
      return query.eq('user_id', this.workspaceContext.userId);
    }

    return query;
  }

  /**
   * Delete with workspace filtering
   */
  delete() {
    const query = supabase
      .from(this.tableName)
      .delete();

    // Add workspace filtering
    if (this.hasWorkspaceColumn()) {
      return query.eq('workspace_id', this.workspaceContext.workspaceId);
    } else if (this.hasUserColumn()) {
      return query.eq('user_id', this.workspaceContext.userId);
    }

    return query;
  }

  /**
   * Check if table has workspace_id column
   */
  private hasWorkspaceColumn(): boolean {
    const workspaceTables = [
      'workspace_modules',
      'workspace_members',
      'forms',
      'form_fields', 
      'form_submissions',
      'vms',
      'vm_billing_records',
      'vm_usage_tracking'
    ];
    return workspaceTables.includes(this.tableName);
  }

  /**
   * Check if table has user_id column (user-scoped data)
   */
  private hasUserColumn(): boolean {
    const userTables = [
      'saved_sites',
      'activity_log',
      'campaign_history',
      'billing_accounts',
      'user_template_preferences'
    ];
    return userTables.includes(this.tableName);
  }
}

/**
 * Create workspace-aware query builder
 */
export async function createWorkspaceQuery(tableName: string): Promise<WorkspaceQueryBuilder | null> {
  const context = await getCurrentWorkspaceContext();
  if (!context) {
    return null;
  }
  
  return new WorkspaceQueryBuilder(tableName, context);
}

/**
 * Workspace-aware API call wrapper
 * Ensures all API calls include workspace context in headers
 */
export async function makeWorkspaceApiCall(
  endpoint: string, 
  options: RequestInit = {}
): Promise<Response> {
  const context = await getCurrentWorkspaceContext();
  if (!context) {
    throw new Error('No workspace context available');
  }

  const headers = {
    'Content-Type': 'application/json',
    'X-Workspace-Id': context.workspaceId,
    'X-User-Id': context.userId,
    ...options.headers
  };

  loggingService.logTransaction('WorkspaceAPI', `${options.method || 'GET'} ${endpoint}`, {
    workspaceId: context.workspaceId,
    endpoint
  });

  return fetch(endpoint, {
    ...options,
    headers
  });
}

/**
 * Log security violation when unauthorized workspace access is attempted
 */
export function logSecurityViolation(
  action: string, 
  attemptedWorkspaceId: string, 
  userId: string,
  metadata: Record<string, any> = {}
): void {
  loggingService.addLog('error', 'Security', `Unauthorized workspace access attempt`, {
    action,
    attemptedWorkspaceId,
    userId,
    timestamp: new Date().toISOString(),
    ...metadata
  });

  // Also log to audit table if available
  supabase.from('audit_logs').insert({
    user_id: userId,
    action: 'unauthorized_workspace_access',
    metadata: {
      action,
      attemptedWorkspaceId,
      ...metadata
    },
    level: 'error'
  }).then(({ error }) => {
    if (error) {
      console.error('Failed to log security violation to audit table:', error);
    }
  });
}

/**
 * Validate workspace access for a given resource
 */
export async function validateWorkspaceAccess(
  resourceWorkspaceId: string,
  action: string = 'access'
): Promise<boolean> {
  const context = await getCurrentWorkspaceContext();
  if (!context) {
    return false;
  }

  // Check if user is trying to access data from their current workspace
  if (resourceWorkspaceId !== context.workspaceId) {
    logSecurityViolation(action, resourceWorkspaceId, context.userId, {
      currentWorkspaceId: context.workspaceId
    });
    return false;
  }

  return true;
}