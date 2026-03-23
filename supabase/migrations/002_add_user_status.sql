-- Add status field to profiles table
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'online';

-- Add index for faster queries
CREATE INDEX IF NOT EXISTS idx_profiles_status ON profiles(status);
