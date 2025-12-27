-- ============================================
-- ADD WORKSPACE ISOLATION TO EXISTING TABLES
-- ============================================

-- Add workspace_id to saved_sites table for multi-tenant isolation
ALTER TABLE saved_sites 
ADD COLUMN IF NOT EXISTS workspace_id UUID REFERENCES workspaces(id) ON DELETE CASCADE;

-- Add workspace_id to activity_log table for multi-tenant isolation
ALTER TABLE activity_log 
ADD COLUMN IF NOT EXISTS workspace_id UUID REFERENCES workspaces(id) ON DELETE CASCADE;

-- Add workspace_id to campaign_history table for multi-tenant isolation
ALTER TABLE campaign_history 
ADD COLUMN IF NOT EXISTS workspace_id UUID REFERENCES workspaces(id) ON DELETE CASCADE;

-- Add workspace_id to forms table for multi-tenant isolation
ALTER TABLE forms 
ADD COLUMN IF NOT EXISTS workspace_id UUID REFERENCES workspaces(id) ON DELETE CASCADE;

-- Add workspace_id to form_submissions table for multi-tenant isolation
ALTER TABLE form_submissions 
ADD COLUMN IF NOT EXISTS workspace_id UUID REFERENCES workspaces(id) ON DELETE CASCADE;

-- Add workspace_id to vms table for multi-tenant isolation (if exists)
DO $ 
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'vms') THEN
        ALTER TABLE vms 
        ADD COLUMN IF NOT EXISTS workspace_id UUID REFERENCES workspaces(id) ON DELETE CASCADE;
    END IF;
END $;

-- Add workspace_id to vm_billing_records table for multi-tenant isolation (if exists)
DO $ 
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'vm_billing_records') THEN
        ALTER TABLE vm_billing_records 
        ADD COLUMN IF NOT EXISTS workspace_id UUID REFERENCES workspaces(id) ON DELETE CASCADE;
    END IF;
END $;

-- Add workspace_id to vm_usage_tracking table for multi-tenant isolation (if exists)
DO $ 
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'vm_usage_tracking') THEN
        ALTER TABLE vm_usage_tracking 
        ADD COLUMN IF NOT EXISTS workspace_id UUID REFERENCES workspaces(id) ON DELETE CASCADE;
    END IF;
END $;

-- Add workspace_id to billing_accounts table for multi-tenant isolation (if exists)
DO $ 
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'billing_accounts') THEN
        ALTER TABLE billing_accounts 
        ADD COLUMN IF NOT EXISTS workspace_id UUID REFERENCES workspaces(id) ON DELETE CASCADE;
    END IF;
END $;

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_saved_sites_workspace_id ON saved_sites(workspace_id);
CREATE INDEX IF NOT EXISTS idx_activity_log_workspace_id ON activity_log(workspace_id);
CREATE INDEX IF NOT EXISTS idx_campaign_history_workspace_id ON campaign_history(workspace_id);
CREATE INDEX IF NOT EXISTS idx_forms_workspace_id ON forms(workspace_id);
CREATE INDEX IF NOT EXISTS idx_form_submissions_workspace_id ON form_submissions(workspace_id);

-- Create indexes for VM tables if they exist
DO $ 
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'vms') THEN
        CREATE INDEX IF NOT EXISTS idx_vms_workspace_id ON vms(workspace_id);
    END IF;
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'vm_billing_records') THEN
        CREATE INDEX IF NOT EXISTS idx_vm_billing_records_workspace_id ON vm_billing_records(workspace_id);
    END IF;
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'vm_usage_tracking') THEN
        CREATE INDEX IF NOT EXISTS idx_vm_usage_tracking_workspace_id ON vm_usage_tracking(workspace_id);
    END IF;
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'billing_accounts') THEN
        CREATE INDEX IF NOT EXISTS idx_billing_accounts_workspace_id ON billing_accounts(workspace_id);
    END IF;
END $;

-- Update RLS policies for saved_sites
DROP POLICY IF EXISTS "Users can view their own saved sites" ON saved_sites;
DROP POLICY IF EXISTS "Users can insert their own saved sites" ON saved_sites;
DROP POLICY IF EXISTS "Users can update their own saved sites" ON saved_sites;
DROP POLICY IF EXISTS "Users can delete their own saved sites" ON saved_sites;

CREATE POLICY "Users can view saved sites in their workspaces"
  ON saved_sites FOR SELECT
  USING (
    user_id::text = auth.uid()::text AND
    (workspace_id IS NULL OR EXISTS (
      SELECT 1 FROM workspace_members wm
      WHERE wm.workspace_id = saved_sites.workspace_id
      AND wm.user_id::text = auth.uid()::text
      AND wm.status = 'active'
    ))
  );

CREATE POLICY "Users can insert saved sites in their workspaces"
  ON saved_sites FOR INSERT
  WITH CHECK (
    user_id::text = auth.uid()::text AND
    (workspace_id IS NULL OR EXISTS (
      SELECT 1 FROM workspace_members wm
      WHERE wm.workspace_id = saved_sites.workspace_id
      AND wm.user_id::text = auth.uid()::text
      AND wm.status = 'active'
    ))
  );

CREATE POLICY "Users can update saved sites in their workspaces"
  ON saved_sites FOR UPDATE
  USING (
    user_id::text = auth.uid()::text AND
    (workspace_id IS NULL OR EXISTS (
      SELECT 1 FROM workspace_members wm
      WHERE wm.workspace_id = saved_sites.workspace_id
      AND wm.user_id::text = auth.uid()::text
      AND wm.status = 'active'
    ))
  );

CREATE POLICY "Users can delete saved sites in their workspaces"
  ON saved_sites FOR DELETE
  USING (
    user_id::text = auth.uid()::text AND
    (workspace_id IS NULL OR EXISTS (
      SELECT 1 FROM workspace_members wm
      WHERE wm.workspace_id = saved_sites.workspace_id
      AND wm.user_id::text = auth.uid()::text
      AND wm.status = 'active'
    ))
  );

-- Update RLS policies for activity_log
DROP POLICY IF EXISTS "Users can view their own activity log" ON activity_log;
DROP POLICY IF EXISTS "Users can insert their own activity log" ON activity_log;

CREATE POLICY "Users can view activity log in their workspaces"
  ON activity_log FOR SELECT
  USING (
    user_id::text = auth.uid()::text AND
    (workspace_id IS NULL OR EXISTS (
      SELECT 1 FROM workspace_members wm
      WHERE wm.workspace_id = activity_log.workspace_id
      AND wm.user_id::text = auth.uid()::text
      AND wm.status = 'active'
    ))
  );

CREATE POLICY "Users can insert activity log in their workspaces"
  ON activity_log FOR INSERT
  WITH CHECK (
    user_id::text = auth.uid()::text AND
    (workspace_id IS NULL OR EXISTS (
      SELECT 1 FROM workspace_members wm
      WHERE wm.workspace_id = activity_log.workspace_id
      AND wm.user_id::text = auth.uid()::text
      AND wm.status = 'active'
    ))
  );

-- Update RLS policies for campaign_history
DROP POLICY IF EXISTS "Users can view their own campaign history" ON campaign_history;
DROP POLICY IF EXISTS "Users can insert their own campaign history" ON campaign_history;
DROP POLICY IF EXISTS "Users can update their own campaign history" ON campaign_history;
DROP POLICY IF EXISTS "Users can delete their own campaign history" ON campaign_history;

CREATE POLICY "Users can view campaign history in their workspaces"
  ON campaign_history FOR SELECT
  USING (
    user_id::text = auth.uid()::text AND
    (workspace_id IS NULL OR EXISTS (
      SELECT 1 FROM workspace_members wm
      WHERE wm.workspace_id = campaign_history.workspace_id
      AND wm.user_id::text = auth.uid()::text
      AND wm.status = 'active'
    ))
  );

CREATE POLICY "Users can insert campaign history in their workspaces"
  ON campaign_history FOR INSERT
  WITH CHECK (
    user_id::text = auth.uid()::text AND
    (workspace_id IS NULL OR EXISTS (
      SELECT 1 FROM workspace_members wm
      WHERE wm.workspace_id = campaign_history.workspace_id
      AND wm.user_id::text = auth.uid()::text
      AND wm.status = 'active'
    ))
  );

CREATE POLICY "Users can update campaign history in their workspaces"
  ON campaign_history FOR UPDATE
  USING (
    user_id::text = auth.uid()::text AND
    (workspace_id IS NULL OR EXISTS (
      SELECT 1 FROM workspace_members wm
      WHERE wm.workspace_id = campaign_history.workspace_id
      AND wm.user_id::text = auth.uid()::text
      AND wm.status = 'active'
    ))
  );

CREATE POLICY "Users can delete campaign history in their workspaces"
  ON campaign_history FOR DELETE
  USING (
    user_id::text = auth.uid()::text AND
    (workspace_id IS NULL OR EXISTS (
      SELECT 1 FROM workspace_members wm
      WHERE wm.workspace_id = campaign_history.workspace_id
      AND wm.user_id::text = auth.uid()::text
      AND wm.status = 'active'
    ))
  );

-- Update RLS policies for forms
DROP POLICY IF EXISTS "Users can view their own forms" ON forms;
DROP POLICY IF EXISTS "Users can insert their own forms" ON forms;
DROP POLICY IF EXISTS "Users can update their own forms" ON forms;
DROP POLICY IF EXISTS "Users can delete their own forms" ON forms;

CREATE POLICY "Users can view forms in their workspaces"
  ON forms FOR SELECT
  USING (
    user_id::text = auth.uid()::text AND
    (workspace_id IS NULL OR EXISTS (
      SELECT 1 FROM workspace_members wm
      WHERE wm.workspace_id = forms.workspace_id
      AND wm.user_id::text = auth.uid()::text
      AND wm.status = 'active'
    ))
  );

CREATE POLICY "Users can insert forms in their workspaces"
  ON forms FOR INSERT
  WITH CHECK (
    user_id::text = auth.uid()::text AND
    (workspace_id IS NULL OR EXISTS (
      SELECT 1 FROM workspace_members wm
      WHERE wm.workspace_id = forms.workspace_id
      AND wm.user_id::text = auth.uid()::text
      AND wm.status = 'active'
    ))
  );

CREATE POLICY "Users can update forms in their workspaces"
  ON forms FOR UPDATE
  USING (
    user_id::text = auth.uid()::text AND
    (workspace_id IS NULL OR EXISTS (
      SELECT 1 FROM workspace_members wm
      WHERE wm.workspace_id = forms.workspace_id
      AND wm.user_id::text = auth.uid()::text
      AND wm.status = 'active'
    ))
  );

CREATE POLICY "Users can delete forms in their workspaces"
  ON forms FOR DELETE
  USING (
    user_id::text = auth.uid()::text AND
    (workspace_id IS NULL OR EXISTS (
      SELECT 1 FROM workspace_members wm
      WHERE wm.workspace_id = forms.workspace_id
      AND wm.user_id::text = auth.uid()::text
      AND wm.status = 'active'
    ))
  );

-- Function to migrate existing data to current workspace
-- This should be run after deployment to assign existing user data to their admin workspace
CREATE OR REPLACE FUNCTION migrate_user_data_to_workspaces()
RETURNS void AS $
DECLARE
  user_record RECORD;
  admin_workspace_id UUID;
BEGIN
  -- For each user, find their admin workspace and assign their data to it
  FOR user_record IN 
    SELECT DISTINCT u.id as user_id
    FROM users u
    WHERE EXISTS (
      SELECT 1 FROM workspaces w 
      WHERE w.owner_id = u.id AND w.is_admin_workspace = true
    )
  LOOP
    -- Get the user's admin workspace
    SELECT id INTO admin_workspace_id
    FROM workspaces 
    WHERE owner_id = user_record.user_id AND is_admin_workspace = true
    LIMIT 1;
    
    IF admin_workspace_id IS NOT NULL THEN
      -- Update saved_sites
      UPDATE saved_sites 
      SET workspace_id = admin_workspace_id 
      WHERE user_id = user_record.user_id AND workspace_id IS NULL;
      
      -- Update activity_log
      UPDATE activity_log 
      SET workspace_id = admin_workspace_id 
      WHERE user_id = user_record.user_id AND workspace_id IS NULL;
      
      -- Update campaign_history
      UPDATE campaign_history 
      SET workspace_id = admin_workspace_id 
      WHERE user_id = user_record.user_id AND workspace_id IS NULL;
      
      -- Update forms
      UPDATE forms 
      SET workspace_id = admin_workspace_id 
      WHERE user_id = user_record.user_id AND workspace_id IS NULL;
      
      -- Update form_submissions (via forms relationship)
      UPDATE form_submissions 
      SET workspace_id = admin_workspace_id 
      WHERE workspace_id IS NULL AND form_id IN (
        SELECT id FROM forms WHERE user_id = user_record.user_id
      );
      
      -- Update VM tables if they exist
      IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'vms') THEN
        EXECUTE 'UPDATE vms SET workspace_id = $1 WHERE user_id = $2 AND workspace_id IS NULL' 
        USING admin_workspace_id, user_record.user_id;
      END IF;
      
      IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'billing_accounts') THEN
        EXECUTE 'UPDATE billing_accounts SET workspace_id = $1 WHERE user_id = $2 AND workspace_id IS NULL' 
        USING admin_workspace_id, user_record.user_id;
      END IF;
    END IF;
  END LOOP;
END;
$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON FUNCTION migrate_user_data_to_workspaces() IS 'Migrates existing user data to their admin workspaces for multi-tenant isolation';