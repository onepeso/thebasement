import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
const ADMIN_USER_ID = process.env.ADMIN_USER_ID;

function createSupabaseClient(token: string) {
  return createClient(supabaseUrl, supabaseAnonKey, {
    global: {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    },
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
  });
}

async function getUserIdFromToken(token: string): Promise<string | null> {
  try {
    const parts = token.split('.');
    if (parts.length !== 3) return null;
    
    const payload = JSON.parse(atob(parts[1]));
    return payload.sub || null;
  } catch {
    return null;
  }
}

function isAdminUser(userId?: string) {
  return userId === ADMIN_USER_ID;
}

export async function POST(request: NextRequest) {
  try {
    const authHeader = request.headers.get('Authorization');
    if (!authHeader) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const token = authHeader.replace('Bearer ', '');
    const userId = await getUserIdFromToken(token);
    
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { reported_id, reason, content_snapshot, message_id, channel_id } = await request.json();

    if (!reported_id || !reason) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    if (reported_id === userId) {
      return NextResponse.json({ error: 'Cannot report yourself' }, { status: 400 });
    }

    const validReasons = ['spam', 'harassment', 'hate_speech', 'inappropriate', 'csam', 'other'];
    if (!validReasons.includes(reason)) {
      return NextResponse.json({ error: 'Invalid reason' }, { status: 400 });
    }

    const supabase = createSupabaseClient(token);
    const { data, error } = await supabase
      .from('reports')
      .insert({
        reporter_id: userId,
        reported_id,
        reason,
        content_snapshot,
        message_id,
        channel_id,
      })
      .select()
      .single();

    if (error) {
      console.error('Error creating report:', error);
      return NextResponse.json({ error: 'Failed to create report' }, { status: 500 });
    }

    return NextResponse.json({ success: true, report: data });
  } catch (error) {
    console.error('Report error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function GET(request: NextRequest) {
  try {
    const authHeader = request.headers.get('Authorization');
    if (!authHeader) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const token = authHeader.replace('Bearer ', '');
    const userId = await getUserIdFromToken(token);
    
    if (!userId || !isAdminUser(userId)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const supabase = createSupabaseClient(token);
    
    const { data: reports, error } = await supabase
      .from('reports')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching reports:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    const reporterIds = reports?.map(r => r.reporter_id) || [];
    const reportedIds = reports?.map(r => r.reported_id) || [];
    const allIds = [...new Set([...reporterIds, ...reportedIds])];

    const { data: profiles } = await supabase
      .from('profiles')
      .select('id, username')
      .in('id', allIds);

    const profileMap: Record<string, string> = {};
    profiles?.forEach(p => {
      profileMap[p.id] = p.username;
    });

    const reportsWithNames = reports?.map(r => ({
      ...r,
      reporter_name: profileMap[r.reporter_id] || r.reporter_id,
      reported_name: profileMap[r.reported_id] || r.reported_id,
    })) || [];

    return NextResponse.json({ reports: reportsWithNames });
  } catch (error) {
    console.error('Reports fetch error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const authHeader = request.headers.get('Authorization');
    if (!authHeader) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const token = authHeader.replace('Bearer ', '');
    const userId = await getUserIdFromToken(token);
    
    if (!userId || !isAdminUser(userId)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { report_id, action } = await request.json();
    
    if (!report_id || !action) {
      return NextResponse.json({ error: 'Missing report_id or action' }, { status: 400 });
    }

    const supabase = createSupabaseClient(token);
    
    const status = action === 'dismiss' ? 'dismissed' : 
                   action === 'resolve' ? 'resolved' : 
                   action === 'review' ? 'reviewed' : null;
    
    if (!status) {
      return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
    }

    const { error } = await supabase
      .from('reports')
      .update({ 
        status,
        reviewed_at: new Date().toISOString(),
      })
      .eq('id', report_id);

    if (error) {
      console.error('Error updating report:', error);
      return NextResponse.json({ error: 'Failed to update report' }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Report update error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
