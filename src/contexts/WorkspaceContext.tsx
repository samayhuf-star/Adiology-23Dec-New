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
      const userWorkspaces = await workspaceHelpers.getUserWorkspaces();
      setWorkspaces(userWorkspaces);

      // Load current workspace from localStorage or set default
      const savedWorkspaceId = localStorage.getItem('current_workspace_id');
      if (savedWorkspaceId) {
        const saved = userWorkspaces.find((w) => w.id === savedWorkspaceId);
        if (saved) {
          setCurrentWorkspaceState(saved);
          await loadWorkspaceModules(saved.id);
          return;
        }
      }

      // Set first workspace as default (prefer admin workspace)
      if (userWorkspaces.length > 0) {
        const adminWorkspace = userWorkspaces.find((w) => w.is_admin_workspace);
        const defaultWorkspace = adminWorkspace || userWorkspaces[0];
        setCurrentWorkspaceState(defaultWorkspace);
        localStorage.setItem('current_workspace_id', defaultWorkspace.id);
        await loadWorkspaceModules(defaultWorkspace.id);
      }
    } catch (error) {
      console.error('Error loading workspaces:', error);
    } finally {
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

