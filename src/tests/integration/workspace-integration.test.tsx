/**
 * Workspace Integration Tests
 * Tests end-to-end workspace workflows and multi-user scenarios
 */

import React from 'react';
import { render, screen, fireEvent, waitFor, act } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { WorkspaceProvider } from '../../contexts/WorkspaceContext';
import { WorkspacesPage } from '../../components/WorkspacesPage';
import { WorkspaceCards } from '../../components/WorkspaceCards';
import { WorkspaceCreation } from '../../components/WorkspaceCreation';
import { workspaceHelpers } from '../../utils/workspaces';
import { WorkspaceCacheManager } from '../../utils/workspace-cache';
import { getCurrentAuthUser } from '../../utils/auth';

// Mock dependencies
jest.mock('../../utils/workspaces');
jest.mock('../../utils/auth');
jest.mock('../../utils/workspace-cache');
jest.mock('../../utils/module-access-control');
jest.mock('../../utils/workspacePersistence');

const mockWorkspaceHelpers = workspaceHelpers as jest.Mocked<typeof workspaceHelpers>;
const mockGetCurrentAuthUser = getCurrentAuthUser as jest.MockedFunction<typeof getCurrentAuthUser>;
const mockWorkspaceCacheManager = WorkspaceCacheManager as jest.Mocked<typeof WorkspaceCacheManager>;

// Mock workspace data
const mockWorkspaces = [
  {
    id: 'ws-1',
    name: 'Admin Workspace',
    description: 'Main admin workspace',
    owner_id: 'user-1',
    is_admin_workspace: true,
    created_at: '2024-01-01T00:00:00Z',
    updated_at: '2024-01-01T00:00:00Z',
    member_count: 1
  },
  {
    id: 'ws-2',
    name: 'Team Workspace',
    description: 'Team collaboration workspace',
    owner_id: 'user-1',
    is_admin_workspace: false,
    created_at: '2024-01-02T00:00:00Z',
    updated_at: '2024-01-02T00:00:00Z',
    member_count: 3
  }
];

const mockUser = {
  id: 'user-1',
  email: 'test@example.com'
};

// Test wrapper component
const TestWrapper: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <WorkspaceProvider>
    {children}
  </WorkspaceProvider>
);

describe('Workspace Integration Tests', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    
    // Setup default mocks
    mockGetCurrentAuthUser.mockResolvedValue(mockUser);
    mockWorkspaceHelpers.getUserWorkspaces.mockResolvedValue(mockWorkspaces);
    mockWorkspaceCacheManager.getCachedUserWorkspaces.mockReturnValue(null);
    mockWorkspaceCacheManager.getCachedWorkspaceModules.mockReturnValue(null);
    
    // Mock localStorage
    Object.defineProperty(window, 'localStorage', {
      value: {
        getItem: jest.fn(),
        setItem: jest.fn(),
        removeItem: jest.fn(),
        clear: jest.fn(),
      },
      writable: true,
    });
  });

  describe('End-to-End Workspace Workflows', () => {
    test('should load and display workspaces correctly', async () => {
      render(
        <TestWrapper>
          <WorkspacesPage />
        </TestWrapper>
      );

      // Should show loading state initially
      expect(screen.getByText(/loading/i)).toBeInTheDocument();

      // Wait for workspaces to load
      await waitFor(() => {
        expect(screen.getByText('Admin Workspace')).toBeInTheDocument();
        expect(screen.getByText('Team Workspace')).toBeInTheDocument();
      });

      // Should show workspace details
      expect(screen.getByText('Main admin workspace')).toBeInTheDocument();
      expect(screen.getByText('Team collaboration workspace')).toBeInTheDocument();
      expect(screen.getByText('1 member')).toBeInTheDocument();
      expect(screen.getByText('3 members')).toBeInTheDocument();
    });

    test('should handle workspace selection workflow', async () => {
      const user = userEvent.setup();
      const mockOnSelectWorkspace = jest.fn();

      render(
        <TestWrapper>
          <WorkspaceCards
            onSelectWorkspace={mockOnSelectWorkspace}
            onCreateWorkspace={jest.fn()}
          />
        </TestWrapper>
      );

      await waitFor(() => {
        expect(screen.getByText('Admin Workspace')).toBeInTheDocument();
      });

      // Click on workspace card
      const workspaceCard = screen.getByText('Admin Workspace').closest('[role="button"], .cursor-pointer');
      if (workspaceCard) {
        await user.click(workspaceCard);
      }

      expect(mockOnSelectWorkspace).toHaveBeenCalledWith(mockWorkspaces[0]);
    });

    test('should handle workspace creation workflow', async () => {
      const user = userEvent.setup();
      const mockOnComplete = jest.fn();
      const mockOnCancel = jest.fn();

      const newWorkspace = {
        id: 'ws-3',
        name: 'New Workspace',
        description: 'Newly created workspace',
        owner_id: 'user-1',
        is_admin_workspace: false,
        created_at: '2024-01-03T00:00:00Z',
        updated_at: '2024-01-03T00:00:00Z',
        member_count: 1
      };

      mockWorkspaceHelpers.createWorkspace.mockResolvedValue(newWorkspace);

      render(
        <TestWrapper>
          <WorkspaceCreation
            onComplete={mockOnComplete}
            onCancel={mockOnCancel}
          />
        </TestWrapper>
      );

      // Fill in workspace details
      const nameInput = screen.getByLabelText(/workspace name/i);
      const descriptionInput = screen.getByLabelText(/description/i);
      
      await user.type(nameInput, 'New Workspace');
      await user.type(descriptionInput, 'Newly created workspace');

      // Submit form
      const createButton = screen.getByRole('button', { name: /create workspace/i });
      await user.click(createButton);

      await waitFor(() => {
        expect(mockWorkspaceHelpers.createWorkspace).toHaveBeenCalledWith({
          name: 'New Workspace',
          description: 'Newly created workspace'
        });
        expect(mockOnComplete).toHaveBeenCalledWith(newWorkspace);
      });
    });
  });

  describe('Multi-User Workspace Scenarios', () => {
    test('should handle workspace member invitations', async () => {
      const user = userEvent.setup();
      mockWorkspaceHelpers.inviteMember.mockResolvedValue({ success: true });

      render(
        <TestWrapper>
          <WorkspaceCards
            onSelectWorkspace={jest.fn()}
            onCreateWorkspace={jest.fn()}
          />
        </TestWrapper>
      );

      await waitFor(() => {
        expect(screen.getByText('Admin Workspace')).toBeInTheDocument();
      });

      // Find and click invite button (should appear on hover)
      const workspaceCard = screen.getByText('Admin Workspace').closest('.group');
      if (workspaceCard) {
        fireEvent.mouseEnter(workspaceCard);
        
        const inviteButton = screen.getByRole('button', { name: /invite/i });
        await user.click(inviteButton);
      }

      // Should open invite dialog
      expect(screen.getByText(/invite team members/i)).toBeInTheDocument();

      // Add email and send invite
      const emailInput = screen.getByPlaceholderText(/enter email address/i);
      await user.type(emailInput, 'newuser@example.com');
      
      const addButton = screen.getByRole('button', { name: /add/i });
      await user.click(addButton);

      const sendButton = screen.getByRole('button', { name: /send invites/i });
      await user.click(sendButton);

      await waitFor(() => {
        expect(mockWorkspaceHelpers.inviteMember).toHaveBeenCalledWith({
          workspace_id: 'ws-1',
          user_email: 'newuser@example.com',
          role: 'member'
        });
      });
    });

    test('should handle workspace access control', async () => {
      // Test that users can only see workspaces they have access to
      const limitedWorkspaces = [mockWorkspaces[0]]; // Only admin workspace
      mockWorkspaceHelpers.getUserWorkspaces.mockResolvedValue(limitedWorkspaces);

      render(
        <TestWrapper>
          <WorkspacesPage />
        </TestWrapper>
      );

      await waitFor(() => {
        expect(screen.getByText('Admin Workspace')).toBeInTheDocument();
        expect(screen.queryByText('Team Workspace')).not.toBeInTheDocument();
      });
    });
  });

  describe('Error Recovery and Retry Mechanisms', () => {
    test('should handle network errors with retry', async () => {
      const user = userEvent.setup();
      
      // First call fails, second succeeds
      mockWorkspaceHelpers.getUserWorkspaces
        .mockRejectedValueOnce(new Error('Network error'))
        .mockResolvedValueOnce(mockWorkspaces);

      render(
        <TestWrapper>
          <WorkspacesPage />
        </TestWrapper>
      );

      // Should show error state
      await waitFor(() => {
        expect(screen.getByText(/error loading workspaces/i)).toBeInTheDocument();
      });

      // Click retry button
      const retryButton = screen.getByRole('button', { name: /retry/i });
      await user.click(retryButton);

      // Should eventually show workspaces
      await waitFor(() => {
        expect(screen.getByText('Admin Workspace')).toBeInTheDocument();
      });
    });

    test('should handle authentication errors', async () => {
      mockGetCurrentAuthUser.mockRejectedValue(new Error('Authentication failed'));

      render(
        <TestWrapper>
          <WorkspacesPage />
        </TestWrapper>
      );

      await waitFor(() => {
        expect(screen.getByText(/authentication failed/i)).toBeInTheDocument();
      });
    });

    test('should handle timeout errors', async () => {
      // Mock a timeout scenario
      mockWorkspaceHelpers.getUserWorkspaces.mockImplementation(
        () => new Promise((_, reject) => 
          setTimeout(() => reject(new Error('timeout')), 100)
        )
      );

      render(
        <TestWrapper>
          <WorkspacesPage />
        </TestWrapper>
      );

      await waitFor(() => {
        expect(screen.getByText(/timed out/i)).toBeInTheDocument();
      }, { timeout: 6000 });
    });
  });

  describe('Performance and Caching', () => {
    test('should use cached data when available', async () => {
      // Mock cached data
      mockWorkspaceCacheManager.getCachedUserWorkspaces.mockReturnValue(mockWorkspaces);

      render(
        <TestWrapper>
          <WorkspacesPage />
        </TestWrapper>
      );

      // Should load immediately from cache
      await waitFor(() => {
        expect(screen.getByText('Admin Workspace')).toBeInTheDocument();
      });

      // Should not call API initially when cache is available
      expect(mockWorkspaceHelpers.getUserWorkspaces).not.toHaveBeenCalled();
    });

    test('should handle pagination for large workspace lists', async () => {
      const user = userEvent.setup();
      
      // Create a large list of workspaces
      const largeWorkspaceList = Array.from({ length: 25 }, (_, i) => ({
        ...mockWorkspaces[0],
        id: `ws-${i}`,
        name: `Workspace ${i + 1}`
      }));

      mockWorkspaceHelpers.getUserWorkspaces.mockResolvedValue(largeWorkspaceList);

      render(
        <TestWrapper>
          <WorkspaceCards
            onSelectWorkspace={jest.fn()}
            onCreateWorkspace={jest.fn()}
          />
        </TestWrapper>
      );

      await waitFor(() => {
        expect(screen.getByText('Workspace 1')).toBeInTheDocument();
      });

      // Should show pagination controls
      expect(screen.getByRole('button', { name: /next/i })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /previous/i })).toBeInTheDocument();

      // Should show first 12 workspaces (plus create card = 13 total cards)
      expect(screen.getByText('Workspace 12')).toBeInTheDocument();
      expect(screen.queryByText('Workspace 13')).not.toBeInTheDocument();

      // Navigate to next page
      const nextButton = screen.getByRole('button', { name: /next/i });
      await user.click(nextButton);

      await waitFor(() => {
        expect(screen.getByText('Workspace 13')).toBeInTheDocument();
      });
    });

    test('should handle search functionality', async () => {
      const user = userEvent.setup();

      render(
        <TestWrapper>
          <WorkspaceCards
            onSelectWorkspace={jest.fn()}
            onCreateWorkspace={jest.fn()}
          />
        </TestWrapper>
      );

      await waitFor(() => {
        expect(screen.getByText('Admin Workspace')).toBeInTheDocument();
        expect(screen.getByText('Team Workspace')).toBeInTheDocument();
      });

      // Search for specific workspace
      const searchInput = screen.getByPlaceholderText(/search workspaces/i);
      await user.type(searchInput, 'Admin');

      // Should filter results
      await waitFor(() => {
        expect(screen.getByText('Admin Workspace')).toBeInTheDocument();
        expect(screen.queryByText('Team Workspace')).not.toBeInTheDocument();
      });
    });
  });

  describe('Mobile Responsiveness and Accessibility', () => {
    test('should be accessible with proper ARIA labels', async () => {
      render(
        <TestWrapper>
          <WorkspacesPage />
        </TestWrapper>
      );

      await waitFor(() => {
        expect(screen.getByText('Admin Workspace')).toBeInTheDocument();
      });

      // Check for proper heading structure
      expect(screen.getByRole('heading', { name: /workspaces/i })).toBeInTheDocument();
      
      // Check for proper button labels
      const createButton = screen.getByRole('button', { name: /create workspace/i });
      expect(createButton).toBeInTheDocument();
    });

    test('should handle keyboard navigation', async () => {
      const user = userEvent.setup();

      render(
        <TestWrapper>
          <WorkspacesPage />
        </TestWrapper>
      );

      await waitFor(() => {
        expect(screen.getByText('Admin Workspace')).toBeInTheDocument();
      });

      // Tab through interactive elements
      await user.tab();
      expect(screen.getByRole('button', { name: /create workspace/i })).toHaveFocus();
    });

    test('should work on mobile viewports', async () => {
      // Mock mobile viewport
      Object.defineProperty(window, 'innerWidth', {
        writable: true,
        configurable: true,
        value: 375,
      });

      render(
        <TestWrapper>
          <WorkspacesPage />
        </TestWrapper>
      );

      await waitFor(() => {
        expect(screen.getByText('Admin Workspace')).toBeInTheDocument();
      });

      // Should still be functional on mobile
      expect(screen.getByRole('button', { name: /create workspace/i })).toBeInTheDocument();
    });
  });
});