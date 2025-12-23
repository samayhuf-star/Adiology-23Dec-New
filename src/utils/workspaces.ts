import { supabase } from './supabase/client';
import { getCurrentAuthUser } from './auth';

export interface Workspace {
  id: string;
  name: string;
  description?: string;
  owner_id: string;
  is_admin_workspace: boolean;
  created_at: string;
  updated_at: string;
  role?: string; // User's role in this workspace
  member_count?: number;
}

export interface WorkspaceMember {
  id: string;
  workspace_id: string;
  user_id: string;
  role: 'owner' | 'admin' | 'member';
  invited_by?: string;
  invited_at: string;
  joined_at?: string;
  status: 'pending' | 'active' | 'declined';
  created_at: string;
  updated_at: string;
  user_email?: string;
  user_name?: string;
}

export interface WorkspaceModule {
  id: string;
  workspace_id: string;
  module_name: string;
  enabled: boolean;
  created_at: string;
  updated_at: string;
}

export interface CreateWorkspaceInput {
  name: string;
  description?: string;
}

export interface InviteMemberInput {
  workspace_id: string;
  user_email: string;
  role?: 'admin' | 'member';
}

/**
 * Workspace utilities for managing workspaces, members, and modules
 */
export const workspaceHelpers = {
  /**
   * Create default admin workspace for a user (called after payment)
   */
  async createAdminWorkspace(userId: string): Promise<Workspace> {
    try {
      // Call the database function to create admin workspace
      const { data, error } = await supabase.rpc('create_admin_workspace', {
        user_uuid: userId,
      });

      if (error) {
        console.error('Error creating admin workspace:', error);
        throw error;
      }

      // Fetch the created workspace
      const workspace = await this.getWorkspaceById(data);
      if (!workspace) {
        throw new Error('Failed to retrieve created workspace');
      }

      return workspace;
    } catch (error) {
      console.error('Error in createAdminWorkspace:', error);
      throw error;
    }
  },

  /**
   * Get all workspaces for the current user
   */
  async getUserWorkspaces(): Promise<Workspace[]> {
    try {
      const user = await getCurrentAuthUser();
      if (!user) {
        throw new Error('User not authenticated');
      }

      const { data, error } = await supabase.rpc('get_user_workspaces', {
        user_uuid: user.id,
      });

      if (error) {
        console.error('Error fetching user workspaces:', error);
        throw error;
      }

      return data || [];
    } catch (error) {
      console.error('Error in getUserWorkspaces:', error);
      throw error;
    }
  },

  /**
   * Get workspace by ID
   */
  async getWorkspaceById(workspaceId: string): Promise<Workspace | null> {
    try {
      const { data, error } = await supabase
        .from('workspaces')
        .select('*')
        .eq('id', workspaceId)
        .single();

      if (error) {
        console.error('Error fetching workspace:', error);
        throw error;
      }

      return data;
    } catch (error) {
      console.error('Error in getWorkspaceById:', error);
      return null;
    }
  },

  /**
   * Create a new workspace
   */
  async createWorkspace(input: CreateWorkspaceInput): Promise<Workspace> {
    try {
      const user = await getCurrentAuthUser();
      if (!user) {
        throw new Error('User not authenticated');
      }

      const { data, error } = await supabase
        .from('workspaces')
        .insert({
          name: input.name,
          description: input.description || null,
          owner_id: user.id,
          is_admin_workspace: false,
        })
        .select()
        .single();

      if (error) {
        console.error('Error creating workspace:', error);
        throw error;
      }

      // Add owner as member
      await supabase.from('workspace_members').insert({
        workspace_id: data.id,
        user_id: user.id,
        role: 'owner',
        status: 'active',
        joined_at: new Date().toISOString(),
      });

      // Add default modules
      const defaultModules = ['dashboard', 'settings', 'support', 'help', 'ticket'];
      const moduleInserts = defaultModules.map((moduleName) => ({
        workspace_id: data.id,
        module_name: moduleName,
        enabled: true,
      }));

      await supabase.from('workspace_modules').insert(moduleInserts);

      return data;
    } catch (error) {
      console.error('Error in createWorkspace:', error);
      throw error;
    }
  },

  /**
   * Update workspace
   */
  async updateWorkspace(workspaceId: string, updates: Partial<CreateWorkspaceInput>): Promise<Workspace> {
    try {
      const { data, error } = await supabase
        .from('workspaces')
        .update(updates)
        .eq('id', workspaceId)
        .select()
        .single();

      if (error) {
        console.error('Error updating workspace:', error);
        throw error;
      }

      return data;
    } catch (error) {
      console.error('Error in updateWorkspace:', error);
      throw error;
    }
  },

  /**
   * Delete workspace
   */
  async deleteWorkspace(workspaceId: string): Promise<void> {
    try {
      const { error } = await supabase
        .from('workspaces')
        .delete()
        .eq('id', workspaceId);

      if (error) {
        console.error('Error deleting workspace:', error);
        throw error;
      }
    } catch (error) {
      console.error('Error in deleteWorkspace:', error);
      throw error;
    }
  },

  /**
   * Get members of a workspace
   */
  async getWorkspaceMembers(workspaceId: string): Promise<WorkspaceMember[]> {
    try {
      const { data, error } = await supabase
        .from('workspace_members')
        .select(`
          *,
          user:users!workspace_members_user_id_fkey(email, full_name)
        `)
        .eq('workspace_id', workspaceId)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching workspace members:', error);
        throw error;
      }

      // Transform the data to include user info
      return (data || []).map((member: any) => ({
        ...member,
        user_email: member.user?.email,
        user_name: member.user?.full_name,
      }));
    } catch (error) {
      console.error('Error in getWorkspaceMembers:', error);
      throw error;
    }
  },

  /**
   * Invite a user to a workspace
   */
  async inviteMember(input: InviteMemberInput): Promise<WorkspaceMember> {
    try {
      const user = await getCurrentAuthUser();
      if (!user) {
        throw new Error('User not authenticated');
      }

      // First, find the user by email
      const { data: userData, error: userError } = await supabase
        .from('users')
        .select('id')
        .eq('email', input.user_email)
        .single();

      if (userError || !userData) {
        throw new Error('User not found with this email');
      }

      // Check if user is already a member
      const { data: existingMember } = await supabase
        .from('workspace_members')
        .select('id')
        .eq('workspace_id', input.workspace_id)
        .eq('user_id', userData.id)
        .single();

      if (existingMember) {
        throw new Error('User is already a member of this workspace');
      }

      // Create invitation
      const { data, error } = await supabase
        .from('workspace_members')
        .insert({
          workspace_id: input.workspace_id,
          user_id: userData.id,
          role: input.role || 'member',
          invited_by: user.id,
          status: 'pending',
        })
        .select()
        .single();

      if (error) {
        console.error('Error inviting member:', error);
        throw error;
      }

      return data;
    } catch (error) {
      console.error('Error in inviteMember:', error);
      throw error;
    }
  },

  /**
   * Accept workspace invitation
   */
  async acceptInvitation(workspaceId: string): Promise<void> {
    try {
      const user = await getCurrentAuthUser();
      if (!user) {
        throw new Error('User not authenticated');
      }

      const { error } = await supabase
        .from('workspace_members')
        .update({
          status: 'active',
          joined_at: new Date().toISOString(),
        })
        .eq('workspace_id', workspaceId)
        .eq('user_id', user.id)
        .eq('status', 'pending');

      if (error) {
        console.error('Error accepting invitation:', error);
        throw error;
      }
    } catch (error) {
      console.error('Error in acceptInvitation:', error);
      throw error;
    }
  },

  /**
   * Remove member from workspace
   */
  async removeMember(workspaceId: string, memberId: string): Promise<void> {
    try {
      const { error } = await supabase
        .from('workspace_members')
        .delete()
        .eq('id', memberId)
        .eq('workspace_id', workspaceId);

      if (error) {
        console.error('Error removing member:', error);
        throw error;
      }
    } catch (error) {
      console.error('Error in removeMember:', error);
      throw error;
    }
  },

  /**
   * Get modules for a workspace
   */
  async getWorkspaceModules(workspaceId: string): Promise<WorkspaceModule[]> {
    try {
      const { data, error } = await supabase
        .from('workspace_modules')
        .select('*')
        .eq('workspace_id', workspaceId)
        .eq('enabled', true)
        .order('module_name');

      if (error) {
        console.error('Error fetching workspace modules:', error);
        throw error;
      }

      return data || [];
    } catch (error) {
      console.error('Error in getWorkspaceModules:', error);
      throw error;
    }
  },

  /**
   * Update workspace modules
   */
  async updateWorkspaceModules(workspaceId: string, modules: string[]): Promise<void> {
    try {
      // Get all available modules
      const allModules = [
        'dashboard',
        'campaign-wizard',
        'one-click-builder',
        'keywords',
        'settings',
        'support',
        'help',
        'ticket',
        'billing',
        'analytics',
        'templates',
        'websites',
      ];

      // Delete all existing modules for this workspace
      await supabase
        .from('workspace_modules')
        .delete()
        .eq('workspace_id', workspaceId);

      // Insert new modules
      const moduleInserts = modules.map((moduleName) => ({
        workspace_id: workspaceId,
        module_name: moduleName,
        enabled: true,
      }));

      const { error } = await supabase.from('workspace_modules').insert(moduleInserts);

      if (error) {
        console.error('Error updating workspace modules:', error);
        throw error;
      }
    } catch (error) {
      console.error('Error in updateWorkspaceModules:', error);
      throw error;
    }
  },

  /**
   * Check if user has access to a module in current workspace
   */
  async hasModuleAccess(workspaceId: string, moduleName: string): Promise<boolean> {
    try {
      const { data, error } = await supabase
        .from('workspace_modules')
        .select('id')
        .eq('workspace_id', workspaceId)
        .eq('module_name', moduleName)
        .eq('enabled', true)
        .single();

      if (error || !data) {
        return false;
      }

      return true;
    } catch (error) {
      console.error('Error checking module access:', error);
      return false;
    }
  },

  /**
   * Check if user needs to create a workspace (has no non-admin workspaces)
   */
  async needsWorkspaceCreation(): Promise<boolean> {
    try {
      const workspaces = await this.getUserWorkspaces();
      // Check if user has any non-admin workspace
      const hasNonAdminWorkspace = workspaces.some((w) => !w.is_admin_workspace);
      return !hasNonAdminWorkspace;
    } catch (error) {
      console.error('Error checking workspace creation need:', error);
      return true; // Default to requiring workspace creation on error
    }
  },
};

