import React, { useState, useEffect } from 'react';
import { Building2, Users, Layout, Check, ArrowRight, ArrowLeft, Loader2 } from 'lucide-react';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from './ui/card';
import { Alert, AlertDescription } from './ui/alert';
import { Checkbox } from './ui/checkbox';
import { workspaceHelpers, type Workspace } from '../utils/workspaces';
import { getCurrentAuthUser } from '../utils/auth';
import { supabase } from '../utils/supabase/client';
import { notifications } from '../utils/notifications';

interface WorkspaceCreationProps {
  onComplete: (workspace: Workspace) => void;
  onSkip?: () => void;
}

type Step = 'name' | 'members' | 'modules';

const AVAILABLE_MODULES = [
  { id: 'dashboard', name: 'Dashboard', description: 'Overview and analytics' },
  { id: 'campaign-wizard', name: 'Campaign Wizard', description: 'Create Google Ads campaigns' },
  { id: 'one-click-builder', name: 'One-Click Builder', description: 'Quick campaign creation' },
  { id: 'keywords', name: 'Keywords', description: 'Keyword research and management' },
  { id: 'settings', name: 'Settings', description: 'Workspace settings' },
  { id: 'support', name: 'Support', description: 'Customer support' },
  { id: 'help', name: 'Help', description: 'Help center' },
  { id: 'ticket', name: 'Tickets', description: 'Support tickets' },
  { id: 'billing', name: 'Billing', description: 'Billing and subscriptions' },
  { id: 'analytics', name: 'Analytics', description: 'Analytics and reports' },
  { id: 'templates', name: 'Templates', description: 'Campaign templates' },
  { id: 'websites', name: 'Websites', description: 'Website management' },
];

const DEFAULT_MODULES = ['dashboard', 'settings', 'support', 'help', 'ticket'];

export const WorkspaceCreation: React.FC<WorkspaceCreationProps> = ({ onComplete, onSkip }) => {
  const [currentStep, setCurrentStep] = useState<Step>('name');
  const [workspaceName, setWorkspaceName] = useState('');
  const [workspaceDescription, setWorkspaceDescription] = useState('');
  const [selectedUsers, setSelectedUsers] = useState<string[]>([]);
  const [selectedModules, setSelectedModules] = useState<string[]>(DEFAULT_MODULES);
  const [availableUsers, setAvailableUsers] = useState<Array<{ id: string; email: string; full_name: string }>>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [searchEmail, setSearchEmail] = useState('');

  // Load available users (excluding current user)
  useEffect(() => {
    loadAvailableUsers();
  }, []);

  const loadAvailableUsers = async () => {
    try {
      const user = await getCurrentAuthUser();
      if (!user) return;

      const { data, error } = await supabase
        .from('users')
        .select('id, email, full_name')
        .neq('id', user.id)
        .order('email');

      if (error) {
        console.error('Error loading users:', error);
        return;
      }

      setAvailableUsers(data || []);
    } catch (error) {
      console.error('Error in loadAvailableUsers:', error);
    }
  };

  const handleStep1Submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!workspaceName.trim()) {
      setError('Please enter a workspace name');
      return;
    }
    setError('');
    setCurrentStep('members');
  };

  const handleStep2Next = () => {
    setCurrentStep('modules');
  };

  const handleStep2Back = () => {
    setCurrentStep('name');
  };

  const handleStep3Back = () => {
    setCurrentStep('members');
  };

  const handleComplete = async () => {
    setIsLoading(true);
    setError('');

    try {
      // Create workspace
      const workspace = await workspaceHelpers.createWorkspace({
        name: workspaceName.trim(),
        description: workspaceDescription.trim() || undefined,
      });

      // Invite selected users
      if (selectedUsers.length > 0) {
        const invitePromises = selectedUsers.map((userId) => {
          const user = availableUsers.find((u) => u.id === userId);
          if (user) {
            return workspaceHelpers.inviteMember({
              workspace_id: workspace.id,
              user_email: user.email,
              role: 'member',
            }).catch((err) => {
              console.error(`Error inviting user ${user.email}:`, err);
              return null;
            });
          }
          return Promise.resolve(null);
        });

        await Promise.all(invitePromises);
      }

      // Update modules (already set with defaults, but update to match selection)
      await workspaceHelpers.updateWorkspaceModules(workspace.id, selectedModules);

      notifications.success('Workspace created successfully!', {
        title: 'Success',
        description: `Your workspace "${workspace.name}" has been created.`,
      });

      onComplete(workspace);
    } catch (err: any) {
      console.error('Error creating workspace:', err);
      setError(err.message || 'Failed to create workspace. Please try again.');
      setIsLoading(false);
    }
  };

  const toggleUserSelection = (userId: string) => {
    setSelectedUsers((prev) =>
      prev.includes(userId) ? prev.filter((id) => id !== userId) : [...prev, userId]
    );
  };

  const toggleModuleSelection = (moduleId: string) => {
    setSelectedModules((prev) =>
      prev.includes(moduleId) ? prev.filter((id) => id !== moduleId) : [...prev, moduleId]
    );
  };

  const filteredUsers = availableUsers.filter((user) =>
    user.email.toLowerCase().includes(searchEmail.toLowerCase()) ||
    user.full_name?.toLowerCase().includes(searchEmail.toLowerCase())
  );

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-800 via-indigo-800 to-purple-800 p-4">
      <Card className="w-full max-w-2xl">
        <CardHeader>
          <CardTitle className="text-2xl font-bold flex items-center gap-2">
            <Building2 className="h-6 w-6" />
            Create Your Workspace
          </CardTitle>
          <CardDescription>
            {currentStep === 'name' && 'Give your workspace a name to get started'}
            {currentStep === 'members' && 'Invite team members to collaborate'}
            {currentStep === 'modules' && 'Select which modules to enable for this workspace'}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {/* Progress Indicator */}
          <div className="flex items-center justify-center mb-6">
            <div className="flex items-center gap-2">
              <div className={`flex items-center gap-2 ${currentStep === 'name' ? 'text-primary' : 'text-muted-foreground'}`}>
                <div className={`w-8 h-8 rounded-full flex items-center justify-center ${currentStep === 'name' ? 'bg-primary text-primary-foreground' : 'bg-muted'}`}>
                  {currentStep !== 'name' ? <Check className="h-4 w-4" /> : '1'}
                </div>
                <span className="hidden sm:inline">Name</span>
              </div>
              <ArrowRight className="h-4 w-4 text-muted-foreground" />
              <div className={`flex items-center gap-2 ${currentStep === 'members' ? 'text-primary' : currentStep === 'modules' ? 'text-muted-foreground' : 'text-muted-foreground'}`}>
                <div className={`w-8 h-8 rounded-full flex items-center justify-center ${currentStep === 'members' ? 'bg-primary text-primary-foreground' : currentStep === 'modules' ? 'bg-muted' : 'bg-muted'}`}>
                  {currentStep === 'modules' ? <Check className="h-4 w-4" /> : '2'}
                </div>
                <span className="hidden sm:inline">Members</span>
              </div>
              <ArrowRight className="h-4 w-4 text-muted-foreground" />
              <div className={`flex items-center gap-2 ${currentStep === 'modules' ? 'text-primary' : 'text-muted-foreground'}`}>
                <div className={`w-8 h-8 rounded-full flex items-center justify-center ${currentStep === 'modules' ? 'bg-primary text-primary-foreground' : 'bg-muted'}`}>
                  3
                </div>
                <span className="hidden sm:inline">Modules</span>
              </div>
            </div>
          </div>

          {error && (
            <Alert variant="destructive" className="mb-4">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {/* Step 1: Name Workspace */}
          {currentStep === 'name' && (
            <form onSubmit={handleStep1Submit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="workspace-name">Workspace Name *</Label>
                <Input
                  id="workspace-name"
                  placeholder="e.g., Marketing Team"
                  value={workspaceName}
                  onChange={(e) => setWorkspaceName(e.target.value)}
                  required
                  autoFocus
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="workspace-description">Description (Optional)</Label>
                <Input
                  id="workspace-description"
                  placeholder="Brief description of your workspace"
                  value={workspaceDescription}
                  onChange={(e) => setWorkspaceDescription(e.target.value)}
                />
              </div>
              <div className="flex gap-2 justify-end">
                {onSkip && (
                  <Button type="button" variant="outline" onClick={onSkip}>
                    Skip for Now
                  </Button>
                )}
                <Button type="submit">
                  Next <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </div>
            </form>
          )}

          {/* Step 2: Invite Members */}
          {currentStep === 'members' && (
            <div className="space-y-4">
              <div className="space-y-2">
                <Label>Search Users</Label>
                <Input
                  placeholder="Search by email or name..."
                  value={searchEmail}
                  onChange={(e) => setSearchEmail(e.target.value)}
                />
              </div>
              <div className="border rounded-lg p-4 max-h-64 overflow-y-auto">
                {filteredUsers.length === 0 ? (
                  <p className="text-sm text-muted-foreground text-center py-4">
                    {searchEmail ? 'No users found' : 'No other users available'}
                  </p>
                ) : (
                  <div className="space-y-2">
                    {filteredUsers.map((user) => (
                      <div
                        key={user.id}
                        className="flex items-center gap-3 p-2 rounded hover:bg-muted cursor-pointer"
                        onClick={() => toggleUserSelection(user.id)}
                      >
                        <Checkbox
                          checked={selectedUsers.includes(user.id)}
                          onCheckedChange={() => toggleUserSelection(user.id)}
                        />
                        <div className="flex-1">
                          <p className="font-medium">{user.full_name || 'No name'}</p>
                          <p className="text-sm text-muted-foreground">{user.email}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
              {selectedUsers.length > 0 && (
                <div className="text-sm text-muted-foreground">
                  {selectedUsers.length} user{selectedUsers.length !== 1 ? 's' : ''} selected
                </div>
              )}
              <div className="flex gap-2 justify-end">
                <Button type="button" variant="outline" onClick={handleStep2Back}>
                  <ArrowLeft className="mr-2 h-4 w-4" /> Back
                </Button>
                <Button type="button" onClick={handleStep2Next}>
                  Next <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </div>
            </div>
          )}

          {/* Step 3: Select Modules */}
          {currentStep === 'modules' && (
            <div className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-h-96 overflow-y-auto p-2">
                {AVAILABLE_MODULES.map((module) => (
                  <div
                    key={module.id}
                    className={`flex items-start gap-3 p-3 rounded-lg border cursor-pointer transition-colors ${
                      selectedModules.includes(module.id)
                        ? 'border-primary bg-primary/5'
                        : 'border-border hover:bg-muted/50'
                    }`}
                    onClick={() => toggleModuleSelection(module.id)}
                  >
                    <Checkbox
                      checked={selectedModules.includes(module.id)}
                      onCheckedChange={() => toggleModuleSelection(module.id)}
                    />
                    <div className="flex-1">
                      <p className="font-medium">{module.name}</p>
                      <p className="text-sm text-muted-foreground">{module.description}</p>
                    </div>
                  </div>
                ))}
              </div>
              <div className="text-sm text-muted-foreground">
                {selectedModules.length} module{selectedModules.length !== 1 ? 's' : ''} selected
              </div>
              <div className="flex gap-2 justify-end">
                <Button type="button" variant="outline" onClick={handleStep3Back} disabled={isLoading}>
                  <ArrowLeft className="mr-2 h-4 w-4" /> Back
                </Button>
                <Button type="button" onClick={handleComplete} disabled={isLoading || selectedModules.length === 0}>
                  {isLoading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Creating...
                    </>
                  ) : (
                    <>
                      Create Workspace <Check className="ml-2 h-4 w-4" />
                    </>
                  )}
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

