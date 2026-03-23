import { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';
import { supabase } from '@/lib/supabase';

interface AuthContextType {
  session: any;
  allProfiles: any[];
  myProfile: any;
  loading: boolean;
  refetchProfiles: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<any>(null);
  const [allProfiles, setAllProfiles] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchProfiles = useCallback(async () => {
    const { data } = await supabase.from('profiles').select('*').order('username');
    if (data) setAllProfiles(data);
  }, []);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setLoading(false);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_e, s) => setSession(s));

    fetchProfiles();
    const sub = supabase.channel('profile-sync').on('postgres_changes', { event: '*', schema: 'public', table: 'profiles' }, fetchProfiles).subscribe();

    return () => {
      subscription.unsubscribe();
      supabase.removeChannel(sub);
    };
  }, [fetchProfiles]);

  const value = {
    session,
    allProfiles,
    myProfile: allProfiles.find(p => p.id === session?.user?.id),
    loading,
    refetchProfiles: fetchProfiles
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}