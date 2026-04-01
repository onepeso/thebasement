-- Table to store user notifications
CREATE TABLE user_notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('mention', 'invite', 'system')),
  title TEXT NOT NULL,
  body TEXT NOT NULL,
  channel_id UUID REFERENCES channels(id) ON DELETE CASCADE,
  message_id UUID REFERENCES messages(id) ON DELETE CASCADE,
  read BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX idx_user_notifications_user_id ON user_notifications(user_id);
CREATE INDEX idx_user_notifications_read ON user_notifications(user_id, read);

-- Trigger function to create notification on mention
CREATE OR REPLACE FUNCTION create_mention_notification()
RETURNS TRIGGER AS $$
DECLARE
  sender_username TEXT;
  channel_name TEXT;
  mentioned_username TEXT;
  mentioned_user_id UUID;
BEGIN
  -- Get sender username
  SELECT username INTO sender_username FROM profiles WHERE id = NEW.user_id;
  
  -- Get channel name
  SELECT name INTO channel_name FROM channels WHERE id = NEW.channel_id;
  
  -- Find mentioned users in the message
  -- This regex finds all @username patterns
  FOR mentioned_username IN 
    SELECT (REGEXP_MATCHES(NEW.text, '@([a-zA-Z0-9_]+)', 'g'))[1]
  LOOP
    -- Find the user by username
    SELECT id INTO mentioned_user_id FROM profiles WHERE username = mentioned_username;
    
    -- Don't notify yourself
    IF mentioned_user_id IS NOT NULL AND mentioned_user_id != NEW.user_id THEN
      -- Insert notification
      INSERT INTO user_notifications (user_id, type, title, body, channel_id, message_id)
      VALUES (
        mentioned_user_id,
        'mention',
        sender_username || ' mentioned you',
        '#' || channel_name || ': ' || LEFT(NEW.text, 100),
        NEW.channel_id,
        NEW.id
      );
    END IF;
  END LOOP;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger on messages table
DROP TRIGGER IF EXISTS create_mention_notif_trigger ON messages;
CREATE TRIGGER create_mention_notif_trigger
  AFTER INSERT ON messages
  FOR EACH ROW EXECUTE FUNCTION create_mention_notification();
