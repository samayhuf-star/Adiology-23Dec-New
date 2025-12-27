/**
 * Workspace persistence utilities for managing workspace state across sessions
 */

export interface WorkspaceSession {
  workspaceId: string;
  workspaceName: string;
  lastAccessed: string;
  modules: string[];
}

const WORKSPACE_SESSION_KEY = 'workspace_session';
const WORKSPACE_HISTORY_KEY = 'workspace_history';
const MAX_HISTORY_ITEMS = 5;

export const workspacePersistence = {
  /**
   * Save current workspace session
   */
  saveWorkspaceSession(workspace: { id: string; name: string }, modules: string[] = []): void {
    try {
      const session: WorkspaceSession = {
        workspaceId: workspace.id,
        workspaceName: workspace.name,
        lastAccessed: new Date().toISOString(),
        modules,
      };
      
      localStorage.setItem(WORKSPACE_SESSION_KEY, JSON.stringify(session));
      localStorage.setItem('current_workspace_id', workspace.id);
      
      // Add to history
      this.addToHistory(session);
      
      console.log(`Workspace session saved: ${workspace.name}`);
    } catch (error) {
      console.error('Error saving workspace session:', error);
    }
  },

  /**
   * Get saved workspace session
   */
  getWorkspaceSession(): WorkspaceSession | null {
    try {
      const sessionData = localStorage.getItem(WORKSPACE_SESSION_KEY);
      if (!sessionData) return null;
      
      const session = JSON.parse(sessionData) as WorkspaceSession;
      
      // Validate session data
      if (!session.workspaceId || !session.workspaceName) {
        console.warn('Invalid workspace session data, clearing...');
        this.clearWorkspaceSession();
        return null;
      }
      
      return session;
    } catch (error) {
      console.error('Error getting workspace session:', error);
      this.clearWorkspaceSession();
      return null;
    }
  },

  /**
   * Clear workspace session
   */
  clearWorkspaceSession(): void {
    try {
      localStorage.removeItem(WORKSPACE_SESSION_KEY);
      localStorage.removeItem('current_workspace_id');
      console.log('Workspace session cleared');
    } catch (error) {
      console.error('Error clearing workspace session:', error);
    }
  },

  /**
   * Add workspace to history
   */
  addToHistory(session: WorkspaceSession): void {
    try {
      const historyData = localStorage.getItem(WORKSPACE_HISTORY_KEY);
      let history: WorkspaceSession[] = historyData ? JSON.parse(historyData) : [];
      
      // Remove existing entry for this workspace
      history = history.filter(item => item.workspaceId !== session.workspaceId);
      
      // Add to beginning of history
      history.unshift(session);
      
      // Limit history size
      if (history.length > MAX_HISTORY_ITEMS) {
        history = history.slice(0, MAX_HISTORY_ITEMS);
      }
      
      localStorage.setItem(WORKSPACE_HISTORY_KEY, JSON.stringify(history));
    } catch (error) {
      console.error('Error adding to workspace history:', error);
    }
  },

  /**
   * Get workspace history
   */
  getWorkspaceHistory(): WorkspaceSession[] {
    try {
      const historyData = localStorage.getItem(WORKSPACE_HISTORY_KEY);
      return historyData ? JSON.parse(historyData) : [];
    } catch (error) {
      console.error('Error getting workspace history:', error);
      return [];
    }
  },

  /**
   * Clear workspace-specific data
   */
  clearWorkspaceData(workspaceId: string): void {
    try {
      // Find and remove all workspace-specific keys
      const keysToRemove: string[] = [];
      
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key && key.startsWith(`workspace_${workspaceId}_`)) {
          keysToRemove.push(key);
        }
      }
      
      keysToRemove.forEach(key => {
        localStorage.removeItem(key);
      });
      
      console.log(`Cleared ${keysToRemove.length} workspace-specific items for workspace ${workspaceId}`);
    } catch (error) {
      console.error('Error clearing workspace data:', error);
    }
  },

  /**
   * Validate workspace session against available workspaces
   */
  validateSession(availableWorkspaces: { id: string; name: string }[]): WorkspaceSession | null {
    const session = this.getWorkspaceSession();
    if (!session) return null;
    
    // Check if the workspace still exists
    const workspaceExists = availableWorkspaces.some(w => w.id === session.workspaceId);
    
    if (!workspaceExists) {
      console.warn(`Workspace ${session.workspaceName} no longer exists, clearing session`);
      this.clearWorkspaceSession();
      return null;
    }
    
    return session;
  },

  /**
   * Migrate old workspace data format if needed
   */
  migrateOldData(): void {
    try {
      // Check for old format workspace ID
      const oldWorkspaceId = localStorage.getItem('current_workspace_id');
      if (oldWorkspaceId && !localStorage.getItem(WORKSPACE_SESSION_KEY)) {
        // Create a basic session from old data
        const session: WorkspaceSession = {
          workspaceId: oldWorkspaceId,
          workspaceName: 'Unknown Workspace',
          lastAccessed: new Date().toISOString(),
          modules: [],
        };
        
        localStorage.setItem(WORKSPACE_SESSION_KEY, JSON.stringify(session));
        console.log('Migrated old workspace data to new format');
      }
    } catch (error) {
      console.error('Error migrating old workspace data:', error);
    }
  }
};