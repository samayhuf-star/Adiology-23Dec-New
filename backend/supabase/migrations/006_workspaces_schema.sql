-- ============================================
-- WORKSPACES SCHEMA
-- ============================================

-- Workspaces table
CREATE TABLE IF NOT EXISTS workspaces (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT,
  owner_id UUID REFERENCES users(id) ON DELETE CASCADE NOT NULL,
  is_admin_workspace BOOLEAN DEFAULT FALSE, -- True for the default admin workspace
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Workspace members table (many-to-many relationship)
CREATE TABLE IF NOT EXISTS workspace_members (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id UUID REFERENCES workspaces(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES users(id) ON DELETE CASCADE NOT NULL,
  role TEXT DEFAULT 'member' CHECK (role IN ('owner', 'admin', 'member')),
  invited_by UUID REFERENCES users(id) ON DELETE SET NULL,
  invited_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  joined_at TIMESTAMP WITH TIME ZONE,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'active', 'declined')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(workspace_id, user_id)
);

-- Workspace modules table (defines which modules are accessible in a workspace)
CREATE TABLE IF NOT EXISTS workspace_modules (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id UUID REFERENCES workspaces(id) ON DELETE CASCADE NOT NULL,
  module_name TEXT NOT NULL, -- e.g., 'dashboard', 'campaign-wizard', 'keywords', 'settings', 'support', 'help', 'ticket'
  enabled BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(workspace_id, module_name)
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_workspaces_owner_id ON workspaces(owner_id);
CREATE INDEX IF NOT EXISTS idx_workspaces_is_admin ON workspaces(is_admin_workspace);
CREATE INDEX IF NOT EXISTS idx_workspace_members_workspace_id ON workspace_members(workspace_id);
CREATE INDEX IF NOT EXISTS idx_workspace_members_user_id ON workspace_members(user_id);
CREATE INDEX IF NOT EXISTS idx_workspace_members_status ON workspace_members(status);
CREATE INDEX IF NOT EXISTS idx_workspace_modules_workspace_id ON workspace_modules(workspace_id);
CREATE INDEX IF NOT EXISTS idx_workspace_modules_module_name ON workspace_modules(module_name);

-- Enable RLS
ALTER TABLE workspaces ENABLE ROW LEVEL SECURITY;
ALTER TABLE workspace_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE workspace_modules ENABLE ROW LEVEL SECURITY;

-- RLS Policies for workspaces
CREATE POLICY "Users can view workspaces they are members of"
  ON workspaces FOR SELECT
  USING (
    owner_id::text = auth.uid()::text OR
    EXISTS (
      SELECT 1 FROM workspace_members
      WHERE workspace_members.workspace_id = workspaces.id
      AND workspace_members.user_id::text = auth.uid()::text
      AND workspace_members.status = 'active'
    )
  );

CREATE POLICY "Owners can create workspaces"
  ON workspaces FOR INSERT
  WITH CHECK (owner_id::text = auth.uid()::text);

CREATE POLICY "Owners can update their workspaces"
  ON workspaces FOR UPDATE
  USING (owner_id::text = auth.uid()::text);

CREATE POLICY "Owners can delete their workspaces"
  ON workspaces FOR DELETE
  USING (owner_id::text = auth.uid()::text);

-- RLS Policies for workspace_members
CREATE POLICY "Users can view members of workspaces they belong to"
  ON workspace_members FOR SELECT
  USING (
    user_id::text = auth.uid()::text OR
    EXISTS (
      SELECT 1 FROM workspace_members wm
      JOIN workspaces w ON w.id = wm.workspace_id
      WHERE wm.workspace_id = workspace_members.workspace_id
      AND wm.user_id::text = auth.uid()::text
      AND wm.status = 'active'
      AND wm.role IN ('owner', 'admin')
    )
  );

CREATE POLICY "Workspace owners/admins can add members"
  ON workspace_members FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM workspace_members wm
      WHERE wm.workspace_id = workspace_members.workspace_id
      AND wm.user_id::text = auth.uid()::text
      AND wm.status = 'active'
      AND wm.role IN ('owner', 'admin')
    )
  );

CREATE POLICY "Workspace owners/admins can update members"
  ON workspace_members FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM workspace_members wm
      WHERE wm.workspace_id = workspace_members.workspace_id
      AND wm.user_id::text = auth.uid()::text
      AND wm.status = 'active'
      AND wm.role IN ('owner', 'admin')
    )
  );

CREATE POLICY "Users can update their own membership status"
  ON workspace_members FOR UPDATE
  USING (user_id::text = auth.uid()::text);

CREATE POLICY "Workspace owners can remove members"
  ON workspace_members FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM workspace_members wm
      WHERE wm.workspace_id = workspace_members.workspace_id
      AND wm.user_id::text = auth.uid()::text
      AND wm.status = 'active'
      AND wm.role = 'owner'
    )
  );

-- RLS Policies for workspace_modules
CREATE POLICY "Users can view modules of workspaces they belong to"
  ON workspace_modules FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM workspace_members wm
      WHERE wm.workspace_id = workspace_modules.workspace_id
      AND wm.user_id::text = auth.uid()::text
      AND wm.status = 'active'
    )
  );

CREATE POLICY "Workspace owners/admins can manage modules"
  ON workspace_modules FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM workspace_members wm
      WHERE wm.workspace_id = workspace_modules.workspace_id
      AND wm.user_id::text = auth.uid()::text
      AND wm.status = 'active'
      AND wm.role IN ('owner', 'admin')
    )
  );

-- Triggers for updated_at
CREATE TRIGGER update_workspaces_updated_at BEFORE UPDATE ON workspaces
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_workspace_members_updated_at BEFORE UPDATE ON workspace_members
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_workspace_modules_updated_at BEFORE UPDATE ON workspace_modules
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Function to create default admin workspace for a user
CREATE OR REPLACE FUNCTION create_admin_workspace(user_uuid UUID)
RETURNS UUID AS $$
DECLARE
  workspace_uuid UUID;
BEGIN
  -- Create admin workspace
  INSERT INTO workspaces (name, owner_id, is_admin_workspace, description)
  VALUES ('Admin Workspace', user_uuid, TRUE, 'Default workspace with access to all modules')
  RETURNING id INTO workspace_uuid;

  -- Add owner as member
  INSERT INTO workspace_members (workspace_id, user_id, role, status, joined_at)
  VALUES (workspace_uuid, user_uuid, 'owner', 'active', NOW());

  -- Add all default modules
  INSERT INTO workspace_modules (workspace_id, module_name, enabled)
  VALUES
    (workspace_uuid, 'dashboard', TRUE),
    (workspace_uuid, 'campaign-wizard', TRUE),
    (workspace_uuid, 'one-click-builder', TRUE),
    (workspace_uuid, 'keywords', TRUE),
    (workspace_uuid, 'settings', TRUE),
    (workspace_uuid, 'support', TRUE),
    (workspace_uuid, 'help', TRUE),
    (workspace_uuid, 'ticket', TRUE),
    (workspace_uuid, 'billing', TRUE),
    (workspace_uuid, 'analytics', TRUE),
    (workspace_uuid, 'templates', TRUE),
    (workspace_uuid, 'websites', TRUE);

  RETURN workspace_uuid;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get user's current workspace (for context)
CREATE OR REPLACE FUNCTION get_user_workspaces(user_uuid UUID)
RETURNS TABLE (
  id UUID,
  name TEXT,
  description TEXT,
  is_admin_workspace BOOLEAN,
  role TEXT,
  member_count BIGINT,
  created_at TIMESTAMP WITH TIME ZONE
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    w.id,
    w.name,
    w.description,
    w.is_admin_workspace,
    COALESCE(wm.role, 'owner') as role,
    (SELECT COUNT(*) FROM workspace_members WHERE workspace_id = w.id AND status = 'active') as member_count,
    w.created_at
  FROM workspaces w
  LEFT JOIN workspace_members wm ON wm.workspace_id = w.id AND wm.user_id::text = user_uuid::text AND wm.status = 'active'
  WHERE w.owner_id::text = user_uuid::text OR wm.user_id::text = user_uuid::text
  ORDER BY w.is_admin_workspace DESC, w.created_at DESC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON TABLE workspaces IS 'Workspaces for organizing users and module access';
COMMENT ON TABLE workspace_members IS 'Membership relationship between users and workspaces';
COMMENT ON TABLE workspace_modules IS 'Module access control for workspaces';

