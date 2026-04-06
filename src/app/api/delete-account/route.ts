import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export async function POST(request: Request) {
  try {
    const { userId } = await request.json();

    if (!userId) {
      return NextResponse.json(
        { error: 'User ID is required' },
        { status: 400 }
      );
    }

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!supabaseUrl || !serviceRoleKey) {
      console.error('Missing Supabase configuration');
      return NextResponse.json(
        { error: 'Server configuration error' },
        { status: 500 }
      );
    }

    const supabaseAdmin = createClient(supabaseUrl, serviceRoleKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      }
    });

    const deletionLog = {
      user_id: userId,
      deleted_at: new Date().toISOString(),
      items_deleted: [] as string[]
    };

    try {
      const { error: messagesError } = await supabaseAdmin
        .from('messages')
        .delete()
        .eq('user_id', userId);
      
      if (messagesError) {
        console.error('Error deleting messages:', messagesError);
      } else {
        deletionLog.items_deleted.push('messages');
      }
    } catch (err) {
      console.error('Messages deletion failed:', err);
    }

    try {
      const { error: membershipsError } = await supabaseAdmin
        .from('channel_members')
        .delete()
        .eq('user_id', userId);
      
      if (membershipsError) {
        console.error('Error deleting memberships:', membershipsError);
      } else {
        deletionLog.items_deleted.push('channel_memberships');
      }
    } catch (err) {
      console.error('Memberships deletion failed:', err);
    }

    try {
      const { error: profileError } = await supabaseAdmin
        .from('profiles')
        .delete()
        .eq('id', userId);
      
      if (profileError) {
        console.error('Error deleting profile:', profileError);
      } else {
        deletionLog.items_deleted.push('profile');
      }
    } catch (err) {
      console.error('Profile deletion failed:', err);
    }

    try {
      const { error: invitesError } = await supabaseAdmin
        .from('invites')
        .delete()
        .or(`inviter_id.eq.${userId},invited_user_id.eq.${userId}`);
      
      if (invitesError) {
        console.error('Error deleting invites:', invitesError);
      } else {
        deletionLog.items_deleted.push('invites');
      }
    } catch (err) {
      console.error('Invites deletion failed:', err);
    }

    try {
      const { error: reactionsError } = await supabaseAdmin
        .from('reactions')
        .delete()
        .eq('user_id', userId);
      
      if (reactionsError) {
        console.error('Error deleting reactions:', reactionsError);
      } else {
        deletionLog.items_deleted.push('reactions');
      }
    } catch (err) {
      console.error('Reactions deletion failed:', err);
    }

    try {
      const { error: authError } = await supabaseAdmin.auth.admin.deleteUser(userId);
      
      if (authError) {
        console.error('Error deleting auth user:', authError);
        return NextResponse.json(
          { error: 'Failed to delete authentication account' },
          { status: 500 }
        );
      } else {
        deletionLog.items_deleted.push('auth_user');
      }
    } catch (err) {
      console.error('Auth deletion failed:', err);
      return NextResponse.json(
        { error: 'Failed to delete authentication account' },
        { status: 500 }
      );
    }

    console.log('Account deletion completed:', JSON.stringify(deletionLog));

    return NextResponse.json({
      success: true,
      message: 'Account deleted successfully',
      deletedItems: deletionLog.items_deleted
    });

  } catch (error) {
    console.error('Account deletion error:', error);
    return NextResponse.json(
      { error: 'An unexpected error occurred' },
      { status: 500 }
    );
  }
}
