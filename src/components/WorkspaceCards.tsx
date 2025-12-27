import React, { useState, useEffect, useMemo } from 'react';
import { Building, Users, Plus, Mail, Loader2, ArrowRight, X, ChevronLeft, ChevronRight, Search } from 'lucide-react';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from './ui/card';
import { Alert, AlertDescription } from './ui/alert';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from './ui/dialog';
import { useWorkspace } from '../contexts/WorkspaceContext';
import { workspaceHelpers, type Workspace } from '../utils/workspaces';
import { notifications } from '../utils/notifications';

interface WorkspaceCardsProps {
  onSelectWorkspace: (workspace: Workspace) => void;
  onCreateWorkspace?: () => void;
  isSelecting?: boolean;
}

// Performance constants
const WORKSPACES_PER_PAGE = 12;
const SEARCH_DEBOUNCE_MS = 300;

export const WorkspaceCards: React.FC<WorkspaceCardsProps> = ({ onSelectWorkspace, onCreateWorkspace, isSelecting = false }) => {
  const { workspaces, refreshWorkspaces, isLoading } = useWorkspace();
  const [selectedWorkspace, setSelectedWorkspace] = useState<Workspace | null>(null);
  const [showInviteDialog, setShowInviteDialog] = useState(false);
  const [inviteEmails, setInviteEmails] = useState<string[]>([]);
  const [inviteEmailInput, setInviteEmailInput] = useState('');
  const [isInviting, setIsInviting] = useState(false);
  const [error, setError] = useState('');
  const [loadingTimeout, setLoadingTimeout] = useState(false);
  
  // Pagination and search state
  const [currentPage, setCurrentPage] = useState(1);
  const [searchQuery, setSearchQuery] = useState('');
  const [debouncedSearchQuery, setDebouncedSearchQuery] = useState('');

  // Debounce search query
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearchQuery(searchQuery);
      setCurrentPage(1); // Reset to first page when searching
    }, SEARCH_DEBOUNCE_MS);

    return () => clearTimeout(timer);
  }, [searchQuery]);

  // Filtered and paginated workspaces
  const { filteredWorkspaces, totalPages, currentPageWorkspaces } = useMemo(() => {
    // Filter workspaces based on search query
    const filtered = workspaces.filter(workspace => 
      workspace.name.toLowerCase().includes(debouncedSearchQuery.toLowerCase()) ||
      (workspace.description && workspace.description.toLowerCase().includes(debouncedSearchQuery.toLowerCase()))
    );

    // Calculate pagination
    const total = Math.ceil(filtered.length / WORKSPACES_PER_PAGE);
    const startIndex = (currentPage - 1) * WORKSPACES_PER_PAGE;
    const endIndex = startIndex + WORKSPACES_PER_PAGE;
    const paginated = filtered.slice(startIndex, endIndex);

    return {
      filteredWorkspaces: filtered,
      totalPages: total,
      currentPageWorkspaces: paginated
    };
  }, [workspaces, debouncedSearchQuery, currentPage]);

  useEffect(() => {
    // Refresh workspaces when component mounts
    refreshWorkspaces().catch((error) => {
      console.error('Error refreshing workspaces in WorkspaceCards:', error);
      // Don't block the UI - let it show empty state if needed
    });
  }, [refreshWorkspaces]);

  const handleWorkspaceClick = (workspace: Workspace) => {
    onSelectWorkspace(workspace);
  };

  const handleInviteClick = (e: React.MouseEvent, workspace: Workspace) => {
    e.stopPropagation();
    setSelectedWorkspace(workspace);
    setShowInviteDialog(true);
    setInviteEmails([]);
    setInviteEmailInput('');
    setError('');
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

  const handleSendInvites = async () => {
    if (!selectedWorkspace || inviteEmails.length === 0) {
      setError('Please add at least one email address');
      return;
    }

    setIsInviting(true);
    setError('');

    try {
      const inviteResults = await Promise.allSettled(
        inviteEmails.map((email) =>
          workspaceHelpers.inviteMember({
            workspace_id: selectedWorkspace.id,
            user_email: email.trim(),
            role: 'member',
          })
        )
      );

      const successfulInvites: string[] = [];
      const failedInvites: Array<{ email: string; reason: string }> = [];

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

      // Show notification about invite results
      if (failedInvites.length > 0 && successfulInvites.length === 0) {
        // All invites failed
        notifications.warning('No invitations were sent', {
          title: 'Invitation Issues',
          description: failedInvites.map((f) => `${f.email}: ${f.reason}`).join(', '),
        });
      } else if (failedInvites.length > 0) {
        // Some invites failed
        notifications.warning(
          `${successfulInvites.length} invitation(s) sent, ${failedInvites.length} failed`,
          {
            title: 'Partial Success',
            description: failedInvites.map((f) => `${f.email}: ${f.reason}`).join(', '),
          }
        );
      } else if (successfulInvites.length > 0) {
        // All invites succeeded
        notifications.success(`${successfulInvites.length} team member(s) invited successfully`, {
          title: 'Invitations Sent',
        });
      }

      // Refresh workspaces to update member counts
      await refreshWorkspaces();

      // Close dialog and reset
      setShowInviteDialog(false);
      setInviteEmails([]);
      setInviteEmailInput('');
      setSelectedWorkspace(null);
    } catch (err: any) {
      console.error('Error sending invites:', err);
      setError(err.message || 'Failed to send invitations. Please try again.');
    } finally {
      setIsInviting(false);
    }
  };

  useEffect(() => {
    if (isLoading) {
      const timeout = setTimeout(() => {
        setLoadingTimeout(true);
        console.warn('Workspace loading taking too long, showing empty state');
      }, 8000); // 8 second timeout
      
      return () => clearTimeout(timeout);
    } else {
      setLoadingTimeout(false);
    }
  }, [isLoading]);

  if (isLoading && !loadingTimeout) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-800 via-indigo-800 to-purple-800">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="h-8 w-8 animate-spin text-white" />
          <p className="text-white">Loading workspaces...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-800 via-indigo-800 to-purple-800 p-8">
      <div className="max-w-7xl mx-auto">
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-white mb-2">Your Workspaces</h1>
          <p className="text-slate-300">Select a workspace to get started or create a new one</p>
        </div>

        {/* Search and Controls */}
        {workspaces.length > 0 && (
          <div className="mb-6 flex flex-col sm:flex-row gap-4 items-center justify-between">
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 h-4 w-4" />
              <Input
                placeholder="Search workspaces..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 bg-white/10 border-white/20 text-white placeholder:text-slate-400"
              />
            </div>
            <div className="text-sm text-slate-300">
              {filteredWorkspaces.length} workspace{filteredWorkspaces.length !== 1 ? 's' : ''} found
            </div>
          </div>
        )}

        {workspaces.length === 0 ? (
          <Card className="p-12 text-center">
            <Building className="h-16 w-16 mx-auto mb-4 text-muted-foreground" />
            <h2 className="text-2xl font-semibold mb-2">No workspaces yet</h2>
            <p className="text-muted-foreground mb-6">
              Create your first workspace to start collaborating with your team
            </p>
            {onCreateWorkspace && (
              <Button onClick={onCreateWorkspace} size="lg">
                <Plus className="mr-2 h-5 w-5" />
                Create Workspace
              </Button>
            )}
          </Card>
        ) : filteredWorkspaces.length === 0 ? (
          <Card className="p-12 text-center">
            <Search className="h-16 w-16 mx-auto mb-4 text-muted-foreground" />
            <h2 className="text-2xl font-semibold mb-2">No workspaces found</h2>
            <p className="text-muted-foreground mb-6">
              Try adjusting your search terms or create a new workspace
            </p>
            {onCreateWorkspace && (
              <Button onClick={onCreateWorkspace} size="lg">
                <Plus className="mr-2 h-5 w-5" />
                Create Workspace
              </Button>
            )}
          </Card>
        ) : (
          <>
            {/* Workspaces Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
              {currentPageWorkspaces.map((workspace) => (
                <Card
                  key={workspace.id}
                  className="cursor-pointer hover:shadow-lg transition-all duration-200 relative group hover:scale-105"
                  onClick={() => handleWorkspaceClick(workspace)}
                >
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-3">
                        <div className="p-2 rounded-lg bg-primary/10">
                          <Building className="h-6 w-6 text-primary" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <CardTitle className="text-lg truncate">{workspace.name}</CardTitle>
                          {workspace.is_admin_workspace && (
                            <span className="text-xs px-2 py-0.5 rounded bg-primary/10 text-primary mt-1 inline-block">
                              Admin
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                    {workspace.description && (
                      <CardDescription className="mt-2 line-clamp-2">
                        {workspace.description}
                      </CardDescription>
                    )}
                  </CardHeader>
                  <CardContent>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <Users className="h-4 w-4" />
                        <span>{workspace.member_count || 1} member{workspace.member_count !== 1 ? 's' : ''}</span>
                      </div>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={(e) => handleInviteClick(e, workspace)}
                        className="opacity-0 group-hover:opacity-100 transition-opacity"
                      >
                        <Mail className="h-4 w-4 mr-1" />
                        Invite
                      </Button>
                    </div>
                    <Button
                      className="w-full mt-4"
                      onClick={() => handleWorkspaceClick(workspace)}
                      disabled={isSelecting}
                    >
                      {isSelecting ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Opening...
                        </>
                      ) : (
                        <>
                          Open Workspace
                          <ArrowRight className="ml-2 h-4 w-4" />
                        </>
                      )}
                    </Button>
                  </CardContent>
                </Card>
              ))}

              {/* Create New Workspace Card - only show on first page */}
              {onCreateWorkspace && currentPage === 1 && (
                <Card
                  className="cursor-pointer hover:shadow-lg transition-all duration-200 border-dashed border-2 flex items-center justify-center min-h-[200px] hover:scale-105"
                  onClick={onCreateWorkspace}
                >
                  <CardContent className="text-center p-6">
                    <Plus className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                    <CardTitle className="mb-2">Create New Workspace</CardTitle>
                    <CardDescription>Start a new workspace for your team</CardDescription>
                  </CardContent>
                </Card>
              )}
            </div>

            {/* Pagination Controls */}
            {totalPages > 1 && (
              <div className="flex items-center justify-center gap-4">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                  disabled={currentPage === 1}
                  className="bg-white/10 border-white/20 text-white hover:bg-white/20"
                >
                  <ChevronLeft className="h-4 w-4 mr-1" />
                  Previous
                </Button>
                
                <div className="flex items-center gap-2">
                  {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => {
                    // Show first page, last page, current page, and pages around current page
                    const showPage = page === 1 || 
                                   page === totalPages || 
                                   Math.abs(page - currentPage) <= 1;
                    
                    if (!showPage) {
                      // Show ellipsis for gaps
                      if (page === 2 && currentPage > 4) {
                        return <span key={page} className="text-slate-400">...</span>;
                      }
                      if (page === totalPages - 1 && currentPage < totalPages - 3) {
                        return <span key={page} className="text-slate-400">...</span>;
                      }
                      return null;
                    }
                    
                    return (
                      <Button
                        key={page}
                        variant={currentPage === page ? "default" : "outline"}
                        size="sm"
                        onClick={() => setCurrentPage(page)}
                        className={currentPage === page 
                          ? "bg-primary text-primary-foreground" 
                          : "bg-white/10 border-white/20 text-white hover:bg-white/20"
                        }
                      >
                        {page}
                      </Button>
                    );
                  })}
                </div>
                
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                  disabled={currentPage === totalPages}
                  className="bg-white/10 border-white/20 text-white hover:bg-white/20"
                >
                  Next
                  <ChevronRight className="h-4 w-4 ml-1" />
                </Button>
              </div>
            )}
          </>
        )}
      </div>

      {/* Invite Dialog */}
      <Dialog open={showInviteDialog} onOpenChange={setShowInviteDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Invite Team Members</DialogTitle>
            <DialogDescription>
              Invite people to join "{selectedWorkspace?.name}". They'll only be able to see content within this workspace.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Email Address</Label>
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
                <Alert variant="destructive">
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}
              <p className="text-xs text-muted-foreground">
                Note: Users must have an account in the system. If they don't have an account yet, they'll need to sign up first.
              </p>
            </div>

            {inviteEmails.length > 0 && (
              <div className="border rounded-lg p-4 max-h-48 overflow-y-auto">
                <div className="space-y-2">
                  {inviteEmails.map((email) => (
                    <div
                      key={email}
                      className="flex items-center justify-between p-2 rounded hover:bg-muted"
                    >
                      <p className="text-sm font-medium">{email}</p>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => handleRemoveInviteEmail(email)}
                        className="h-6 w-6 p-0"
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div className="flex gap-2 justify-end">
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  setShowInviteDialog(false);
                  setInviteEmails([]);
                  setInviteEmailInput('');
                  setError('');
                }}
                disabled={isInviting}
              >
                Cancel
              </Button>
              <Button
                type="button"
                onClick={handleSendInvites}
                disabled={isInviting || inviteEmails.length === 0}
              >
                {isInviting ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Sending...
                  </>
                ) : (
                  <>
                    <Mail className="mr-2 h-4 w-4" />
                    Send Invites
                  </>
                )}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

