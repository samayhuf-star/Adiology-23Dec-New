import React, { useState } from 'react';
import { Building, ChevronDown, Check, Plus, Loader2, AlertTriangle, RefreshCw } from 'lucide-react';
import { Button } from './ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from './ui/dropdown-menu';
import { useWorkspace } from '../contexts/WorkspaceContext';
import { WorkspaceCreation } from './WorkspaceCreation';
import { type Workspace } from '../utils/workspaces';
import { Dialog, DialogContent } from './ui/dialog';

interface WorkspaceSwitcherProps {
  canSwitch?: boolean; // If false, user can't switch (for invitees)
  onCreateWorkspace?: () => void;
}

export const WorkspaceSwitcher: React.FC<WorkspaceSwitcherProps> = ({
  canSwitch = true,
  onCreateWorkspace,
}) => {
  const { 
    currentWorkspace, 
    workspaces, 
    setCurrentWorkspace, 
    refreshWorkspaces, 
    isLoading, 
    error, 
    retryInitialization, 
    clearError 
  } = useWorkspace();
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [isSwitching, setIsSwitching] = useState(false);

  const handleWorkspaceChange = async (workspace: Workspace) => {
    if (!canSwitch || isSwitching) {
      return; // Invitees can't switch workspaces or already switching
    }

    // Don't switch if already on the same workspace
    if (currentWorkspace?.id === workspace.id) {
      return;
    }

    setIsSwitching(true);
    clearError(); // Clear any previous errors
    
    try {
      // Store previous workspace for potential rollback
      const previousWorkspace = currentWorkspace;
      
      // Optimistically update UI
      // Note: We don't update the UI optimistically here to avoid confusion
      // Instead, we rely on the context to update after successful switch
      
      await setCurrentWorkspace(workspace);
      
      // Refresh workspaces to ensure we have the latest data
      await refreshWorkspaces();
      
      // Show success feedback
      console.log(`Successfully switched to workspace: ${workspace.name}`);
      
    } catch (error) {
      console.error('Error switching workspace:', error);
      
      // The error is handled by the context, but we can provide additional feedback here
      // The context will show the error in the UI
      
      // Optionally, we could try to revert to the previous workspace
      // but this might cause more confusion, so we let the user manually retry
    } finally {
      setIsSwitching(false);
    }
  };

  const handleCreateComplete = async (workspace: Workspace) => {
    try {
      await setCurrentWorkspace(workspace);
      await refreshWorkspaces();
      setShowCreateDialog(false);
      if (onCreateWorkspace) {
        onCreateWorkspace();
      }
    } catch (error) {
      console.error('Error completing workspace creation:', error);
      // Keep dialog open on error so user can retry
    }
  };

  // Show error state with retry option
  if (error && error.retryable) {
    return (
      <div className="px-3 py-2 rounded-md bg-red-50 border border-red-200">
        <div className="flex items-center gap-2 mb-2">
          <AlertTriangle className="h-4 w-4 text-red-600" />
          <span className="text-sm font-medium text-red-800">Error</span>
        </div>
        <p className="text-xs text-red-700 mb-2">{error.message}</p>
        <Button
          onClick={retryInitialization}
          size="sm"
          variant="outline"
          className="w-full text-xs"
        >
          <RefreshCw className="h-3 w-3 mr-1" />
          Retry
        </Button>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="animate-pulse">
        <div className="flex items-center gap-2 px-3 py-2 rounded-md bg-muted">
          <div className="h-4 w-4 bg-gray-300 rounded"></div>
          <div className="h-4 w-20 bg-gray-300 rounded"></div>
        </div>
      </div>
    );
  }

  // If no workspace, show create workspace option
  if (!currentWorkspace) {
    return (
      <Button
        onClick={() => setShowCreateDialog(true)}
        variant="outline"
        className="w-full justify-start"
      >
        <Plus className="h-4 w-4 mr-2" />
        Create Workspace
      </Button>
    );
  }

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            variant="outline"
            className="w-full justify-between"
            disabled={!canSwitch || isSwitching}
          >
            <div className="flex items-center gap-2">
              <Building className="h-4 w-4" />
              <span className="truncate max-w-[150px]">{currentWorkspace.name}</span>
              {currentWorkspace.is_admin_workspace && (
                <span className="text-xs px-1.5 py-0.5 rounded bg-primary/10 text-primary">
                  Admin
                </span>
              )}
            </div>
            {canSwitch && <ChevronDown className="h-4 w-4 opacity-50" />}
          </Button>
        </DropdownMenuTrigger>
        {canSwitch && (
          <DropdownMenuContent align="start" className="w-[250px]">
            <DropdownMenuLabel>Switch Workspace</DropdownMenuLabel>
            <DropdownMenuSeparator />
            {workspaces.map((workspace) => (
              <DropdownMenuItem
                key={workspace.id}
                onClick={() => handleWorkspaceChange(workspace)}
                className="flex items-center justify-between cursor-pointer"
              >
                <div className="flex items-center gap-2 flex-1 min-w-0">
                  <Building className="h-4 w-4 flex-shrink-0" />
                  <span className="truncate">{workspace.name}</span>
                  {workspace.is_admin_workspace && (
                    <span className="text-xs px-1.5 py-0.5 rounded bg-primary/10 text-primary flex-shrink-0">
                      Admin
                    </span>
                  )}
                </div>
                {currentWorkspace.id === workspace.id && (
                  <Check className="h-4 w-4 ml-2 flex-shrink-0" />
                )}
              </DropdownMenuItem>
            ))}
            <DropdownMenuSeparator />
            <DropdownMenuItem
              onClick={() => setShowCreateDialog(true)}
              className="cursor-pointer"
            >
              <Plus className="h-4 w-4 mr-2" />
              Create New Workspace
            </DropdownMenuItem>
          </DropdownMenuContent>
        )}
      </DropdownMenu>

      <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <WorkspaceCreation
            onComplete={handleCreateComplete}
            onSkip={() => setShowCreateDialog(false)}
          />
        </DialogContent>
      </Dialog>
    </>
  );
};

