-- Table for user notification settings
CREATE TABLE notification_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID UNIQUE REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  mentions BOOLEAN DEFAULT TRUE,
  invites BOOLEAN DEFAULT TRUE,
  sound BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create a function to ensure notification settings exist for new users
CREATE OR REPLACE FUNCTION create_notification_settings()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO notification_settings (user_id)
  VALUES (NEW.id)
  ON CONFLICT (user_id) DO NOTHING;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to create notification settings for new users
DROP TRIGGER IF EXISTS on_new_user_notification_settings ON profiles;
CREATE TRIGGER on_new_user_notification_settings
  AFTER INSERT ON profiles
  FOR EACH ROW EXECUTE FUNCTION create_notification_settings();

-- Create notification settings for existing users
INSERT INTO notification_settings (user_id, mentions, invites, sound)
SELECT id, TRUE, TRUE, TRUE
FROM profiles
WHERE id NOT IN (SELECT user_id FROM notification_settings);
