import React, { useState } from 'react';
import { Building2, ChevronDown, Check, Plus, Loader2 } from 'lucide-react';
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
  const { currentWorkspace, workspaces, setCurrentWorkspace, refreshWorkspaces, isLoading } = useWorkspace();
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [isSwitching, setIsSwitching] = useState(false);

  const handleWorkspaceChange = async (workspace: Workspace) => {
    if (!canSwitch) {
      return; // Invitees can't switch workspaces
    }

    setIsSwitching(true);
    try {
      await setCurrentWorkspace(workspace);
      await refreshWorkspaces();
    } catch (error) {
      console.error('Error switching workspace:', error);
    } finally {
      setIsSwitching(false);
    }
  };

  const handleCreateComplete = async (workspace: Workspace) => {
    await setCurrentWorkspace(workspace);
    await refreshWorkspaces();
    setShowCreateDialog(false);
    if (onCreateWorkspace) {
      onCreateWorkspace();
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center gap-2 px-3 py-2 rounded-md bg-muted">
        <Loader2 className="h-4 w-4 animate-spin" />
        <span className="text-sm">Loading...</span>
      </div>
    );
  }

  if (!currentWorkspace) {
    return null;
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
              <Building2 className="h-4 w-4" />
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
                  <Building2 className="h-4 w-4 flex-shrink-0" />
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

