/**
 * Module Permissions Manager Component
 * Allows admin users to manage module permissions for workspaces
 */

import React, { useState, useEffect } from 'react';
import { useWorkspace } from '../contexts/WorkspaceContext';
import { 
  moduleAccessControl, 
  ModulePermission, 
  AVAILABLE_MODULES,
  ModuleName 
} from '../utils/module-access-control';
import { ModuleAccessGuard } from './module-access-guard';
import { Settings, Shield, Users, AlertCircle, Check, X, Save, RefreshCw } from 'lucide-react';

interface ModulePermissionsManagerProps {
  targetWorkspaceId?: string;
  className?: string;
}

export const ModulePermissionsManager: React.FC<ModulePermissionsManagerProps> = ({
  targetWorkspaceId,
  className = ''
}) => {
  const { currentWorkspace, workspaces } = useWorkspace();
  const [permissions, setPermissions] = useState<ModulePermission[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedWorkspaceId, setSelectedWorkspaceId] = useState<string>(
    targetWorkspaceId || currentWorkspace?.id || ''
  );
  const [pendingChanges, setPendingChanges] = useState<Map<string, Partial<ModulePermission>>>(new Map());

  // Load permissions for selected workspace
  useEffect(() => {
    if (selectedWorkspaceId) {
      loadPermissions();
    }
  }, [selectedWorkspaceId]);

  const loadPermissions = async () => {
    try {
      setIsLoading(true);
      setError(null);
      
      const workspacePermissions = await moduleAccessControl.getWorkspaceModulePermissions(selectedWorkspaceId);
      setPermissions(workspacePermissions);
      setPendingChanges(new Map());
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load permissions');
    } finally {
      setIsLoading(false);
    }
  };

  const handlePermissionChange = (moduleName: string, field: 'enabled' | 'permissions', value: boolean | string[]) => {
    const existingPermission = permissions.find(p => p.module_name === moduleName);
    const currentChanges = pendingChanges.get(moduleName) || {};
    
    const updatedChanges = {
      ...currentChanges,
      [field]: value,
      module_name: moduleName,
      workspace_id: selectedWorkspaceId,
    };

    const newPendingChanges = new Map(pendingChanges);
    newPendingChanges.set(moduleName, updatedChanges);
    setPendingChanges(newPendingChanges);

    // Update local state for immediate UI feedback
    if (existingPermission) {
      const updatedPermissions = permissions.map(p => 
        p.module_name === moduleName 
          ? { ...p, [field]: value }
          : p
      );
      setPermissions(updatedPermissions);
    } else {
      // Add new permission entry
      const newPermission: ModulePermission = {
        id: `temp-${moduleName}`,
        workspace_id: selectedWorkspaceId,
        module_name: moduleName,
        enabled: field === 'enabled' ? value as boolean : false,
        permissions: field === 'permissions' ? value as string[] : ['read'],
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };
      setPermissions([...permissions, newPermission]);
    }
  };

  const handlePermissionToggle = (moduleName: string, permission: 'read' | 'write' | 'delete' | 'admin') => {
    const existingPermission = permissions.find(p => p.module_name === moduleName);
    const currentPermissions = existingPermission?.permissions || [];
    
    let newPermissions: string[];
    if (currentPermissions.includes(permission)) {
      newPermissions = currentPermissions.filter(p => p !== permission);
    } else {
      newPermissions = [...currentPermissions, permission];
    }

    handlePermissionChange(moduleName, 'permissions', newPermissions);
  };

  const saveChanges = async () => {
    try {
      setSaving(true);
      setError(null);

      // Save all pending changes
      for (const [moduleName, changes] of pendingChanges) {
        await moduleAccessControl.updateModulePermissions({
          workspace_id: selectedWorkspaceId,
          module_name: moduleName,
          enabled: changes.enabled ?? false,
          permissions: changes.permissions as ('read' | 'write' | 'delete' | 'admin')[] ?? ['read'],
        });
      }

      // Reload permissions to get fresh data
      await loadPermissions();
      
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save changes');
    } finally {
      setSaving(false);
    }
  };

  const discardChanges = () => {
    setPendingChanges(new Map());
    loadPermissions();
  };

  const getModuleDisplayName = (moduleName: string): string => {
    return moduleName
      .split('_')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
  };

  const getPermissionForModule = (moduleName: string): ModulePermission | undefined => {
    return permissions.find(p => p.module_name === moduleName);
  };

  const hasPendingChanges = pendingChanges.size > 0;

  return (
    <ModuleAccessGuard moduleName="team_management" requiredPermission="admin">
      <div className={`bg-white rounded-lg shadow-sm border ${className}`}>
        <div className="p-6 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <Settings className="h-6 w-6 text-gray-600 mr-3" />
              <div>
                <h2 className="text-xl font-semibold text-gray-900">Module Permissions</h2>
                <p className="text-sm text-gray-600 mt-1">
                  Manage module access and permissions for workspaces
                </p>
              </div>
            </div>
            
            <div className="flex items-center space-x-3">
              {hasPendingChanges && (
                <div className="flex items-center space-x-2">
                  <button
                    onClick={discardChanges}
                    disabled={isSaving}
                    className="px-3 py-1 text-sm text-gray-600 hover:text-gray-800 border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50"
                  >
                    <X className="h-4 w-4 mr-1 inline" />
                    Discard
                  </button>
                  <button
                    onClick={saveChanges}
                    disabled={isSaving}
                    className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 flex items-center"
                  >
                    {isSaving ? (
                      <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                    ) : (
                      <Save className="h-4 w-4 mr-2" />
                    )}
                    Save Changes
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* Workspace Selector */}
          {!targetWorkspaceId && (
            <div className="mt-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Select Workspace
              </label>
              <select
                value={selectedWorkspaceId}
                onChange={(e) => setSelectedWorkspaceId(e.target.value)}
                className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="">Select a workspace...</option>
                {workspaces.map((workspace) => (
                  <option key={workspace.id} value={workspace.id}>
                    {workspace.name} {workspace.is_admin_workspace && '(Admin)'}
                  </option>
                ))}
              </select>
            </div>
          )}
        </div>

        <div className="p-6">
          {error && (
            <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-md">
              <div className="flex items-center">
                <AlertCircle className="h-5 w-5 text-red-500 mr-2" />
                <span className="text-sm text-red-700">{error}</span>
              </div>
            </div>
          )}

          {hasPendingChanges && (
            <div className="mb-6 p-4 bg-amber-50 border border-amber-200 rounded-md">
              <div className="flex items-center">
                <AlertCircle className="h-5 w-5 text-amber-500 mr-2" />
                <span className="text-sm text-amber-700">
                  You have unsaved changes. Click "Save Changes" to apply them.
                </span>
              </div>
            </div>
          )}

          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <RefreshCw className="h-6 w-6 animate-spin text-gray-400 mr-2" />
              <span className="text-gray-600">Loading permissions...</span>
            </div>
          ) : !selectedWorkspaceId ? (
            <div className="text-center py-12 text-gray-500">
              <Users className="h-12 w-12 mx-auto mb-4 text-gray-300" />
              <p>Select a workspace to manage module permissions</p>
            </div>
          ) : (
            <div className="space-y-4">
              {Object.values(AVAILABLE_MODULES).map((moduleName) => {
                const permission = getPermissionForModule(moduleName);
                const isEnabled = permission?.enabled ?? false;
                const modulePermissions = permission?.permissions ?? [];

                return (
                  <div
                    key={moduleName}
                    className="border border-gray-200 rounded-lg p-4 hover:bg-gray-50 transition-colors"
                  >
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center">
                        <div className="flex items-center">
                          <input
                            type="checkbox"
                            checked={isEnabled}
                            onChange={(e) => handlePermissionChange(moduleName, 'enabled', e.target.checked)}
                            className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                          />
                          <label className="ml-3 text-sm font-medium text-gray-900">
                            {getModuleDisplayName(moduleName)}
                          </label>
                        </div>
                        {permission?.id.startsWith('temp-') && (
                          <span className="ml-2 px-2 py-1 text-xs bg-blue-100 text-blue-800 rounded-full">
                            New
                          </span>
                        )}
                      </div>
                      
                      {isEnabled && (
                        <div className="flex items-center space-x-2">
                          {['read', 'write', 'delete', 'admin'].map((perm) => (
                            <button
                              key={perm}
                              onClick={() => handlePermissionToggle(moduleName, perm as any)}
                              className={`px-2 py-1 text-xs rounded-full border transition-colors ${
                                modulePermissions.includes(perm)
                                  ? 'bg-blue-100 text-blue-800 border-blue-200'
                                  : 'bg-gray-100 text-gray-600 border-gray-200 hover:bg-gray-200'
                              }`}
                            >
                              {modulePermissions.includes(perm) && (
                                <Check className="h-3 w-3 inline mr-1" />
                              )}
                              {perm.charAt(0).toUpperCase() + perm.slice(1)}
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                    
                    {!isEnabled && (
                      <p className="text-xs text-gray-500 ml-7">
                        Module is disabled for this workspace
                      </p>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </ModuleAccessGuard>
  );
};