-- ============================================
-- FIX INFINITE RECURSION IN WORKSPACES RLS POLICIES
-- ============================================
-- ROOT CAUSE: Circular dependency between workspaces and workspace_members RLS policies
-- 
-- The workspaces SELECT policy (006_workspaces_schema.sql line 57-67) checks workspace_members.
-- The workspace_members SELECT policy (009_fix_workspace_members_rls.sql line 18-39) checks workspaces.
-- This creates infinite recursion: workspaces -> workspace_members -> workspaces -> ...
--
-- SOLUTION: Use SECURITY DEFINER function to bypass RLS when checking membership,
-- or restructure the policy to avoid the circular check.

-- Drop the problematic workspaces SELECT policy
DROP POLICY IF EXISTS "Users can view workspaces they are members of" ON workspaces;

-- Create a helper function that bypasses RLS to check membership (breaks recursion)
CREATE OR REPLACE FUNCTION check_workspace_membership(workspace_uuid UUID, user_uuid UUID)
RETURNS BOOLEAN AS $$
BEGIN
  -- This function runs with SECURITY DEFINER, bypassing RLS
  -- to avoid infinite recursion when checking membership
  RETURN EXISTS (
    SELECT 1 FROM workspace_members
    WHERE workspace_id = workspace_uuid
    AND user_id::text = user_uuid::text
    AND status = 'active'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create a new SELECT policy that uses the helper function to break recursion
CREATE POLICY "Users can view workspaces they are members of"
  ON workspaces FOR SELECT
  USING (
    -- Owners can always view their workspaces (direct check, no recursion)
    owner_id::text = auth.uid()::text
    OR
    -- Members can view workspaces - use helper function to avoid RLS recursion
    check_workspace_membership(workspaces.id, auth.uid())
  );

-- Also fix workspace_modules policies to avoid similar recursion
DROP POLICY IF EXISTS "Users can view modules of workspaces they belong to" ON workspace_modules;
DROP POLICY IF EXISTS "Workspace owners/admins can manage modules" ON workspace_modules;

-- Helper function to check if user is workspace owner/admin (bypasses RLS to avoid recursion)
CREATE OR REPLACE FUNCTION check_workspace_admin(workspace_uuid UUID, user_uuid UUID)
RETURNS BOOLEAN AS $$
BEGIN
  -- Check if user is owner
  IF EXISTS (
    SELECT 1 FROM workspaces
    WHERE id = workspace_uuid
    AND owner_id::text = user_uuid::text
  ) THEN
    RETURN TRUE;
  END IF;
  
  -- Check if user is admin/owner member (bypasses RLS)
  RETURN EXISTS (
    SELECT 1 FROM workspace_members
    WHERE workspace_id = workspace_uuid
    AND user_id::text = user_uuid::text
    AND status = 'active'
    AND role IN ('owner', 'admin')
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create workspace_modules SELECT policy using helper functions
CREATE POLICY "Users can view modules of workspaces they belong to"
  ON workspace_modules FOR SELECT
  USING (
    -- Check if user is owner (direct check, no recursion)
    EXISTS (
      SELECT 1 FROM workspaces w
      WHERE w.id = workspace_modules.workspace_id
      AND w.owner_id::text = auth.uid()::text
    )
    OR
    -- Check if user is a member using helper function (bypasses RLS recursion)
    check_workspace_membership(workspace_modules.workspace_id, auth.uid())
  );

-- Create workspace_modules management policy using helper function
CREATE POLICY "Workspace owners/admins can manage modules"
  ON workspace_modules FOR ALL
  USING (
    -- Use helper function to check admin status (bypasses RLS recursion)
    check_workspace_admin(workspace_modules.workspace_id, auth.uid())
  );

COMMENT ON POLICY "Users can view workspaces they are members of" ON workspaces IS 
  'Fixed to prevent infinite recursion by avoiding JOIN with workspace_members that would trigger workspace_members policies';

COMMENT ON POLICY "Users can view modules of workspaces they belong to" ON workspace_modules IS 
  'Fixed to prevent infinite recursion by avoiding circular JOINs between workspaces and workspace_members';

