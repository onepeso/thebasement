-- Add is_private column to channels
ALTER TABLE channels ADD COLUMN is_private BOOLEAN DEFAULT FALSE;

-- Add visibility column to channel_members for private channel access
ALTER TABLE channel_members ADD COLUMN accepted_at TIMESTAMPTZ DEFAULT NOW();

-- Trigger to auto-add creator as owner when channel is created
CREATE OR REPLACE FUNCTION ensure_channel_creator_member()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO channel_members (channel_id, user_id, role, accepted_at)
  VALUES (NEW.id, NEW.created_by, 'owner', NOW())
  ON CONFLICT DO NOTHING;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS ensure_creator_member ON channels;
CREATE TRIGGER ensure_creator_member
  AFTER INSERT ON channels
  FOR EACH ROW EXECUTE FUNCTION ensure_channel_creator_member();

-- Policy: Only show private channels to members
-- This is handled at the application level for flexibility
-- But you can add RLS policies like this:

-- ALTER TABLE channels ENABLE ROW LEVEL SECURITY;

-- CREATE POLICY "Users can view public channels" ON channels
--   FOR SELECT USING (is_private = FALSE);

-- CREATE POLICY "Members can view their private channels" ON channels
--   FOR SELECT USING (
--     is_private = FALSE OR 
--     id IN (SELECT channel_id FROM channel_members WHERE user_id = auth.uid())
--   );

-- CREATE POLICY "Channel creators can update their channels" ON channels
--   FOR UPDATE USING (created_by = auth.uid());
