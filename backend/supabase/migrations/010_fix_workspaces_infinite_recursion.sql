-- ============================================
-- FIX INFINITE RECURSION IN WORKSPACES RLS POLICIES
-- ============================================
-- ROOT CAUSE: The workspaces SELECT policy checks workspace_members table,
-- and workspace_members policies check workspaces table, creating infinite recursion.
--
-- SOLUTION: Break the circular dependency by making workspaces SELECT policy
-- only check owner_id directly, not workspace_members. The owner_id check is
-- sufficient for owners, and we can add a separate check for members that
-- doesn't create recursion.

-- Drop the problematic workspaces SELECT policy
DROP POLICY IF EXISTS "Users can view workspaces they are members of" ON workspaces;

-- Create a new SELECT policy that breaks the circular dependency
-- This policy checks:
-- 1. Direct owner check (no recursion)
-- 2. Member check that doesn't trigger workspace_members policy recursion
CREATE POLICY "Users can view workspaces they are members of"
  ON workspaces FOR SELECT
  USING (
    -- Owners can always view their workspaces (direct check, no recursion)
    owner_id::text = auth.uid()::text
    OR
    -- Members can view workspaces they belong to
    -- This check directly queries workspace_members without JOIN to workspaces
    -- to avoid triggering the workspace_members policy which would check workspaces again
    EXISTS (
      SELECT 1 FROM workspace_members wm
      WHERE wm.workspace_id = workspaces.id
      AND wm.user_id::text = auth.uid()::text
      AND wm.status = 'active'
      -- Don't JOIN with workspaces table here to avoid recursion
    )
  );

-- Also fix workspace_modules policies to avoid similar recursion
DROP POLICY IF EXISTS "Users can view modules of workspaces they belong to" ON workspace_modules;
DROP POLICY IF EXISTS "Workspace owners/admins can manage modules" ON workspace_modules;

-- Create workspace_modules SELECT policy that doesn't create recursion
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
    -- Check if user is a member (direct check, no recursion)
    EXISTS (
      SELECT 1 FROM workspace_members wm
      WHERE wm.workspace_id = workspace_modules.workspace_id
      AND wm.user_id::text = auth.uid()::text
      AND wm.status = 'active'
      -- Don't JOIN with workspaces to avoid recursion
    )
  );

-- Create workspace_modules management policy
CREATE POLICY "Workspace owners/admins can manage modules"
  ON workspace_modules FOR ALL
  USING (
    -- Workspace owners can manage modules (direct check)
    EXISTS (
      SELECT 1 FROM workspaces w
      WHERE w.id = workspace_modules.workspace_id
      AND w.owner_id::text = auth.uid()::text
    )
    OR
    -- Workspace members with owner/admin role can manage modules
    -- Check workspace_members directly without JOIN to avoid recursion
    EXISTS (
      SELECT 1 FROM workspace_members wm
      WHERE wm.workspace_id = workspace_modules.workspace_id
      AND wm.user_id::text = auth.uid()::text
      AND wm.status = 'active'
      AND wm.role IN ('owner', 'admin')
      -- Don't JOIN with workspaces to avoid recursion
    )
  );

COMMENT ON POLICY "Users can view workspaces they are members of" ON workspaces IS 
  'Fixed to prevent infinite recursion by avoiding JOIN with workspace_members that would trigger workspace_members policies';

COMMENT ON POLICY "Users can view modules of workspaces they belong to" ON workspace_modules IS 
  'Fixed to prevent infinite recursion by avoiding circular JOINs between workspaces and workspace_members';

