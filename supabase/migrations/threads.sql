-- Create threads table for thread metadata
CREATE TABLE IF NOT EXISTS public.threads (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  channel_id UUID REFERENCES channels(id) ON DELETE CASCADE,
  root_message_id UUID REFERENCES messages(id) ON DELETE CASCADE,
  created_by UUID REFERENCES profiles(id),
  created_at TIMESTAMPTZ DEFAULT now(),
  reply_count INT DEFAULT 0,
  last_reply_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(channel_id, root_message_id)
);

-- Add thread_id to messages (null = regular message, set = message in a thread)
ALTER TABLE messages ADD COLUMN IF NOT EXISTS thread_id UUID REFERENCES threads(id) ON DELETE CASCADE;

-- Create indexes for faster lookups
CREATE INDEX IF NOT EXISTS idx_messages_thread_id ON messages(thread_id);
CREATE INDEX IF NOT EXISTS idx_threads_channel ON threads(channel_id);
CREATE INDEX IF NOT EXISTS idx_threads_root_message ON threads(root_message_id);

-- RLS policies for threads (only authenticated users can interact)
ALTER TABLE threads ENABLE ROW LEVEL SECURITY;

-- Allow authenticated users to view threads in channels they can access
CREATE POLICY "threads_select" ON threads FOR SELECT TO authenticated USING (true);
CREATE POLICY "threads_insert" ON threads FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "threads_update" ON threads FOR UPDATE TO authenticated USING (true);

-- RLS for thread_id on messages
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;

-- Drop and recreate message policies for thread support
DROP POLICY IF EXISTS "Messages are viewable by channel members" ON messages;
DROP POLICY IF EXISTS "Authenticated users can insert messages" ON messages;
DROP POLICY IF EXISTS "Users can update own messages" ON messages;
DROP POLICY IF EXISTS "Users can delete own messages" ON messages;

CREATE POLICY "messages_select" ON messages FOR SELECT TO authenticated
  USING (
    channel_id IN (SELECT id FROM channels)
    OR thread_id IN (SELECT id FROM threads WHERE channel_id IN (SELECT id FROM channels))
  );

CREATE POLICY "messages_insert" ON messages FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "messages_update" ON messages FOR UPDATE TO authenticated
  USING (auth.uid() = user_id);
CREATE POLICY "messages_delete" ON messages FOR DELETE TO authenticated
  USING (auth.uid() = user_id);
