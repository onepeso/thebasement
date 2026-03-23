import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { Mail, Lock, User, Loader2, ArrowRight, MessageSquare, Shield, Zap, Key, Copy, Check, RefreshCw } from 'lucide-react';

export default function AuthScreen() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [username, setUsername] = useState('');
  const [inviteCode, setInviteCode] = useState('');
  const [isSignUp, setIsSignUp] = useState(false);
  const [loading, setLoading] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [activeFeature, setActiveFeature] = useState(0);
  const [error, setError] = useState('');
  const [verifyingCode, setVerifyingCode] = useState(false);
  const [codeValid, setCodeValid] = useState<boolean | null>(null);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    setMounted(true);
    const interval = setInterval(() => {
      setActiveFeature(prev => (prev + 1) % 3);
    }, 3000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if (inviteCode.length >= 4 && isSignUp) {
      verifyInviteCode(inviteCode);
    } else {
      setCodeValid(null);
    }
  }, [inviteCode, isSignUp]);

  const verifyInviteCode = async (code: string) => {
    setVerifyingCode(true);
    const { data, error } = await supabase
      .from('invite_codes')
      .select('id')
      .eq('code', code.toUpperCase())
      .single();
    
    if (error) {
      setCodeValid(false);
      setError('Invalid invite code');
    } else if (data) {
      setCodeValid(true);
      setError('');
    }
    setVerifyingCode(false);
  };

  const handleAuth = async () => {
    setLoading(true);
    setError('');

    if (isSignUp) {
      if (!codeValid) {
        setError('Please enter a valid invite code');
        setLoading(false);
        return;
      }

      const { data, error: signUpError } = await supabase.auth.signUp({
        email,
        password,
        options: { 
          data: { 
            username, 
            invite_code: inviteCode.toUpperCase(),
            avatar_url: `https://api.dicebear.com/7.x/pixel-art/svg?seed=${username}` 
          } 
        }
      });

      if (signUpError) {
        setError(signUpError.message);
        setLoading(false);
        return;
      }

      if (data.user) {
        // Mark invite code as used
        const { data: codeData } = await supabase
          .from('invite_codes')
          .select('*')
          .eq('code', inviteCode.toUpperCase())
          .single();

        if (codeData) {
          await supabase
            .from('invite_codes')
            .update({ 
              used_by: data.user.id, 
              used_at: new Date().toISOString(),
              current_uses: codeData.current_uses + 1 
            })
            .eq('id', codeData.id);
        }
      }
    } else {
      const { error: signInError } = await supabase.auth.signInWithPassword({ email, password });
      if (signInError) setError(signInError.message);
    }
    setLoading(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !loading) {
      handleAuth();
    }
  };

  const copyCode = () => {
    navigator.clipboard.writeText(inviteCode.toUpperCase());
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const features = [
    {
      icon: MessageSquare,
      title: 'Real-time Messaging',
      description: 'Instant communication with typing indicators and read receipts',
      color: 'indigo'
    },
    {
      icon: Zap,
      title: 'Lightning Fast',
      description: 'Built with modern tech for instant message delivery',
      color: 'purple'
    },
    {
      icon: Shield,
      title: 'Private & Secure',
      description: 'Your conversations stay private with end-to-end encryption',
      color: 'emerald'
    }
  ];

  const FeatureIcon = features[activeFeature].icon;

  return (
    <div className="relative w-full h-full flex items-center justify-center overflow-hidden">
      {/* Animated Background */}
      <div className="absolute inset-0 bg-zinc-950">
        {/* Large Gradient Orbs */}
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[800px] h-[800px] bg-indigo-600/10 rounded-full blur-[150px]" />
        <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-[600px] h-[600px] bg-purple-600/10 rounded-full blur-[150px]" />
        
        {/* Grid Pattern */}
        <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.015)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.015)_1px,transparent_1px)] bg-[size:48px_48px]" />
        
        {/* Animated Particles */}
        <div className="absolute inset-0 overflow-hidden">
          {[...Array(20)].map((_, i) => (
            <div
              key={i}
              className="absolute w-1 h-1 rounded-full bg-indigo-500/30"
              style={{
                left: `${Math.random() * 100}%`,
                top: `${Math.random() * 100}%`,
                animation: `float ${3 + Math.random() * 4}s ease-in-out infinite`,
                animationDelay: `${Math.random() * 2}s`
              }}
            />
          ))}
        </div>
      </div>

      {/* Main Card */}
      <div className={`relative z-10 w-full max-w-2xl mx-6 transition-all duration-700 ${mounted ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}>
        
        {/* Outer Glow */}
        <div className="absolute -inset-px bg-gradient-to-r from-indigo-500 via-purple-500 to-indigo-500 rounded-3xl opacity-40 blur-xl" />
        
        {/* Card */}
        <div className="relative bg-zinc-950/90 backdrop-blur-3xl border border-white/10 rounded-3xl overflow-hidden shadow-2xl mx-4 sm:mx-0">
          
          {/* Top Gradient Bar */}
          <div className="h-1 bg-gradient-to-r from-indigo-500 via-purple-500 to-indigo-500" />
          
          <div className="p-6 sm:p-8 md:p-10 lg:p-12">
            {/* Header */}
            <div className="text-center mb-6 sm:mb-8 md:mb-10">
              <div className="inline-flex items-center justify-center w-16 h-16 sm:w-20 sm:h-20 rounded-2xl bg-gradient-to-br from-indigo-600 via-purple-600 to-indigo-600 shadow-2xl shadow-indigo-500/30 mb-4 sm:mb-6">
                <span className="text-3xl sm:text-4xl font-black italic text-white">B</span>
              </div>
              <h1 className="text-2xl sm:text-3xl md:text-4xl font-black text-white mb-2 sm:mb-3 tracking-tight">The Basement</h1>
              <p className="text-zinc-500 text-sm sm:text-base md:text-lg">
                {isSignUp ? 'Create your account' : 'Welcome back'}
              </p>
            </div>

            {/* Feature Badge */}
            <div className="flex justify-center mb-6 sm:mb-8">
              <div className="inline-flex items-center gap-2 sm:gap-3 px-3 sm:px-4 py-2 sm:py-2.5 rounded-full bg-zinc-900/80 border border-white/5">
                <FeatureIcon size={14} className={`sm:text-base text-${features[activeFeature].color}-400`} />
                <span className="text-xs sm:text-sm text-zinc-400 hidden sm:inline">{features[activeFeature].title}</span>
              </div>
            </div>

            {/* Error Message */}
            {error && (
              <div className="mb-4 p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 text-sm text-center">
                {error}
              </div>
            )}

            {/* Form */}
            <div className="space-y-4 sm:space-y-5">
              {isSignUp && (
                <>
                  {/* Invite Code Input */}
                  <div className="relative group">
                    <div className={`absolute -inset-0.5 rounded-xl blur transition-opacity duration-300 ${codeValid === true ? 'bg-emerald-500/30 opacity-100' : codeValid === false ? 'bg-red-500/30 opacity-100' : 'opacity-0'} `} />
                    <div className={`relative flex items-center bg-zinc-900/60 rounded-xl border transition-colors ${
                      codeValid === true ? 'border-emerald-500/30' : 
                      codeValid === false ? 'border-red-500/30' : 
                      'border-white/5 group-focus-within:border-indigo-500/30'
                    }`}>
                      <div className="pl-4 sm:pl-5">
                        {verifyingCode ? (
                          <Loader2 size={18} className="sm:w-5 text-zinc-600 animate-spin" />
                        ) : codeValid === true ? (
                          <Check size={18} className="sm:w-5 text-emerald-400" />
                        ) : codeValid === false ? (
                          <RefreshCw size={18} className="sm:w-5 text-red-400" />
                        ) : (
                          <Key size={18} className="sm:w-5 text-zinc-600" />
                        )}
                      </div>
                      <input 
                        className="flex-1 bg-transparent py-3 sm:py-4 pl-3 sm:pl-4 pr-4 text-white placeholder:text-zinc-600 outline-none text-sm sm:text-base uppercase"
                        placeholder="Invite code"
                        value={inviteCode} 
                        onChange={(e) => setInviteCode(e.target.value.toUpperCase())}
                        onKeyDown={handleKeyDown}
                      />
                      {inviteCode && (
                        <button 
                          onClick={copyCode}
                          className="pr-4 sm:pr-5 text-zinc-600 hover:text-white transition-colors"
                        >
                          {copied ? <Check size={14} className="sm:w-4 text-emerald-400" /> : <Copy size={14} className="sm:w-4" />}
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Username Input */}
                  <div className="relative group">
                    <div className="absolute -inset-0.5 bg-gradient-to-r from-indigo-500/30 to-purple-500/30 rounded-xl blur opacity-0 group-focus-within:opacity-100 transition-opacity duration-300" />
                    <div className="relative flex items-center bg-zinc-900/60 rounded-xl border border-white/5 group-focus-within:border-indigo-500/30 transition-colors">
                      <div className="pl-4 sm:pl-5">
                        <User size={18} className="sm:w-5 text-zinc-600" />
                      </div>
                      <input 
                        className="flex-1 bg-transparent py-3 sm:py-4 pl-3 sm:pl-4 pr-4 sm:pr-5 text-white placeholder:text-zinc-600 outline-none text-sm sm:text-base"
                        placeholder="Choose a username"
                        value={username} 
                        onChange={(e) => setUsername(e.target.value)}
                        onKeyDown={handleKeyDown}
                      />
                    </div>
                  </div>
                </>
              )}
               
              <div className="relative group">
                <div className="absolute -inset-0.5 bg-gradient-to-r from-indigo-500/30 to-purple-500/30 rounded-xl blur opacity-0 group-focus-within:opacity-100 transition-opacity duration-300" />
                <div className="relative flex items-center bg-zinc-900/60 rounded-xl border border-white/5 group-focus-within:border-indigo-500/30 transition-colors">
                  <div className="pl-4 sm:pl-5">
                    <Mail size={18} className="sm:w-5 text-zinc-600" />
                  </div>
                  <input 
                    className="flex-1 bg-transparent py-3 sm:py-4 pl-3 sm:pl-4 pr-4 sm:pr-5 text-white placeholder:text-zinc-600 outline-none text-sm sm:text-base"
                    type="email" 
                    placeholder="Your email"
                    value={email} 
                    onChange={(e) => setEmail(e.target.value)}
                    onKeyDown={handleKeyDown}
                    autoComplete="email"
                  />
                </div>
              </div>
              
              <div className="relative group">
                <div className="absolute -inset-0.5 bg-gradient-to-r from-indigo-500/30 to-purple-500/30 rounded-xl blur opacity-0 group-focus-within:opacity-100 transition-opacity duration-300" />
                <div className="relative flex items-center bg-zinc-900/60 rounded-xl border border-white/5 group-focus-within:border-indigo-500/30 transition-colors">
                  <div className="pl-4 sm:pl-5">
                    <Lock size={18} className="sm:w-5 text-zinc-600" />
                  </div>
                  <input 
                    className="flex-1 bg-transparent py-3 sm:py-4 pl-3 sm:pl-4 pr-4 sm:pr-5 text-white placeholder:text-zinc-600 outline-none text-sm sm:text-base"
                    type="password" 
                    placeholder="Your password"
                    value={password} 
                    onChange={(e) => setPassword(e.target.value)}
                    onKeyDown={handleKeyDown}
                    autoComplete={isSignUp ? 'new-password' : 'current-password'}
                  />
                </div>
              </div>

              {/* Submit Button */}
              <button 
                disabled={loading || !email || !password || (isSignUp && (!username || !inviteCode || !codeValid))} 
                onClick={handleAuth}
                className="relative w-full group disabled:opacity-50 disabled:cursor-not-allowed mt-2"
              >
                <div className="absolute -inset-0.5 bg-gradient-to-r from-indigo-600 to-purple-600 rounded-xl blur opacity-40 group-hover:opacity-70 transition-opacity" />
                <div className="relative bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 rounded-xl py-3 sm:py-4 font-semibold text-white transition-all flex items-center justify-center gap-2 shadow-lg shadow-indigo-500/20">
                  {loading ? (
                    <Loader2 size={20} className="sm:w-6 animate-spin" />
                  ) : (
                    <>
                      <span className="text-sm sm:text-base">{isSignUp ? 'Create Account' : 'Sign In'}</span>
                      <ArrowRight size={18} className="sm:w-5 group-hover:translate-x-1 transition-transform" />
                    </>
                  )}
                </div>
              </button>
            </div>

            {/* Divider */}
            <div className="flex items-center gap-4 my-6 sm:my-8">
              <div className="flex-1 h-px bg-gradient-to-r from-transparent via-white/10 to-transparent" />
              <span className="text-xs text-zinc-600 uppercase tracking-wider">or</span>
              <div className="flex-1 h-px bg-gradient-to-r from-transparent via-white/10 to-transparent" />
            </div>

            {/* Toggle */}
            <div className="text-center">
              <button 
                onClick={() => { setIsSignUp(!isSignUp); setError(''); setInviteCode(''); setCodeValid(null); }} 
                className="text-xs sm:text-sm md:text-base text-zinc-400 hover:text-white transition-colors"
              >
                {isSignUp ? (
                  <>
                    Already have an account?{' '}
                    <span className="text-indigo-400 font-semibold">Sign in</span>
                  </>
                ) : (
                  <>
                    Don't have an account?{' '}
                    <span className="text-indigo-400 font-semibold">Create one</span>
                  </>
                )}
              </button>
            </div>

            {/* Footer */}
            <p className="text-center text-sm text-zinc-600 mt-8">
              Secure, private messaging for teams and friends
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
