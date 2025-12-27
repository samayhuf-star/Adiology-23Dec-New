/**
 * Module Access Guard Component
 * Conditionally renders content based on module access permissions
 */

import React from 'react';
import { useWorkspace } from '../contexts/WorkspaceContext';
import { useModuleAccess } from '../utils/module-access-control';
import { AlertTriangle, Lock, Shield } from 'lucide-react';

interface ModuleAccessGuardProps {
  moduleName: string;
  requiredPermission?: 'read' | 'write' | 'delete' | 'admin';
  children: React.ReactNode;
  fallback?: React.ReactNode;
  showAccessDenied?: boolean;
  className?: string;
}

/**
 * Guards content based on module access permissions
 * Shows children only if user has required access
 */
export const ModuleAccessGuard: React.FC<ModuleAccessGuardProps> = ({
  moduleName,
  requiredPermission = 'read',
  children,
  fallback,
  showAccessDenied = true,
  className = ''
}) => {
  const { currentWorkspace } = useWorkspace();
  const { hasAccess, isLoading, reason, isAdminWorkspace } = useModuleAccess(moduleName, requiredPermission);

  // Show loading state
  if (isLoading) {
    return (
      <div className={`flex items-center justify-center p-4 ${className}`}>
        <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
        <span className="ml-2 text-sm text-gray-600">Checking access...</span>
      </div>
    );
  }

  // Show children if access is granted
  if (hasAccess) {
    return <>{children}</>;
  }

  // Show custom fallback if provided
  if (fallback) {
    return <>{fallback}</>;
  }

  // Show access denied message if enabled
  if (showAccessDenied) {
    return (
      <div className={`flex flex-col items-center justify-center p-8 bg-gray-50 rounded-lg border-2 border-dashed border-gray-300 ${className}`}>
        <div className="flex items-center mb-4">
          {isAdminWorkspace ? (
            <Shield className="h-8 w-8 text-amber-500 mr-2" />
          ) : (
            <Lock className="h-8 w-8 text-red-500 mr-2" />
          )}
          <AlertTriangle className="h-8 w-8 text-amber-500" />
        </div>
        
        <h3 className="text-lg font-semibold text-gray-900 mb-2">
          Access Restricted
        </h3>
        
        <p className="text-sm text-gray-600 text-center mb-4 max-w-md">
          {reason || `You don't have ${requiredPermission} access to the ${moduleName.replace('_', ' ')} module.`}
        </p>
        
        {!currentWorkspace && (
          <p className="text-xs text-gray-500 text-center">
            Please select a workspace to continue.
          </p>
        )}
        
        {currentWorkspace && !isAdminWorkspace && (
          <p className="text-xs text-gray-500 text-center">
            Contact your workspace administrator to request access.
          </p>
        )}
      </div>
    );
  }

  // Return nothing if access denied and no fallback
  return null;
};

/**
 * Hook-based module access guard for conditional rendering
 */
export const useModuleAccessGuard = (moduleName: string, requiredPermission: 'read' | 'write' | 'delete' | 'admin' = 'read') => {
  const { hasAccess, isLoading, reason, permissions, isAdminWorkspace } = useModuleAccess(moduleName, requiredPermission);
  
  return {
    hasAccess,
    isLoading,
    reason,
    permissions,
    isAdminWorkspace,
    canRead: permissions.includes('read') || permissions.includes('admin'),
    canWrite: permissions.includes('write') || permissions.includes('admin'),
    canDelete: permissions.includes('delete') || permissions.includes('admin'),
    canAdmin: permissions.includes('admin'),
  };
};

/**
 * Higher-order component for module access control
 */
export function withModuleAccess<P extends object>(
  WrappedComponent: React.ComponentType<P>,
  moduleName: string,
  requiredPermission: 'read' | 'write' | 'delete' | 'admin' = 'read'
) {
  const WithModuleAccessComponent = (props: P) => {
    return (
      <ModuleAccessGuard 
        moduleName={moduleName} 
        requiredPermission={requiredPermission}
      >
        <WrappedComponent {...props} />
      </ModuleAccessGuard>
    );
  };

  WithModuleAccessComponent.displayName = `withModuleAccess(${WrappedComponent.displayName || WrappedComponent.name})`;
  
  return WithModuleAccessComponent;
}

/**
 * Module access indicator component
 */
interface ModuleAccessIndicatorProps {
  moduleName: string;
  className?: string;
}

export const ModuleAccessIndicator: React.FC<ModuleAccessIndicatorProps> = ({
  moduleName,
  className = ''
}) => {
  const { hasAccess, permissions, isAdminWorkspace, isLoading } = useModuleAccess(moduleName);

  if (isLoading) {
    return (
      <div className={`inline-flex items-center px-2 py-1 rounded-full text-xs bg-gray-100 ${className}`}>
        <div className="animate-spin rounded-full h-3 w-3 border-b border-gray-400 mr-1"></div>
        Loading...
      </div>
    );
  }

  if (!hasAccess) {
    return (
      <div className={`inline-flex items-center px-2 py-1 rounded-full text-xs bg-red-100 text-red-800 ${className}`}>
        <Lock className="h-3 w-3 mr-1" />
        No Access
      </div>
    );
  }

  if (isAdminWorkspace) {
    return (
      <div className={`inline-flex items-center px-2 py-1 rounded-full text-xs bg-purple-100 text-purple-800 ${className}`}>
        <Shield className="h-3 w-3 mr-1" />
        Admin
      </div>
    );
  }

  const highestPermission = permissions.includes('admin') ? 'admin' :
                           permissions.includes('delete') ? 'delete' :
                           permissions.includes('write') ? 'write' : 'read';

  const colorMap = {
    admin: 'bg-purple-100 text-purple-800',
    delete: 'bg-red-100 text-red-800',
    write: 'bg-blue-100 text-blue-800',
    read: 'bg-green-100 text-green-800',
  };

  return (
    <div className={`inline-flex items-center px-2 py-1 rounded-full text-xs ${colorMap[highestPermission]} ${className}`}>
      {highestPermission.charAt(0).toUpperCase() + highestPermission.slice(1)}
    </div>
  );
};