import { createClient, SupabaseClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const serviceRoleKey = Deno.env.get('SERVICE_ROLE_KEY')!;

    if (!serviceRoleKey) {
      return new Response(
        JSON.stringify({ error: 'Service role key not configured' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    let userId: string | undefined;
    const body = await req.text();
    
    if (!body) {
      return new Response(
        JSON.stringify({ error: 'Request body is empty' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }
    
    try {
      const parsed = JSON.parse(body);
      userId = parsed.userId;
    } catch {
      return new Response(
        JSON.stringify({ error: 'Invalid JSON' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (!userId) {
      return new Response(
        JSON.stringify({ error: 'User ID is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const supabaseAdmin: SupabaseClient = createClient(supabaseUrl, serviceRoleKey);

    console.log('Starting account deletion for user:', userId);

    try {
      await supabaseAdmin.from('messages').delete().eq('user_id', userId);
    } catch (err) {
      console.error('Messages deletion failed:', err);
    }

    try {
      await supabaseAdmin.from('channel_members').delete().eq('user_id', userId);
    } catch (err) {
      console.error('Memberships deletion failed:', err);
    }

    try {
      await supabaseAdmin.from('profiles').delete().eq('id', userId);
    } catch (err) {
      console.error('Profile deletion failed:', err);
    }

    try {
      await supabaseAdmin.from('reactions').delete().eq('user_id', userId);
    } catch (err) {
      console.error('Reactions deletion failed:', err);
    }

    try {
      const { error: authError } = await supabaseAdmin.auth.admin.deleteUser(userId);
      if (authError) {
        throw authError;
      }
    } catch (err) {
      console.error('Auth deletion failed:', err);
      return new Response(
        JSON.stringify({ error: 'Failed to delete auth account' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log('Account deletion completed for user:', userId);

    return new Response(
      JSON.stringify({ success: true }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error:', error);
    return new Response(
      JSON.stringify({ error: 'Internal error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
