import React from 'react';
import { Building, Plus, AlertTriangle, RefreshCw } from 'lucide-react';
import { Button } from './ui/button';
import { Alert, AlertDescription } from './ui/alert';
import { WorkspaceCards } from './WorkspaceCards';
import { WorkspaceCreation } from './WorkspaceCreation';
import { WorkspaceErrorBoundary } from './WorkspaceErrorBoundary';
import { WorkspacePerformanceMonitor } from './workspace-performance-monitor';
import { useWorkspace } from '../contexts/WorkspaceContext';
import { type Workspace } from '../utils/workspaces';
import { Dialog, DialogContent } from './ui/dialog';

export const WorkspacesPage: React.FC = () => {
  const { 
    setCurrentWorkspace, 
    refreshWorkspaces, 
    isLoading, 
    error, 
    retryInitialization, 
    clearError,
    workspaces 
  } = useWorkspace();
  const [showCreateDialog, setShowCreateDialog] = React.useState(false);
  const [isSelecting, setIsSelecting] = React.useState(false);

  const handleSelectWorkspace = async (workspace: Workspace) => {
    if (isSelecting) return; // Prevent multiple selections
    
    setIsSelecting(true);
    clearError();
    
    try {
      await setCurrentWorkspace(workspace);
      await refreshWorkspaces();
      console.log(`Selected workspace: ${workspace.name}`);
    } catch (error) {
      console.error('Error selecting workspace:', error);
      // Error is handled by the context
    } finally {
      setIsSelecting(false);
    }
  };

  const handleCreateWorkspace = () => {
    setShowCreateDialog(true);
  };

  const handleCreateComplete = async (workspace: Workspace) => {
    try {
      await setCurrentWorkspace(workspace);
      await refreshWorkspaces();
      setShowCreateDialog(false);
      console.log(`Created and selected workspace: ${workspace.name}`);
    } catch (error) {
      console.error('Error completing workspace creation:', error);
      // Keep dialog open on error so user can retry
    }
  };

  // Show error state with retry option
  if (error && error.retryable) {
    return (
      <div className="flex-1 overflow-auto">
        <div className="max-w-6xl mx-auto p-6">
          <div className="flex items-center justify-center min-h-[400px]">
            <div className="text-center max-w-md">
              <div className="p-4 bg-red-50 rounded-lg border border-red-200 mb-4">
                <AlertTriangle className="w-8 h-8 text-red-600 mx-auto mb-2" />
                <h3 className="text-lg font-semibold text-red-800 mb-2">Error Loading Workspaces</h3>
                <p className="text-red-700 mb-4">{error.message}</p>
                <Button
                  onClick={retryInitialization}
                  variant="outline"
                  className="flex items-center gap-2"
                >
                  <RefreshCw className="w-4 h-4" />
                  Retry
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Show loading state
  if (isLoading) {
    return (
      <div className="flex-1 overflow-auto">
        <div className="max-w-6xl mx-auto p-6">
          {/* Header Skeleton */}
          <div className="flex items-center justify-between mb-8">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-gray-200 rounded-lg animate-pulse">
                <div className="w-6 h-6 bg-gray-300 rounded"></div>
              </div>
              <div>
                <div className="h-8 w-32 bg-gray-300 rounded animate-pulse mb-2"></div>
                <div className="h-4 w-48 bg-gray-200 rounded animate-pulse"></div>
              </div>
            </div>
            <div className="h-10 w-32 bg-gray-300 rounded animate-pulse"></div>
          </div>
          
          {/* Cards Skeleton */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3].map((i) => (
              <div key={i} className="p-6 bg-white rounded-lg border border-gray-200 animate-pulse">
                <div className="h-6 w-3/4 bg-gray-300 rounded mb-2"></div>
                <div className="h-4 w-full bg-gray-200 rounded mb-4"></div>
                <div className="h-8 w-24 bg-gray-300 rounded"></div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 overflow-auto">
      <div className="max-w-6xl mx-auto p-6">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-100 rounded-lg">
              <Building className="w-6 h-6 text-blue-600" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-slate-900">Workspaces</h1>
              <p className="text-slate-600">Manage and switch between your workspaces</p>
            </div>
          </div>
          <Button
            onClick={handleCreateWorkspace}
            className="flex items-center gap-2"
          >
            <Plus className="w-4 h-4" />
            Create Workspace
          </Button>
        </div>

        {/* Workspaces Grid */}
        <WorkspaceErrorBoundary>
          <WorkspaceCards
            onSelectWorkspace={handleSelectWorkspace}
            onCreateWorkspace={handleCreateWorkspace}
            isSelecting={isSelecting}
          />
        </WorkspaceErrorBoundary>

        {/* Show message if no workspaces */}
        {!isLoading && workspaces.length === 0 && (
          <div className="text-center py-12">
            <Building className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">No Workspaces Found</h3>
            <p className="text-gray-600 mb-4">Get started by creating your first workspace.</p>
            <Button onClick={handleCreateWorkspace} className="flex items-center gap-2">
              <Plus className="w-4 h-4" />
              Create Your First Workspace
            </Button>
          </div>
        )}

        {/* Create Workspace Dialog */}
        <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
          <DialogContent className="max-w-2xl">
            <WorkspaceErrorBoundary>
              <WorkspaceCreation
                onComplete={handleCreateComplete}
                onCancel={() => setShowCreateDialog(false)}
              />
            </WorkspaceErrorBoundary>
          </DialogContent>
        </Dialog>

        {/* Performance Monitor */}
        <WorkspacePerformanceMonitor />
      </div>
    </div>
  );
};