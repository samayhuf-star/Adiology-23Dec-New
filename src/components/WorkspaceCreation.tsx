import React, { useState } from 'react';
import { Building2, Check, ArrowRight, ArrowLeft, Loader2 } from 'lucide-react';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from './ui/card';
import { Alert, AlertDescription } from './ui/alert';
import { Checkbox } from './ui/checkbox';
import { workspaceHelpers, type Workspace } from '../utils/workspaces';
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
  const [inviteEmails, setInviteEmails] = useState<string[]>([]);
  const [inviteEmailInput, setInviteEmailInput] = useState('');
  const [selectedModules, setSelectedModules] = useState<string[]>(DEFAULT_MODULES);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

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

      // Update modules (already set with defaults, but update to match selection)
      await workspaceHelpers.updateWorkspaceModules(workspace.id, selectedModules);

      // Invite users by email
      let successfulInvites: string[] = [];
      let failedInvites: Array<{ email: string; reason: string }> = [];

      if (inviteEmails.length > 0) {
        const inviteResults = await Promise.allSettled(
          inviteEmails.map((email) =>
            workspaceHelpers.inviteMember({
              workspace_id: workspace.id,
              user_email: email.trim(),
              role: 'member',
            })
          )
        );

        inviteResults.forEach((result, index) => {
          const email = inviteEmails[index];
          if (result.status === 'fulfilled') {
            successfulInvites.push(email);
          } else {
            const error = result.reason;
            let reason = 'Unknown error';
            if (error?.message) {
              if (error.message.includes('not found')) {
                reason = 'User not found - they need to sign up first';
              } else if (error.message.includes('already a member')) {
                reason = 'Already a member of this workspace';
              } else {
                reason = error.message;
              }
            }
            failedInvites.push({ email, reason });
            console.error(`Error inviting user ${email}:`, error);
          }
        });
      }

      // Show contextual success notification based on invitation results
      if (inviteEmails.length === 0) {
        // No invitations attempted
        notifications.success('Workspace created successfully!', {
          title: 'Success',
          description: `Your workspace "${workspace.name}" has been created.`,
        });
      } else if (failedInvites.length > 0 && successfulInvites.length === 0) {
        // All invites failed
        notifications.warning('Workspace created, but no invitations were sent', {
          title: 'Invitation Issues',
          description: `Your workspace "${workspace.name}" was created, but all invitations failed. ${failedInvites.map((f) => `${f.email}: ${f.reason}`).join('; ')}`,
        });
      } else if (failedInvites.length > 0) {
        // Some invites failed
        notifications.warning(
          `Workspace created with partial invitation success`,
          {
            title: 'Partial Success',
            description: `Your workspace "${workspace.name}" was created. ${successfulInvites.length} invitation(s) sent successfully, but ${failedInvites.length} failed: ${failedInvites.map((f) => `${f.email}: ${f.reason}`).join('; ')}`,
          }
        );
      } else {
        // All invites succeeded
        notifications.success('Workspace created and all invitations sent!', {
          title: 'Success',
          description: `Your workspace "${workspace.name}" has been created and ${successfulInvites.length} team member(s) have been invited successfully.`,
        });
      }

      onComplete(workspace);
    } catch (err: any) {
      console.error('Error creating workspace:', err);
      setError(err.message || 'Failed to create workspace. Please try again.');
      setIsLoading(false);
    }
  };

  const handleAddInviteEmail = () => {
    const email = inviteEmailInput.trim().toLowerCase();
    
    if (!email) {
      setError('Please enter an email address');
      return;
    }

    if (!email.includes('@') || !email.includes('.')) {
      setError('Please enter a valid email address');
      return;
    }

    if (inviteEmails.includes(email)) {
      setError('This email is already in the invite list');
      return;
    }

    setInviteEmails((prev) => [...prev, email]);
    setInviteEmailInput('');
    setError('');
  };

  const handleRemoveInviteEmail = (email: string) => {
    setInviteEmails((prev) => prev.filter((e) => e !== email));
  };

  const toggleModuleSelection = (moduleId: string) => {
    setSelectedModules((prev) =>
      prev.includes(moduleId) ? prev.filter((id) => id !== moduleId) : [...prev, moduleId]
    );
  };

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
                <Label>Invite Team Members by Email</Label>
                <div className="flex gap-2">
                  <Input
                    placeholder="Enter email address..."
                    value={inviteEmailInput}
                    onChange={(e) => {
                      setInviteEmailInput(e.target.value);
                      setError('');
                    }}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        handleAddInviteEmail();
                      }
                    }}
                  />
                  <Button type="button" onClick={handleAddInviteEmail} variant="outline">
                    Add
                  </Button>
                </div>
                {error && (
                  <p className="text-sm text-destructive">{error}</p>
                )}
                <p className="text-sm text-muted-foreground">
                  Enter email addresses of team members you want to invite to this workspace. 
                  <span className="block mt-1 text-xs">
                    Note: Users must have an account in the system. If they don't have an account yet, they'll need to sign up first.
                  </span>
                </p>
              </div>
              {inviteEmails.length > 0 && (
                <div className="border rounded-lg p-4 max-h-64 overflow-y-auto">
                  <div className="space-y-2">
                    {inviteEmails.map((email) => (
                      <div
                        key={email}
                        className="flex items-center justify-between p-2 rounded hover:bg-muted"
                      >
                        <div className="flex items-center gap-2">
                          <Checkbox checked={true} disabled />
                          <p className="text-sm font-medium">{email}</p>
                        </div>
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => handleRemoveInviteEmail(email)}
                          className="text-destructive hover:text-destructive"
                        >
                          Remove
                        </Button>
                      </div>
                    ))}
                  </div>
                </div>
              )}
              {inviteEmails.length === 0 && (
                <div className="border rounded-lg p-4 text-center">
                  <p className="text-sm text-muted-foreground">
                    No team members added yet. You can skip this step and invite members later.
                  </p>
                </div>
              )}
              {inviteEmails.length > 0 && (
                <div className="text-sm text-muted-foreground">
                  {inviteEmails.length} team member{inviteEmails.length !== 1 ? 's' : ''} will be invited
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

