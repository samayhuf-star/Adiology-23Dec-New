import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { workspaceHelpers, type Workspace } from '../utils/workspaces';
import { workspacePersistence } from '../utils/workspacePersistence';
import { getCurrentAuthUser } from '../utils/auth';
import { moduleAccessControl, ModulePermission } from '../utils/module-access-control';
import { WorkspaceCacheManager } from '../utils/workspace-cache';

interface WorkspaceError {
  type: 'network' | 'auth' | 'permission' | 'timeout' | 'unknown';
  message: string;
  retryable: boolean;
  timestamp: Date;
  retryCount?: number;
}

interface WorkspaceContextType {
  currentWorkspace: Workspace | null;
  workspaces: Workspace[];
  isLoading: boolean;
  error: WorkspaceError | null;
  isInitialized: boolean;
  lastUpdated: Date | null;
  setCurrentWorkspace: (workspace: Workspace | null) => Promise<void>;
  refreshWorkspaces: () => Promise<void>;
  retryInitialization: () => Promise<void>;
  clearError: () => void;
  hasModuleAccess: (moduleName: string, requiredPermission?: 'read' | 'write' | 'delete' | 'admin') => boolean;
  availableModules: string[];
  modulePermissions: ModulePermission[];
  refreshModulePermissions: () => Promise<void>;
}

const WorkspaceContext = createContext<WorkspaceContextType | undefined>(undefined);

interface WorkspaceProviderProps {
  children: ReactNode;
}

export const WorkspaceProvider: React.FC<WorkspaceProviderProps> = ({ children }) => {
  const [currentWorkspace, setCurrentWorkspaceState] = useState<Workspace | null>(null);
  const [workspaces, setWorkspaces] = useState<Workspace[]>([]);
  const [availableModules, setAvailableModules] = useState<string[]>([]);
  const [modulePermissions, setModulePermissions] = useState<ModulePermission[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<WorkspaceError | null>(null);
  const [isInitialized, setIsInitialized] = useState(false);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const [retryCount, setRetryCount] = useState(0);

  // Retry configuration
  const MAX_RETRY_ATTEMPTS = 3;
  const BASE_RETRY_DELAY = 1000; // 1 second
  const MAX_RETRY_DELAY = 10000; // 10 seconds

  const createError = (type: WorkspaceError['type'], message: string, retryable: boolean = true): WorkspaceError => ({
    type,
    message,
    retryable,
    timestamp: new Date(),
    retryCount,
  });

  const clearError = () => {
    setError(null);
    setRetryCount(0);
  };

  const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

  const calculateRetryDelay = (attempt: number): number => {
    const delay = Math.min(BASE_RETRY_DELAY * Math.pow(2, attempt), MAX_RETRY_DELAY);
    // Add jitter to prevent thundering herd
    return delay + Math.random() * 1000;
  };

  const loadWorkspaces = async (isRetry: boolean = false) => {
    try {
      if (!isRetry) {
        setIsLoading(true);
        clearError();
      }
      
      // Check if user is authenticated before loading workspaces (with timeout)
      let user: any = null;
      try {
        const authCheck = Promise.race([
          getCurrentAuthUser(),
          new Promise<null>((_, reject) => 
            setTimeout(() => reject(new Error('Auth check timeout')), 5000)
          )
        ]);
        user = await authCheck;
      } catch (authError: any) {
        // If auth check times out or fails, treat as not authenticated
        console.warn('Auth check failed or timed out:', authError?.message);
        
        if (authError?.message?.includes('timeout')) {
          setError(createError('timeout', 'Authentication check timed out. Please try again.'));
        } else {
          setError(createError('auth', 'Authentication failed. Please log in again.', false));
        }
        
        setWorkspaces([]);
        setCurrentWorkspaceState(null);
        setIsLoading(false);
        return;
      }
      
      if (!user) {
        // User not authenticated, set empty workspaces
        setWorkspaces([]);
        setCurrentWorkspaceState(null);
        setIsLoading(false);
        setIsInitialized(true);
        return;
      }

      // Try to get cached workspaces first for better performance
      let userWorkspaces: Workspace[] | null = null;
      if (!isRetry) {
        userWorkspaces = WorkspaceCacheManager.getCachedUserWorkspaces(user.id);
        if (userWorkspaces) {
          console.log('Using cached workspaces for better performance');
          setWorkspaces(userWorkspaces);
          
          // Continue with the rest of the initialization using cached data
          const savedSession = workspacePersistence.validateSession(userWorkspaces);
          if (savedSession) {
            const saved = userWorkspaces.find((w) => w.id === savedSession.workspaceId);
            if (saved) {
              setCurrentWorkspaceState(saved);
              loadWorkspaceModules(saved.id).catch(console.error);
              setIsLoading(false);
              setIsInitialized(true);
              setLastUpdated(new Date());
              
              // Refresh data in background
              setTimeout(() => {
                workspaceHelpers.getUserWorkspaces().then(freshWorkspaces => {
                  if (freshWorkspaces) {
                    setWorkspaces(freshWorkspaces);
                    WorkspaceCacheManager.cacheUserWorkspaces(user.id, freshWorkspaces);
                  }
                }).catch(console.error);
              }, 100);
              
              return;
            }
          }
        }
      }

      // Add timeout to prevent infinite loading (reduced to 5 seconds)
      const abortController = new AbortController();
      const timeoutId = setTimeout(() => {
        abortController.abort();
      }, 5000);

      try {
        userWorkspaces = await workspaceHelpers.getUserWorkspaces();
        clearTimeout(timeoutId);
        
        // Cache the fresh data
        if (userWorkspaces && user.id) {
          WorkspaceCacheManager.cacheUserWorkspaces(user.id, userWorkspaces);
        }
      } catch (raceError: any) {
        clearTimeout(timeoutId);
        // If aborted due to timeout, use empty array
        if (abortController.signal.aborted) {
          console.warn('Workspace loading timed out, showing empty state');
          setError(createError('timeout', 'Workspace loading timed out. Please try again.'));
          userWorkspaces = [];
        } else {
          // If actual error, re-throw to be caught by outer catch
          throw raceError;
        }
      }
      
      setWorkspaces(userWorkspaces || []);

      // Migrate old data format if needed
      workspacePersistence.migrateOldData();

      // Load current workspace from session or set default
      const savedSession = workspacePersistence.validateSession(userWorkspaces || []);
      
      if (savedSession) {
        const saved = userWorkspaces.find((w) => w.id === savedSession.workspaceId);
        if (saved) {
          setCurrentWorkspaceState(saved);
          // Load modules with timeout using AbortController
          const moduleAbortController = new AbortController();
          const moduleTimeoutId = setTimeout(() => {
            moduleAbortController.abort();
          }, 3000);
          
          loadWorkspaceModules(saved.id)
            .then(() => clearTimeout(moduleTimeoutId))
            .catch(err => {
              clearTimeout(moduleTimeoutId);
              if (!moduleAbortController.signal.aborted) {
                console.error('Error loading workspace modules:', err);
                setError(createError('unknown', 'Failed to load workspace modules. Some features may not be available.'));
              }
              // Don't block on module loading errors
            });
          setIsLoading(false);
          setIsInitialized(true);
          setLastUpdated(new Date());
          return;
        }
      }

      // Set first workspace as default (prefer admin workspace)
      if (userWorkspaces && userWorkspaces.length > 0) {
        const adminWorkspace = userWorkspaces.find((w) => w.is_admin_workspace);
        const defaultWorkspace = adminWorkspace || userWorkspaces[0];
        setCurrentWorkspaceState(defaultWorkspace);
        
        // Save session for the default workspace
        workspacePersistence.saveWorkspaceSession(defaultWorkspace, []);
        
        // Load modules with timeout using AbortController
        const moduleAbortController = new AbortController();
        const moduleTimeoutId = setTimeout(() => {
          moduleAbortController.abort();
        }, 3000);
        
        loadWorkspaceModules(defaultWorkspace.id)
          .then(() => clearTimeout(moduleTimeoutId))
          .catch(err => {
            clearTimeout(moduleTimeoutId);
            if (!moduleAbortController.signal.aborted) {
              console.error('Error loading workspace modules:', err);
              setError(createError('unknown', 'Failed to load workspace modules. Some features may not be available.'));
            }
            // Don't block on module loading errors
          });
      } else {
        // No workspaces - clear any saved workspace session
        workspacePersistence.clearWorkspaceSession();
        setCurrentWorkspaceState(null);
      }
      
      setIsInitialized(true);
      setLastUpdated(new Date());
      setRetryCount(0); // Reset retry count on success
    } catch (error: any) {
      console.error('Error loading workspaces:', error);
      
      // Determine error type
      let errorType: WorkspaceError['type'] = 'unknown';
      let errorMessage = 'Failed to load workspaces. Please try again.';
      
      if (error?.message?.includes('network') || error?.code === 'NETWORK_ERROR') {
        errorType = 'network';
        errorMessage = 'Network error while loading workspaces. Please check your connection.';
      } else if (error?.message?.includes('auth') || error?.code === 'PGRST301') {
        errorType = 'auth';
        errorMessage = 'Authentication error. Please log in again.';
      } else if (error?.message?.includes('permission') || error?.code === 'PGRST205') {
        errorType = 'permission';
        errorMessage = 'Permission denied. Please contact your administrator.';
      }
      
      setError(createError(errorType, errorMessage));
      
      // Handle error with global error handler
      import('../utils/errorHandler').then(({ ErrorHandler }) => {
        ErrorHandler.handleWorkspaceError(error, 'load');
      }).catch(() => {
        // Fallback if error handler can't be loaded
        console.error('Workspace loading error:', error);
      });
      
      // Set empty state on error to prevent breaking the app
      setWorkspaces([]);
      setCurrentWorkspaceState(null);
      workspacePersistence.clearWorkspaceSession();
      setIsInitialized(true);
    } finally {
      // Always set loading to false, even if there was an error
      setIsLoading(false);
    }
  };

  const loadWorkspaceModules = async (workspaceId: string) => {
    try {
      // Try to get cached modules first
      const cachedModules = WorkspaceCacheManager.getCachedWorkspaceModules(workspaceId);
      if (cachedModules) {
        console.log('Using cached modules for workspace:', workspaceId);
        setAvailableModules(cachedModules);
        
        // Load permissions in background
        moduleAccessControl.getWorkspaceModulePermissions(workspaceId)
          .then(permissions => {
            setModulePermissions(permissions);
            const enabledModules = permissions
              .filter(p => p.enabled)
              .map(p => p.module_name);
            
            // Update cache with fresh data
            WorkspaceCacheManager.cacheWorkspaceModules(workspaceId, enabledModules);
            setAvailableModules(enabledModules);
          })
          .catch(console.error);
        
        return;
      }

      // Use enhanced module access control system
      const permissions = await moduleAccessControl.getWorkspaceModulePermissions(workspaceId);
      const enabledModules = permissions
        .filter(p => p.enabled)
        .map(p => p.module_name);
      
      setModulePermissions(permissions);
      setAvailableModules(enabledModules);
      
      // Cache the modules for better performance
      WorkspaceCacheManager.cacheWorkspaceModules(workspaceId, enabledModules);

      // Setup real-time subscription for permission updates
      await moduleAccessControl.subscribeToPermissionUpdates(workspaceId, (updatedPermissions) => {
        const updatedEnabledModules = updatedPermissions
          .filter(p => p.enabled)
          .map(p => p.module_name);
        
        setModulePermissions(updatedPermissions);
        setAvailableModules(updatedEnabledModules);
        
        // Update cache with real-time changes
        WorkspaceCacheManager.cacheWorkspaceModules(workspaceId, updatedEnabledModules);
        
        console.log(`Module permissions updated for workspace: ${workspaceId}`);
      });

    } catch (error) {
      console.error('Error loading workspace modules:', error);
      setAvailableModules([]);
      setModulePermissions([]);
      // Don't set error for module loading failures as it's not critical
    }
  };

  const setCurrentWorkspace = async (workspace: Workspace | null) => {
    try {
      const previousWorkspace = currentWorkspace;
      
      // Clear cache from previous workspace if switching
      if (previousWorkspace && workspace && previousWorkspace.id !== workspace.id) {
        console.log(`Clearing cache for previous workspace: ${previousWorkspace.name}`);
        
        // Unsubscribe from previous workspace permission updates
        moduleAccessControl.unsubscribeFromPermissionUpdates(previousWorkspace.id);
        
        // Clear workspace-specific cached data using the persistence utility
        workspacePersistence.clearWorkspaceData(previousWorkspace.id);
        
        // Invalidate cache for previous workspace
        WorkspaceCacheManager.invalidateWorkspaceCache(previousWorkspace.id);
        
        // Clear modules from previous workspace
        setAvailableModules([]);
        setModulePermissions([]);
      }
      
      // Update current workspace state
      setCurrentWorkspaceState(workspace);
      
      if (workspace) {
        // Preload workspace data for better performance
        WorkspaceCacheManager.preloadWorkspaceData(workspace.id);
        
        // Load modules for new workspace using enhanced system
        await loadWorkspaceModules(workspace.id);
        
        // Save workspace session with modules
        workspacePersistence.saveWorkspaceSession(workspace, availableModules);
        
        console.log(`Successfully switched to workspace: ${workspace.name}`);
      } else {
        // Clear workspace selection
        workspacePersistence.clearWorkspaceSession();
        setAvailableModules([]);
        setModulePermissions([]);
      }
      
      setLastUpdated(new Date());
      
      // Dispatch custom event for other components to react to workspace changes
      window.dispatchEvent(new CustomEvent('workspaceChanged', {
        detail: { 
          previousWorkspace, 
          currentWorkspace: workspace,
          timestamp: new Date()
        }
      }));
      
    } catch (error) {
      console.error('Error setting current workspace:', error);
      setError(createError('unknown', 'Failed to switch workspace. Please try again.'));
      throw error; // Re-throw so calling code can handle it
    }
  };

  const refreshWorkspaces = async () => {
    await loadWorkspaces();
  };

  const retryInitialization = async () => {
    if (retryCount >= MAX_RETRY_ATTEMPTS) {
      setError(createError('unknown', 'Maximum retry attempts reached. Please refresh the page.', false));
      return;
    }

    setRetryCount(prev => prev + 1);
    const delay = calculateRetryDelay(retryCount);
    
    console.log(`Retrying workspace initialization (attempt ${retryCount + 1}/${MAX_RETRY_ATTEMPTS}) after ${delay}ms`);
    await sleep(delay);
    
    await loadWorkspaces(true);
  };

  const hasModuleAccess = (moduleName: string, requiredPermission: 'read' | 'write' | 'delete' | 'admin' = 'read'): boolean => {
    if (!currentWorkspace) return false;
    
    // Admin workspace has access to all modules with all permissions
    if (currentWorkspace.is_admin_workspace) return true;
    
    // Check if module is enabled
    if (!availableModules.includes(moduleName)) return false;
    
    // Find the specific module permission
    const modulePermission = modulePermissions.find(mp => mp.module_name === moduleName);
    if (!modulePermission || !modulePermission.enabled) return false;
    
    // Check if user has the required permission level
    return modulePermission.permissions.includes(requiredPermission) || 
           modulePermission.permissions.includes('admin');
  };

  const refreshModulePermissions = async () => {
    if (currentWorkspace) {
      await loadWorkspaceModules(currentWorkspace.id);
    }
  };

  useEffect(() => {
    loadWorkspaces();
    
    // Safety mechanism: Force loading to false after 15 seconds maximum
    // This ensures the app never gets stuck in loading state
    const safetyTimeout = setTimeout(() => {
      console.warn('Force-setting isLoading to false after 15 seconds (safety mechanism)');
      setIsLoading(false);
    }, 15000);
    
    // Cleanup subscriptions on unmount
    return () => {
      clearTimeout(safetyTimeout);
      
      // Unsubscribe from all permission updates
      if (currentWorkspace) {
        moduleAccessControl.unsubscribeFromPermissionUpdates(currentWorkspace.id);
      }
    };
  }, []);

  const value: WorkspaceContextType = {
    currentWorkspace,
    workspaces,
    isLoading,
    error,
    isInitialized,
    lastUpdated,
    setCurrentWorkspace,
    refreshWorkspaces,
    retryInitialization,
    clearError,
    hasModuleAccess,
    availableModules,
    modulePermissions,
    refreshModulePermissions,
  };

  return <WorkspaceContext.Provider value={value}>{children}</WorkspaceContext.Provider>;
};

export const useWorkspace = (): WorkspaceContextType => {
  const context = useContext(WorkspaceContext);
  if (context === undefined) {
    throw new Error('useWorkspace must be used within a WorkspaceProvider');
  }
  return context;
};

