import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { Mail, Lock, User, Loader2, ArrowRight, MessageSquare, Shield, Zap } from 'lucide-react';

export default function AuthScreen() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [username, setUsername] = useState('');
  const [isSignUp, setIsSignUp] = useState(false);
  const [loading, setLoading] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [activeFeature, setActiveFeature] = useState(0);

  useEffect(() => {
    setMounted(true);
    const interval = setInterval(() => {
      setActiveFeature(prev => (prev + 1) % 3);
    }, 3000);
    return () => clearInterval(interval);
  }, []);

  const handleAuth = async () => {
    setLoading(true);
    if (isSignUp) {
      const { error } = await supabase.auth.signUp({
        email,
        password,
        options: { 
          data: { 
            username, 
            avatar_url: `https://api.dicebear.com/7.x/pixel-art/svg?seed=${username}` 
          } 
        }
      });
      if (error) alert(error.message);
    } else {
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) alert(error.message);
    }
    setLoading(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !loading) {
      handleAuth();
    }
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
        <div className="relative bg-zinc-950/90 backdrop-blur-3xl border border-white/10 rounded-3xl overflow-hidden shadow-2xl">
          
          {/* Top Gradient Bar */}
          <div className="h-1 bg-gradient-to-r from-indigo-500 via-purple-500 to-indigo-500" />
          
          <div className="p-10 lg:p-12">
            {/* Header */}
            <div className="text-center mb-10">
              <div className="inline-flex items-center justify-center w-20 h-20 rounded-2xl bg-gradient-to-br from-indigo-600 via-purple-600 to-indigo-600 shadow-2xl shadow-indigo-500/30 mb-6">
                <span className="text-4xl font-black italic text-white">B</span>
              </div>
              <h1 className="text-4xl font-black text-white mb-3 tracking-tight">The Basement</h1>
              <p className="text-zinc-500 text-lg">
                {isSignUp ? 'Create your account' : 'Welcome back'}
              </p>
            </div>

            {/* Feature Badge */}
            <div className="flex justify-center mb-8">
              <div className="inline-flex items-center gap-3 px-5 py-2.5 rounded-full bg-zinc-900/80 border border-white/5">
                <FeatureIcon size={16} className={`text-${features[activeFeature].color}-400`} />
                <span className="text-sm text-zinc-400">{features[activeFeature].title}</span>
              </div>
            </div>

            {/* Form */}
            <div className="space-y-5">
              {isSignUp && (
                <div className="relative group">
                  <div className="absolute -inset-0.5 bg-gradient-to-r from-indigo-500/30 to-purple-500/30 rounded-xl blur opacity-0 group-focus-within:opacity-100 transition-opacity duration-300" />
                  <div className="relative flex items-center bg-zinc-900/60 rounded-xl border border-white/5 group-focus-within:border-indigo-500/30 transition-colors">
                    <div className="pl-5">
                      <User size={20} className="text-zinc-600" />
                    </div>
                    <input 
                      className="flex-1 bg-transparent py-4 pl-4 pr-5 text-white placeholder:text-zinc-600 outline-none text-base"
                      placeholder="Choose a username"
                      value={username} 
                      onChange={(e) => setUsername(e.target.value)}
                      onKeyDown={handleKeyDown}
                    />
                  </div>
                </div>
              )}
              
              <div className="relative group">
                <div className="absolute -inset-0.5 bg-gradient-to-r from-indigo-500/30 to-purple-500/30 rounded-xl blur opacity-0 group-focus-within:opacity-100 transition-opacity duration-300" />
                <div className="relative flex items-center bg-zinc-900/60 rounded-xl border border-white/5 group-focus-within:border-indigo-500/30 transition-colors">
                  <div className="pl-5">
                    <Mail size={20} className="text-zinc-600" />
                  </div>
                  <input 
                    className="flex-1 bg-transparent py-4 pl-4 pr-5 text-white placeholder:text-zinc-600 outline-none text-base"
                    type="email" 
                    placeholder="Enter your email"
                    value={email} 
                    onChange={(e) => setEmail(e.target.value)}
                    onKeyDown={handleKeyDown}
                  />
                </div>
              </div>
              
              <div className="relative group">
                <div className="absolute -inset-0.5 bg-gradient-to-r from-indigo-500/30 to-purple-500/30 rounded-xl blur opacity-0 group-focus-within:opacity-100 transition-opacity duration-300" />
                <div className="relative flex items-center bg-zinc-900/60 rounded-xl border border-white/5 group-focus-within:border-indigo-500/30 transition-colors">
                  <div className="pl-5">
                    <Lock size={20} className="text-zinc-600" />
                  </div>
                  <input 
                    className="flex-1 bg-transparent py-4 pl-4 pr-5 text-white placeholder:text-zinc-600 outline-none text-base"
                    type="password" 
                    placeholder="Enter your password"
                    value={password} 
                    onChange={(e) => setPassword(e.target.value)}
                    onKeyDown={handleKeyDown}
                  />
                </div>
              </div>

              {/* Submit Button */}
              <button 
                disabled={loading || !email || !password || (isSignUp && !username)} 
                onClick={handleAuth} 
                className="relative w-full group disabled:opacity-50 disabled:cursor-not-allowed mt-2"
              >
                <div className="absolute -inset-0.5 bg-gradient-to-r from-indigo-600 to-purple-600 rounded-xl blur opacity-40 group-hover:opacity-70 transition-opacity" />
                <div className="relative bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 rounded-xl py-4 font-semibold text-white transition-all flex items-center justify-center gap-2 shadow-lg shadow-indigo-500/20">
                  {loading ? (
                    <Loader2 size={24} className="animate-spin" />
                  ) : (
                    <>
                      <span className="text-lg">{isSignUp ? 'Create Account' : 'Sign In'}</span>
                      <ArrowRight size={20} className="group-hover:translate-x-1 transition-transform" />
                    </>
                  )}
                </div>
              </button>
            </div>

            {/* Divider */}
            <div className="flex items-center gap-4 my-8">
              <div className="flex-1 h-px bg-gradient-to-r from-transparent via-white/10 to-transparent" />
              <span className="text-xs text-zinc-600 uppercase tracking-wider">or</span>
              <div className="flex-1 h-px bg-gradient-to-r from-transparent via-white/10 to-transparent" />
            </div>

            {/* Toggle */}
            <div className="text-center">
              <button 
                onClick={() => setIsSignUp(!isSignUp)} 
                className="text-base text-zinc-400 hover:text-white transition-colors"
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
