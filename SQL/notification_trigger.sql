-- Enable pg_net extension for HTTP requests (if not already enabled)
CREATE EXTENSION IF NOT EXISTS "pg_net";

-- Create a function to handle new message notifications
CREATE OR REPLACE FUNCTION notify_on_new_message()
RETURNS TRIGGER AS $$
DECLARE
  sender_username TEXT;
  channel_name TEXT;
  mentioned_users TEXT[];
  mention_found BOOLEAN;
BEGIN
  -- Get sender username
  SELECT username INTO sender_username FROM profiles WHERE id = NEW.user_id;
  
  -- Get channel name
  SELECT name INTO channel_name FROM channels WHERE id = NEW.channel_id;
  
  -- Check for mentions in the message
  mentioned_users := ARRAY(
    SELECT UNNEST(REGEXP_MATCHES(NEW.text, '@([a-zA-Z0-9_]+)', 'g'))
  );
  
  -- For each mentioned user, you would typically:
  -- 1. Check if they're a member of the channel
  -- 2. Check their notification settings
  -- 3. Send a push notification via a webhook/edge function
  
  -- For now, we'll just log it (in production, you'd integrate with a notification service)
  RAISE NOTICE 'New message in #% by % mentioning: %', channel_name, sender_username, mentioned_users;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger on messages table
DROP TRIGGER IF EXISTS on_new_message ON messages;
CREATE TRIGGER on_new_message
  AFTER INSERT ON messages
  FOR EACH ROW EXECUTE FUNCTION notify_on_new_message();

-- To properly notify offline users, you would create a Supabase Edge Function
-- that gets called by a webhook. Here's the setup for that:

-- 1. Create an Edge Function (run in terminal):
--    npx supabase functions new send-notification

-- 2. The Edge Function would use Firebase Cloud Messaging or similar
--    to send push notifications to users who are offline

-- 3. You can use Supabase's database webhooks to trigger the edge function:
--    (Configure in Supabase Dashboard > Database > Webhooks)
