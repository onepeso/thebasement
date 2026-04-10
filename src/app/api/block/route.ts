import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

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

    const { blocked_user_id } = await request.json();

    if (!blocked_user_id) {
      return NextResponse.json({ error: 'Missing blocked_user_id' }, { status: 400 });
    }

    if (blocked_user_id === userId) {
      return NextResponse.json({ error: 'Cannot block yourself' }, { status: 400 });
    }

    const supabase = createSupabaseClient(token);

    const { error } = await supabase
      .from('blocked_users')
      .insert({
        user_id: userId,
        blocked_user_id,
      });

    if (error) {
      if (error.code === '23505') {
        return NextResponse.json({ error: 'User already blocked' }, { status: 409 });
      }
      console.error('Error blocking user:', error);
      return NextResponse.json({ error: 'Failed to block user' }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Block error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
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

    const { blocked_user_id } = await request.json();

    if (!blocked_user_id) {
      return NextResponse.json({ error: 'Missing blocked_user_id' }, { status: 400 });
    }

    const supabase = createSupabaseClient(token);

    const { error } = await supabase
      .from('blocked_users')
      .delete()
      .eq('user_id', userId)
      .eq('blocked_user_id', blocked_user_id);

    if (error) {
      console.error('Error unblocking user:', error);
      return NextResponse.json({ error: 'Failed to unblock user' }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Unblock error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function GET() {
  return NextResponse.json({ error: 'Not implemented' }, { status: 501 });
}
