import React from 'react';
import { Building, Plus } from 'lucide-react';
import { Button } from './ui/button';
import { WorkspaceCards } from './WorkspaceCards';
import { WorkspaceCreation } from './WorkspaceCreation';
import { useWorkspace } from '../contexts/WorkspaceContext';
import { type Workspace } from '../utils/workspaces';
import { Dialog, DialogContent } from './ui/dialog';

export const WorkspacesPage: React.FC = () => {
  const { setCurrentWorkspace, refreshWorkspaces } = useWorkspace();
  const [showCreateDialog, setShowCreateDialog] = React.useState(false);

  const handleSelectWorkspace = async (workspace: Workspace) => {
    try {
      await setCurrentWorkspace(workspace);
      await refreshWorkspaces();
    } catch (error) {
      console.error('Error selecting workspace:', error);
    }
  };

  const handleCreateWorkspace = () => {
    setShowCreateDialog(true);
  };

  const handleCreateComplete = async (workspace: Workspace) => {
    await setCurrentWorkspace(workspace);
    await refreshWorkspaces();
    setShowCreateDialog(false);
  };

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
        <WorkspaceCards
          onSelectWorkspace={handleSelectWorkspace}
          onCreateWorkspace={handleCreateWorkspace}
        />

        {/* Create Workspace Dialog */}
        <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
          <DialogContent className="max-w-2xl">
            <WorkspaceCreation
              onComplete={handleCreateComplete}
              onCancel={() => setShowCreateDialog(false)}
            />
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
};