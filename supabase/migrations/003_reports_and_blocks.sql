-- Reports table for flagging offensive content/users
CREATE TABLE IF NOT EXISTS reports (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    reporter_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    reported_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    reason TEXT NOT NULL CHECK (reason IN ('spam', 'harassment', 'hate_speech', 'inappropriate', 'other')),
    content_snapshot TEXT,
    message_id UUID REFERENCES messages(id) ON DELETE SET NULL,
    channel_id UUID REFERENCES channels(id) ON DELETE SET NULL,
    status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'reviewed', 'resolved', 'dismissed')),
    reviewed_by UUID REFERENCES auth.users(id),
    reviewed_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    CONSTRAINT no_self_report CHECK (reporter_id != reported_id)
);

-- Blocked users table
CREATE TABLE IF NOT EXISTS blocked_users (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    blocked_user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(user_id, blocked_user_id),
    CONSTRAINT no_self_block CHECK (user_id != blocked_user_id)
);

-- RLS Policies for reports
ALTER TABLE reports ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can create reports" ON reports;
DROP POLICY IF EXISTS "Users can view own reports" ON reports;
DROP POLICY IF EXISTS "Admins can update reports" ON reports;
DROP POLICY IF EXISTS "Users can delete own pending reports" ON reports;

CREATE POLICY "Users can create reports"
ON reports FOR INSERT
TO authenticated
WITH CHECK (reporter_id = auth.uid());

CREATE POLICY "Users can view own reports"
ON reports FOR SELECT
TO authenticated
USING (reporter_id = auth.uid() OR reviewed_by = auth.uid());

CREATE POLICY "Admins can update reports"
ON reports FOR UPDATE
TO authenticated
USING (reviewed_by = auth.uid() OR reviewed_by IS NULL);

CREATE POLICY "Users can delete own pending reports"
ON reports FOR DELETE
TO authenticated
USING (reporter_id = auth.uid() AND status = 'pending');

-- RLS Policies for blocked_users
ALTER TABLE blocked_users ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view own blocked list" ON blocked_users;
DROP POLICY IF EXISTS "Users can block others" ON blocked_users;
DROP POLICY IF EXISTS "Users can unblock" ON blocked_users;

CREATE POLICY "Users can view own blocked list"
ON blocked_users FOR SELECT
TO authenticated
USING (user_id = auth.uid());

CREATE POLICY "Users can block others"
ON blocked_users FOR INSERT
TO authenticated
WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can unblock"
ON blocked_users FOR DELETE
TO authenticated
USING (user_id = auth.uid());

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_reports_reported_id ON reports(reported_id);
CREATE INDEX IF NOT EXISTS idx_reports_status ON reports(status);
CREATE INDEX IF NOT EXISTS idx_reports_created_at ON reports(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_blocked_users_user_id ON blocked_users(user_id);
CREATE INDEX IF NOT EXISTS idx_blocked_users_blocked_user_id ON blocked_users(blocked_user_id);
