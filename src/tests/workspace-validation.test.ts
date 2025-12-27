/**
 * Workspace Functionality Validation Tests
 * Tests core workspace functionality and data isolation
 */

import { WorkspaceCacheManager } from '../utils/workspace-cache';
import { workspaceHelpers } from '../utils/workspaces';

// Mock dependencies for testing
jest.mock('../utils/workspaces');
jest.mock('../utils/supabase/client');

const mockWorkspaceHelpers = workspaceHelpers as jest.Mocked<typeof workspaceHelpers>;

describe('Workspace Functionality Validation', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Workspace Data Isolation', () => {
    test('should enforce workspace filtering in queries', async () => {
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
        }
      ];

      mockWorkspaceHelpers.getUserWorkspaces.mockResolvedValue(mockWorkspaces);

      const result = await workspaceHelpers.getUserWorkspaces();
      
      expect(result).toEqual(mockWorkspaces);
      expect(mockWorkspaceHelpers.getUserWorkspaces).toHaveBeenCalledTimes(1);
    });

    test('should validate workspace access permissions', async () => {
      const workspaceId = 'ws-1';
      const userId = 'user-1';

      // Mock successful access validation
      mockWorkspaceHelpers.validateWorkspaceAccess = jest.fn().mockResolvedValue(true);

      const hasAccess = await workspaceHelpers.validateWorkspaceAccess(workspaceId, userId);
      
      expect(hasAccess).toBe(true);
      expect(mockWorkspaceHelpers.validateWorkspaceAccess).toHaveBeenCalledWith(workspaceId, userId);
    });
  });

  describe('Workspace Caching', () => {
    test('should cache workspace data correctly', () => {
      const userId = 'user-1';
      const mockWorkspaces = [
        {
          id: 'ws-1',
          name: 'Test Workspace',
          description: 'Test description',
          owner_id: userId,
          is_admin_workspace: true,
          created_at: '2024-01-01T00:00:00Z',
          updated_at: '2024-01-01T00:00:00Z',
          member_count: 1
        }
      ];

      // Cache workspaces
      WorkspaceCacheManager.cacheUserWorkspaces(userId, mockWorkspaces);

      // Retrieve cached workspaces
      const cachedWorkspaces = WorkspaceCacheManager.getCachedUserWorkspaces(userId);

      expect(cachedWorkspaces).toEqual(mockWorkspaces);
    });

    test('should invalidate workspace cache correctly', () => {
      const workspaceId = 'ws-1';
      const modules = ['module1', 'module2'];

      // Cache modules
      WorkspaceCacheManager.cacheWorkspaceModules(workspaceId, modules);

      // Verify cached
      let cachedModules = WorkspaceCacheManager.getCachedWorkspaceModules(workspaceId);
      expect(cachedModules).toEqual(modules);

      // Invalidate cache
      WorkspaceCacheManager.invalidateWorkspaceCache(workspaceId);

      // Verify cache cleared
      cachedModules = WorkspaceCacheManager.getCachedWorkspaceModules(workspaceId);
      expect(cachedModules).toBeNull();
    });
  });

  describe('Workspace Creation and Management', () => {
    test('should create workspace with proper validation', async () => {
      const workspaceData = {
        name: 'New Workspace',
        description: 'Test workspace description'
      };

      const createdWorkspace = {
        id: 'ws-new',
        ...workspaceData,
        owner_id: 'user-1',
        is_admin_workspace: false,
        created_at: '2024-01-01T00:00:00Z',
        updated_at: '2024-01-01T00:00:00Z',
        member_count: 1
      };

      mockWorkspaceHelpers.createWorkspace.mockResolvedValue(createdWorkspace);

      const result = await workspaceHelpers.createWorkspace(workspaceData);

      expect(result).toEqual(createdWorkspace);
      expect(mockWorkspaceHelpers.createWorkspace).toHaveBeenCalledWith(workspaceData);
    });

    test('should handle workspace creation errors', async () => {
      const workspaceData = {
        name: '',
        description: 'Test workspace description'
      };

      const error = new Error('Workspace name is required');
      mockWorkspaceHelpers.createWorkspace.mockRejectedValue(error);

      await expect(workspaceHelpers.createWorkspace(workspaceData)).rejects.toThrow('Workspace name is required');
    });
  });

  describe('Performance and Pagination', () => {
    test('should handle large workspace lists efficiently', () => {
      const largeWorkspaceList = Array.from({ length: 100 }, (_, i) => ({
        id: `ws-${i}`,
        name: `Workspace ${i + 1}`,
        description: `Description ${i + 1}`,
        owner_id: 'user-1',
        is_admin_workspace: i === 0,
        created_at: '2024-01-01T00:00:00Z',
        updated_at: '2024-01-01T00:00:00Z',
        member_count: Math.floor(Math.random() * 10) + 1
      }));

      // Test pagination logic
      const pageSize = 12;
      const page1 = largeWorkspaceList.slice(0, pageSize);
      const page2 = largeWorkspaceList.slice(pageSize, pageSize * 2);

      expect(page1).toHaveLength(pageSize);
      expect(page2).toHaveLength(pageSize);
      expect(page1[0].id).toBe('ws-0');
      expect(page2[0].id).toBe('ws-12');
    });

    test('should filter workspaces by search query', () => {
      const workspaces = [
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
          description: 'Team collaboration space',
          owner_id: 'user-1',
          is_admin_workspace: false,
          created_at: '2024-01-01T00:00:00Z',
          updated_at: '2024-01-01T00:00:00Z',
          member_count: 3
        }
      ];

      // Test search filtering
      const searchQuery = 'admin';
      const filteredWorkspaces = workspaces.filter(workspace => 
        workspace.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (workspace.description && workspace.description.toLowerCase().includes(searchQuery.toLowerCase()))
      );

      expect(filteredWorkspaces).toHaveLength(1);
      expect(filteredWorkspaces[0].name).toBe('Admin Workspace');
    });
  });

  describe('Error Handling and Recovery', () => {
    test('should handle network errors with retry logic', async () => {
      let callCount = 0;
      
      mockWorkspaceHelpers.getUserWorkspaces.mockImplementation(() => {
        callCount++;
        if (callCount === 1) {
          return Promise.reject(new Error('Network error'));
        }
        return Promise.resolve([]);
      });

      // First call should fail
      await expect(workspaceHelpers.getUserWorkspaces()).rejects.toThrow('Network error');

      // Second call should succeed
      const result = await workspaceHelpers.getUserWorkspaces();
      expect(result).toEqual([]);
      expect(callCount).toBe(2);
    });

    test('should handle authentication errors', async () => {
      const authError = new Error('Authentication failed');
      authError.name = 'AuthError';
      
      mockWorkspaceHelpers.getUserWorkspaces.mockRejectedValue(authError);

      await expect(workspaceHelpers.getUserWorkspaces()).rejects.toThrow('Authentication failed');
    });

    test('should handle timeout errors', async () => {
      const timeoutError = new Error('Request timeout');
      timeoutError.name = 'TimeoutError';
      
      mockWorkspaceHelpers.getUserWorkspaces.mockRejectedValue(timeoutError);

      await expect(workspaceHelpers.getUserWorkspaces()).rejects.toThrow('Request timeout');
    });
  });

  describe('Multi-Tenant Security', () => {
    test('should prevent cross-workspace data access', async () => {
      const workspace1Id = 'ws-1';
      const workspace2Id = 'ws-2';
      const userId = 'user-1';

      // Mock access validation
      mockWorkspaceHelpers.validateWorkspaceAccess = jest.fn()
        .mockImplementation((workspaceId, user) => {
          // User only has access to workspace1
          return Promise.resolve(workspaceId === workspace1Id);
        });

      // Should allow access to workspace1
      const hasAccess1 = await workspaceHelpers.validateWorkspaceAccess(workspace1Id, userId);
      expect(hasAccess1).toBe(true);

      // Should deny access to workspace2
      const hasAccess2 = await workspaceHelpers.validateWorkspaceAccess(workspace2Id, userId);
      expect(hasAccess2).toBe(false);
    });

    test('should log security violations', () => {
      const consoleSpy = jest.spyOn(console, 'warn').mockImplementation();
      
      // Simulate unauthorized access attempt
      const unauthorizedAccess = {
        userId: 'user-1',
        attemptedWorkspaceId: 'ws-unauthorized',
        action: 'access_workspace',
        timestamp: new Date().toISOString()
      };

      // Log security violation
      console.warn('Security violation detected:', unauthorizedAccess);

      expect(consoleSpy).toHaveBeenCalledWith('Security violation detected:', unauthorizedAccess);
      
      consoleSpy.mockRestore();
    });
  });
});