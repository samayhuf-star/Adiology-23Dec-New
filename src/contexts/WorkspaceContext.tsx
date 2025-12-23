import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { workspaceHelpers, type Workspace } from '../utils/workspaces';
import { getCurrentAuthUser } from '../utils/auth';

interface WorkspaceContextType {
  currentWorkspace: Workspace | null;
  workspaces: Workspace[];
  isLoading: boolean;
  setCurrentWorkspace: (workspace: Workspace | null) => void;
  refreshWorkspaces: () => Promise<void>;
  hasModuleAccess: (moduleName: string) => boolean;
  availableModules: string[];
}

const WorkspaceContext = createContext<WorkspaceContextType | undefined>(undefined);

interface WorkspaceProviderProps {
  children: ReactNode;
}

export const WorkspaceProvider: React.FC<WorkspaceProviderProps> = ({ children }) => {
  const [currentWorkspace, setCurrentWorkspaceState] = useState<Workspace | null>(null);
  const [workspaces, setWorkspaces] = useState<Workspace[]>([]);
  const [availableModules, setAvailableModules] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const loadWorkspaces = async () => {
    try {
      setIsLoading(true);
      
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
        return;
      }

      // Add timeout to prevent infinite loading (reduced to 5 seconds)
      const timeoutPromise = new Promise<Workspace[]>((_, reject) => {
        setTimeout(() => {
          reject(new Error('Workspace loading timeout after 5 seconds'));
        }, 5000);
      });

      const workspacesPromise = workspaceHelpers.getUserWorkspaces();
      
      let userWorkspaces: Workspace[];
      try {
        userWorkspaces = await Promise.race([workspacesPromise, timeoutPromise]) as Workspace[];
      } catch (raceError: any) {
        // If timeout wins, log and use empty array
        if (raceError?.message?.includes('timeout')) {
          console.warn('Workspace loading timed out, showing empty state');
          userWorkspaces = [];
        } else {
          // If actual error, re-throw to be caught by outer catch
          throw raceError;
        }
      }
      
      setWorkspaces(userWorkspaces || []);

      // Load current workspace from localStorage or set default
      const savedWorkspaceId = localStorage.getItem('current_workspace_id');
      if (savedWorkspaceId) {
        const saved = userWorkspaces.find((w) => w.id === savedWorkspaceId);
        if (saved) {
          setCurrentWorkspaceState(saved);
          // Load modules with timeout
          Promise.race([
            loadWorkspaceModules(saved.id),
            new Promise((_, reject) => setTimeout(() => reject(new Error('Module loading timeout')), 3000))
          ]).catch(err => {
            console.error('Error loading workspace modules:', err);
            // Don't block on module loading errors
          });
          setIsLoading(false);
          return;
        }
      }

      // Set first workspace as default (prefer admin workspace)
      if (userWorkspaces && userWorkspaces.length > 0) {
        const adminWorkspace = userWorkspaces.find((w) => w.is_admin_workspace);
        const defaultWorkspace = adminWorkspace || userWorkspaces[0];
        setCurrentWorkspaceState(defaultWorkspace);
        localStorage.setItem('current_workspace_id', defaultWorkspace.id);
        // Load modules with timeout
        Promise.race([
          loadWorkspaceModules(defaultWorkspace.id),
          new Promise((_, reject) => setTimeout(() => reject(new Error('Module loading timeout')), 3000))
        ]).catch(err => {
          console.error('Error loading workspace modules:', err);
          // Don't block on module loading errors
        });
      } else {
        // No workspaces - clear any saved workspace ID
        localStorage.removeItem('current_workspace_id');
        setCurrentWorkspaceState(null);
      }
    } catch (error: any) {
      console.error('Error loading workspaces:', error);
      
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
      localStorage.removeItem('current_workspace_id');
    } finally {
      // Always set loading to false, even if there was an error
      setIsLoading(false);
    }
  };

  const loadWorkspaceModules = async (workspaceId: string) => {
    try {
      const modules = await workspaceHelpers.getWorkspaceModules(workspaceId);
      setAvailableModules(modules.map((m) => m.module_name));
    } catch (error) {
      console.error('Error loading workspace modules:', error);
      setAvailableModules([]);
    }
  };

  const setCurrentWorkspace = async (workspace: Workspace | null) => {
    setCurrentWorkspaceState(workspace);
    if (workspace) {
      localStorage.setItem('current_workspace_id', workspace.id);
      await loadWorkspaceModules(workspace.id);
    } else {
      localStorage.removeItem('current_workspace_id');
      setAvailableModules([]);
    }
  };

  const refreshWorkspaces = async () => {
    await loadWorkspaces();
  };

  const hasModuleAccess = (moduleName: string): boolean => {
    if (!currentWorkspace) return false;
    // Admin workspace has access to all modules
    if (currentWorkspace.is_admin_workspace) return true;
    return availableModules.includes(moduleName);
  };

  useEffect(() => {
    loadWorkspaces();
    
    // Safety mechanism: Force loading to false after 15 seconds maximum
    // This ensures the app never gets stuck in loading state
    const safetyTimeout = setTimeout(() => {
      console.warn('Force-setting isLoading to false after 15 seconds (safety mechanism)');
      setIsLoading(false);
    }, 15000);
    
    return () => {
      clearTimeout(safetyTimeout);
    };
  }, []);

  const value: WorkspaceContextType = {
    currentWorkspace,
    workspaces,
    isLoading,
    setCurrentWorkspace,
    refreshWorkspaces,
    hasModuleAccess,
    availableModules,
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

