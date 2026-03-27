import { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';
import { supabase } from '@/lib/supabase';
import { useChatStore } from '@/store/useChatStore';

interface AuthContextType {
  session: any;
  allProfiles: any[];
  myProfile: any;
  loading: boolean;
  refetchProfiles: () => Promise<void>;
  updateProfile: (userId: string, updates: Record<string, any>) => void;
}

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<any>(null);
  const [allProfiles, setAllProfiles] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const { userProfile, setUserProfile } = useChatStore();

  const fetchProfiles = useCallback(async () => {
    const { data } = await supabase.from('profiles').select('*').order('username');
    if (data) {
      setAllProfiles(data);
      // Update userProfile in store when profiles are fetched
      if (session?.user?.id) {
        const myProfile = data.find(p => p.id === session.user.id);
        if (myProfile) {
          setUserProfile(myProfile);
        }
      }
    }
  }, [session?.user?.id, setUserProfile]);

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

  const myProfile = allProfiles.find(p => p.id === session?.user?.id) || userProfile;

  const updateProfile = useCallback((userId: string, updates: Record<string, any>) => {
    setAllProfiles(prev => prev.map(p => p.id === userId ? { ...p, ...updates } : p));
    if (session?.user?.id === userId && userProfile) {
      setUserProfile({ ...userProfile, ...updates });
    }
  }, [session?.user?.id, userProfile, setUserProfile]);

  const value = {
    session,
    allProfiles,
    myProfile,
    loading,
    refetchProfiles: fetchProfiles,
    updateProfile,
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