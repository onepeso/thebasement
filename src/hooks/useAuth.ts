import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';

export function useAuth() {
  const [session, setSession] = useState<any>(null);
  const [allProfiles, setAllProfiles] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setLoading(false);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_e, s) => setSession(s));

    const fetchProfiles = async () => {
      const { data } = await supabase.from('profiles').select('*').order('username');
      if (data) setAllProfiles(data);
    };

    fetchProfiles();
    const sub = supabase.channel('profile-sync').on('postgres_changes', { event: '*', schema: 'public', table: 'profiles' }, fetchProfiles).subscribe();

    return () => {
      subscription.unsubscribe();
      supabase.removeChannel(sub);
    };
  }, []);

  return { 
    session, 
    allProfiles, 
    myProfile: allProfiles.find(p => p.id === session?.user?.id),
    loading 
  };
}