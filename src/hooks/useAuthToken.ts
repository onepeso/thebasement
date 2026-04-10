import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';

export function useAuthToken() {
  const [token, setToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const getToken = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      setToken(session?.access_token || null);
      setLoading(false);
    };

    getToken();

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_e, session) => {
      setToken(session?.access_token || null);
    });

    return () => subscription.unsubscribe();
  }, []);

  return { token, loading };
}
