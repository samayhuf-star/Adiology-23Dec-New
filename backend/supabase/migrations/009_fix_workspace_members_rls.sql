-- ============================================
-- FIX WORKSPACE_MEMBERS RLS POLICIES
-- ============================================
-- This fixes the infinite recursion issue in the workspace_members policies
-- The original policies required users to be members to manage members, which created
-- a circular dependency when creating a new workspace (owner can't add themselves)

-- Drop the existing policies
DROP POLICY IF EXISTS "Users can view members of workspaces they belong to" ON workspace_members;
DROP POLICY IF EXISTS "Workspace owners/admins can add members" ON workspace_members;
DROP POLICY IF EXISTS "Workspace owners/admins can update members" ON workspace_members;
DROP POLICY IF EXISTS "Workspace owners can remove members" ON workspace_members;

-- Create a new SELECT policy that allows:
-- 1. Users to view their own membership
-- 2. Workspace owners (from workspaces table) to view all members
-- 3. Existing workspace members with owner/admin role to view members
CREATE POLICY "Users can view members of workspaces they belong to"
  ON workspace_members FOR SELECT
  USING (
    -- Users can view their own membership
    user_id::text = auth.uid()::text
    OR
    -- Workspace owners can view all members
    EXISTS (
      SELECT 1 FROM workspaces w
      WHERE w.id = workspace_members.workspace_id
      AND w.owner_id::text = auth.uid()::text
    )
    OR
    -- Existing workspace members with owner/admin role can view members
    EXISTS (
      SELECT 1 FROM workspace_members wm
      WHERE wm.workspace_id = workspace_members.workspace_id
      AND wm.user_id::text = auth.uid()::text
      AND wm.status = 'active'
      AND wm.role IN ('owner', 'admin')
    )
  );

-- Create a new INSERT policy that allows:
-- 1. Workspace owners (from workspaces table) to add members (for initial setup)
-- 2. Existing workspace members with owner/admin role to add members
CREATE POLICY "Workspace owners/admins can add members"
  ON workspace_members FOR INSERT
  WITH CHECK (
    -- Allow workspace owners to add members (for initial workspace creation)
    EXISTS (
      SELECT 1 FROM workspaces w
      WHERE w.id = workspace_members.workspace_id
      AND w.owner_id::text = auth.uid()::text
    )
    OR
    -- Allow existing workspace members with owner/admin role to add members
    EXISTS (
      SELECT 1 FROM workspace_members wm
      WHERE wm.workspace_id = workspace_members.workspace_id
      AND wm.user_id::text = auth.uid()::text
      AND wm.status = 'active'
      AND wm.role IN ('owner', 'admin')
    )
  );

-- Create a new UPDATE policy that allows:
-- 1. Workspace owners (from workspaces table) to update members
-- 2. Existing workspace members with owner/admin role to update members
CREATE POLICY "Workspace owners/admins can update members"
  ON workspace_members FOR UPDATE
  USING (
    -- Allow workspace owners to update members
    EXISTS (
      SELECT 1 FROM workspaces w
      WHERE w.id = workspace_members.workspace_id
      AND w.owner_id::text = auth.uid()::text
    )
    OR
    -- Allow existing workspace members with owner/admin role to update members
    EXISTS (
      SELECT 1 FROM workspace_members wm
      WHERE wm.workspace_id = workspace_members.workspace_id
      AND wm.user_id::text = auth.uid()::text
      AND wm.status = 'active'
      AND wm.role IN ('owner', 'admin')
    )
  );

-- Create a new DELETE policy that allows:
-- 1. Workspace owners (from workspaces table) to remove members
-- 2. Existing workspace owners to remove members
CREATE POLICY "Workspace owners can remove members"
  ON workspace_members FOR DELETE
  USING (
    -- Allow workspace owners to remove members
    EXISTS (
      SELECT 1 FROM workspaces w
      WHERE w.id = workspace_members.workspace_id
      AND w.owner_id::text = auth.uid()::text
    )
    OR
    -- Allow existing workspace owners to remove members
    EXISTS (
      SELECT 1 FROM workspace_members wm
      WHERE wm.workspace_id = workspace_members.workspace_id
      AND wm.user_id::text = auth.uid()::text
      AND wm.status = 'active'
      AND wm.role = 'owner'
    )
  );

