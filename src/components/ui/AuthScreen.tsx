import { useState, useEffect, useRef } from 'react';
import { supabase } from '@/lib/supabase';
import { Mail, Lock, User, Loader2, ArrowRight, Key, Copy, Check, RefreshCw, X } from 'lucide-react';

export default function AuthScreen() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [username, setUsername] = useState('');
  const [inviteCode, setInviteCode] = useState('');
  const [isSignUp, setIsSignUp] = useState(false);
  const [loading, setLoading] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [termsAccepted, setTermsAccepted] = useState(false);
  const [termsRead, setTermsRead] = useState(false);
  const [privacyRead, setPrivacyRead] = useState(false);
  const [showTermsModal, setShowTermsModal] = useState(false);
  const [showPrivacyModal, setShowPrivacyModal] = useState(false);
  const [termsScrolled, setTermsScrolled] = useState(false);
  const [privacyScrolled, setPrivacyScrolled] = useState(false);
  const termsScrollRef = useRef<HTMLDivElement>(null);
  const privacyScrollRef = useRef<HTMLDivElement>(null);
  const [error, setError] = useState('');
  const [verifyingCode, setVerifyingCode] = useState(false);
  const [codeValid, setCodeValid] = useState<boolean | null>(null);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    setMounted(true);
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

  const handleTermsScroll = (e: React.UIEvent<HTMLDivElement>) => {
    const { scrollTop, scrollHeight, clientHeight } = e.currentTarget;
    if (scrollTop + clientHeight >= scrollHeight - 10) {
      setTermsScrolled(true);
    }
  };

  const handlePrivacyScroll = (e: React.UIEvent<HTMLDivElement>) => {
    const { scrollTop, scrollHeight, clientHeight } = e.currentTarget;
    if (scrollTop + clientHeight >= scrollHeight - 10) {
      setPrivacyScrolled(true);
    }
  };

  const handleAcceptTerms = () => {
    setTermsScrolled(false);
    setTermsRead(true);
    setShowTermsModal(false);
    if (!privacyRead) {
      setShowPrivacyModal(true);
    } else {
      setTermsAccepted(true);
    }
  };

  const handleAcceptPrivacy = () => {
    setPrivacyScrolled(false);
    setPrivacyRead(true);
    setShowPrivacyModal(false);
    if (termsRead) {
      setTermsAccepted(true);
    }
  };

  return (
    <div className="relative w-full h-full flex items-center justify-center bg-zinc-950">
      <div className="absolute inset-0 overflow-hidden">
        <svg className="absolute top-10 left-10 w-16 h-16 text-zinc-800/40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
          <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
        </svg>
        <svg className="absolute top-32 right-16 w-12 h-12 text-zinc-700/30" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
          <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
        </svg>
        <svg className="absolute bottom-40 left-20 w-10 h-10 text-zinc-800/35" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
          <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
        </svg>
        <svg className="absolute bottom-20 right-10 w-14 h-14 text-zinc-700/25" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
          <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
        </svg>
        <svg className="absolute top-1/3 left-6 w-8 h-8 text-zinc-800/20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
          <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
        </svg>
        <svg className="absolute bottom-1/3 right-24 w-10 h-10 text-zinc-800/30" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
          <circle cx="12" cy="12" r="10"/>
          <path d="M8 14s1.5 2 4 2 4-2 4-2"/>
          <line x1="9" y1="9" x2="9.01" y2="9"/>
          <line x1="15" y1="9" x2="15.01" y2="9"/>
        </svg>
        <svg className="absolute top-1/2 right-8 w-8 h-8 text-zinc-700/20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
          <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/>
          <circle cx="9" cy="7" r="4"/>
          <path d="M23 21v-2a4 4 0 0 0-3-3.87"/>
          <path d="M16 3.13a4 4 0 0 1 0 7.75"/>
        </svg>
        <svg className="absolute top-20 left-1/3 w-6 h-6 text-zinc-800/25 rotate-12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
          <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/>
          <polyline points="22,6 12,13 2,6"/>
        </svg>
        <svg className="absolute bottom-1/4 left-8 w-8 h-8 text-zinc-800/20 -rotate-12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
          <rect x="3" y="11" width="18" height="11" rx="2" ry="2"/>
          <path d="M7 11V7a5 5 0 0 1 10 0v4"/>
        </svg>
        <svg className="absolute top-1/4 right-1/4 w-10 h-10 text-zinc-800/15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
          <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/>
        </svg>
        <svg className="absolute bottom-10 left-1/4 w-6 h-6 text-zinc-800/30 rotate-45" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
          <circle cx="12" cy="12" r="10"/>
          <path d="M12 6v6l4 2"/>
        </svg>
      </div>

      <div 
        className={`relative w-full max-w-sm mx-6 transition-all duration-500 ${mounted ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}
      >
        <div className="text-center mb-10">
          <h1 className="text-3xl font-bold text-white tracking-tight">The Basement</h1>
          <p className="text-zinc-500 mt-2 text-sm">
            {isSignUp ? 'Create your account' : 'Sign in to continue'}
          </p>
        </div>

        <div className="bg-zinc-900/50 border border-white/5 rounded-2xl p-6">
          {error && (
            <div className="mb-4 p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 text-sm">
              {error}
            </div>
          )}

          <div className="space-y-4">
            {isSignUp && (
              <>
                <div className="relative">
                  <div className="flex items-center bg-zinc-900/80 rounded-xl border transition-colors ${
                    codeValid === true ? 'border-emerald-500/30' : 
                    codeValid === false ? 'border-red-500/30' : 
                    'border-white/5'
                  }">
                    <div className="pl-4">
                      {verifyingCode ? (
                        <Loader2 size={16} className="text-zinc-600 animate-spin" />
                      ) : codeValid === true ? (
                        <Check size={16} className="text-emerald-400" />
                      ) : codeValid === false ? (
                        <RefreshCw size={16} className="text-red-400" />
                      ) : (
                        <Key size={16} className="text-zinc-600" />
                      )}
                    </div>
                    <input 
                      className="flex-1 bg-transparent py-3 pl-3 pr-4 text-white placeholder:text-zinc-600 outline-none text-sm uppercase tracking-wider"
                      placeholder="Invite code"
                      value={inviteCode} 
                      onChange={(e) => setInviteCode(e.target.value.toUpperCase())}
                      onKeyDown={handleKeyDown}
                    />
                    {inviteCode && (
                      <button 
                        onClick={copyCode}
                        className="pr-4 text-zinc-600 hover:text-white transition-colors"
                      >
                        {copied ? <Check size={14} className="text-emerald-400" /> : <Copy size={14} />}
                      </button>
                    )}
                  </div>
                </div>

                <div>
                  <div className="flex items-center bg-zinc-900/80 rounded-xl border border-white/5 focus-within:border-white/10 transition-colors">
                    <div className="pl-4">
                      <User size={16} className="text-zinc-600" />
                    </div>
                    <input 
                      className="flex-1 bg-transparent py-3 pl-3 pr-4 text-white placeholder:text-zinc-600 outline-none text-sm"
                      placeholder="Username"
                      value={username} 
                      onChange={(e) => setUsername(e.target.value)}
                      onKeyDown={handleKeyDown}
                    />
                  </div>
                </div>
              </>
            )}
              
            <div>
              <div className="flex items-center bg-zinc-900/80 rounded-xl border border-white/5 focus-within:border-white/10 transition-colors">
                <div className="pl-4">
                  <Mail size={16} className="text-zinc-600" />
                </div>
                <input 
                  className="flex-1 bg-transparent py-3 pl-3 pr-4 text-white placeholder:text-zinc-600 outline-none text-sm"
                  type="email" 
                  placeholder="Email"
                  value={email} 
                  onChange={(e) => setEmail(e.target.value)}
                  onKeyDown={handleKeyDown}
                  autoComplete="email"
                />
              </div>
            </div>

            <div>
              <div className="flex items-center bg-zinc-900/80 rounded-xl border border-white/5 focus-within:border-white/10 transition-colors">
                <div className="pl-4">
                  <Lock size={16} className="text-zinc-600" />
                </div>
                <input 
                  className="flex-1 bg-transparent py-3 pl-3 pr-4 text-white placeholder:text-zinc-600 outline-none text-sm"
                  type="password" 
                  placeholder="Password"
                  value={password} 
                  onChange={(e) => setPassword(e.target.value)}
                  onKeyDown={handleKeyDown}
                  autoComplete={isSignUp ? 'new-password' : 'current-password'}
                />
              </div>
            </div>

            <button 
              disabled={loading || !email || !password || (isSignUp && (!username || !inviteCode || !codeValid || !termsAccepted))} 
              onClick={handleAuth}
              className="w-full bg-white text-zinc-950 hover:bg-zinc-200 disabled:opacity-50 disabled:cursor-not-allowed py-3 rounded-xl font-medium text-sm transition-colors flex items-center justify-center gap-2 mt-2"
            >
              {loading ? (
                <Loader2 size={16} className="animate-spin" />
              ) : (
                <>
                  <span>{isSignUp ? 'Create Account' : 'Sign In'}</span>
                  <ArrowRight size={16} />
                </>
              )}
            </button>

            {isSignUp && (
              <div className="flex items-start gap-3 mt-4">
                <button 
                  type="button"
                  disabled={!termsRead || !privacyRead}
                  onClick={() => {
                    if (termsAccepted) {
                      setTermsAccepted(false);
                      setTermsRead(false);
                      setPrivacyRead(false);
                    } else if (!termsRead) {
                      setShowTermsModal(true);
                    } else if (!privacyRead) {
                      setShowPrivacyModal(true);
                    }
                  }}
                  className={`mt-0.5 w-4 h-4 rounded border flex items-center justify-center transition-colors ${
                    termsAccepted 
                      ? 'bg-white border-white' 
                      : termsRead && privacyRead
                        ? 'border-zinc-600 hover:border-white cursor-pointer'
                        : 'border-zinc-700 cursor-not-allowed opacity-50'
                  }`}
                >
                  {termsAccepted && (
                    <svg className="w-3 h-3 text-zinc-950" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                    </svg>
                  )}
                </button>
                <p className="text-xs text-zinc-500 leading-relaxed">
                  I have read and agree to the{' '}
                  <button onClick={() => setShowTermsModal(true)} className="text-white hover:underline">Terms of Service</button>
                  {' '}and{' '}
                  <button onClick={() => setShowPrivacyModal(true)} className="text-white hover:underline">Privacy Policy</button>
                  {!termsRead && !privacyRead && <span className="text-zinc-600"> (read both required)</span>}
                </p>
              </div>
            )}
          </div>

          <div className="mt-6 text-center">
            <button 
              onClick={() => { setIsSignUp(!isSignUp); setError(''); setInviteCode(''); setCodeValid(null); setTermsAccepted(false); setTermsRead(false); setPrivacyRead(false); }} 
              className="text-sm text-zinc-500 hover:text-white transition-colors"
            >
              {isSignUp ? 'Already have an account?' : "Don't have an account?"}{' '}
              <span className="text-white font-medium">{isSignUp ? 'Sign in' : 'Create one'}</span>
            </button>
          </div>
        </div>

        <p className="text-center text-xs text-zinc-600 mt-8">
          Secure messaging platform
        </p>
      </div>

      {showTermsModal && (
        <div 
          className="fixed inset-0 bg-black/80 backdrop-blur-sm z-[100] flex items-center justify-center p-4"
          onClick={(e) => e.target === e.currentTarget && setShowTermsModal(false)}
        >
          <div className="bg-zinc-900 border border-white/10 rounded-2xl w-full max-w-lg max-h-[80vh] flex flex-col overflow-hidden">
            <div className="flex items-center justify-between p-4 border-b border-white/5">
              <h2 className="text-lg font-semibold text-white">Terms of Service</h2>
              <button 
                onClick={() => setShowTermsModal(false)}
                className="p-1.5 hover:bg-white/5 rounded-lg text-zinc-400 hover:text-white transition-colors"
              >
                <X size={18} />
              </button>
            </div>
            
            <div 
              ref={termsScrollRef}
              onScroll={handleTermsScroll}
              className="flex-1 overflow-y-auto p-6"
            >
              <div className="text-sm text-zinc-400 space-y-4">
                <p className="text-xs text-zinc-500">Last updated: April 6, 2026</p>
                
                <h3 className="text-white font-semibold">1. Acceptance of Terms</h3>
                <p>By creating an account or using thebasement (the "Service"), you agree to be bound by these Terms. If you do not agree, do not use the Service.</p>
                
                <h3 className="text-white font-semibold">2. Eligibility & Access</h3>
                <ul className="list-disc list-inside space-y-1 pl-2">
                  <li><strong className="text-white">Invite-Only:</strong> Access to thebasement is restricted to users with a valid verification code.</li>
                  <li><strong className="text-white">Age Requirement:</strong> You must be at least 16 years old to use this Service.</li>
                  <li><strong className="text-white">Account Security:</strong> You are responsible for maintaining the confidentiality of your account and for all activities that occur under your account.</li>
                </ul>
                
                <h3 className="text-white font-semibold">3. User Conduct</h3>
                <p>thebasement is a private space for friends. You agree not to:</p>
                <ul className="list-disc list-inside space-y-1 pl-2">
                  <li>Harass, bully, or abuse other users.</li>
                  <li>Post illegal content, including material that violates intellectual property rights.</li>
                  <li>Attempt to "hack," reverse-engineer, or disrupt the Service or Supabase backend.</li>
                  <li>Share your verification code with unauthorized individuals.</li>
                </ul>
                
                <h3 className="text-white font-semibold">4. Content Ownership</h3>
                <ul className="list-disc list-inside space-y-1 pl-2">
                  <li><strong className="text-white">Your Content:</strong> You retain ownership of the messages and media you send. However, by sending them, you grant us a license to host and transmit that content solely to provide the Service.</li>
                  <li><strong className="text-white">Our Content:</strong> The app's UI, logo, and "XP/Badge" systems are the property of OnePeso Labs.</li>
                </ul>
                
                <h3 className="text-white font-semibold">5. Termination of Access</h3>
                <p>We reserve the right to disable any account or revoke any verification code at any time, with or without notice, for conduct that we believe violates these terms or is harmful to the community.</p>
                
                <h3 className="text-white font-semibold">6. Disclaimers & Limitation of Liability</h3>
                <ul className="list-disc list-inside space-y-1 pl-2">
                  <li><strong className="text-white">"As-Is":</strong> The Service is provided "as-is" without warranties of any kind.</li>
                  <li><strong className="text-white">Limitation:</strong> OnePeso Labs shall not be liable for any indirect, incidental, or consequential damages arising from your use of the Service.</li>
                </ul>
                
                <h3 className="text-white font-semibold">7. Account Deletion</h3>
                <p>You may terminate your account at any time using the "Delete Account" feature in the app. Upon deletion, your data will be purged as described in our Privacy Policy.</p>
                
                <h3 className="text-white font-semibold">8. Changes to Terms</h3>
                <p>We may update these terms from time to time. We will notify you of significant changes via email or an in-app notification.</p>
                
                <h3 className="text-white font-semibold">9. Governing Law</h3>
                <p>These terms are governed by the laws of the State of California, United States, without regard to conflict of law principles.</p>
                
                <div className="h-4" />
              </div>
            </div>
            
            <div className="p-4 border-t border-white/5 bg-zinc-950/50">
              <button 
                disabled={!termsScrolled}
                onClick={handleAcceptTerms}
                className={`w-full py-3 rounded-xl font-medium text-sm transition-colors flex items-center justify-center gap-2 ${
                  termsScrolled 
                    ? 'bg-white text-zinc-950 hover:bg-zinc-200' 
                    : 'bg-zinc-800 text-zinc-500 cursor-not-allowed'
                }`}
              >
                {termsScrolled ? (
                  <>I Accept the Terms of Service</>
                ) : (
                  <>Scroll to bottom to accept</>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {showPrivacyModal && (
        <div 
          className="fixed inset-0 bg-black/80 backdrop-blur-sm z-[100] flex items-center justify-center p-4"
          onClick={(e) => e.target === e.currentTarget && setShowPrivacyModal(false)}
        >
          <div className="bg-zinc-900 border border-white/10 rounded-2xl w-full max-w-lg max-h-[80vh] flex flex-col overflow-hidden">
            <div className="flex items-center justify-between p-4 border-b border-white/5">
              <h2 className="text-lg font-semibold text-white">Privacy Policy</h2>
              <button 
                onClick={() => setShowPrivacyModal(false)}
                className="p-1.5 hover:bg-white/5 rounded-lg text-zinc-400 hover:text-white transition-colors"
              >
                <X size={18} />
              </button>
            </div>
            
            <div 
              ref={privacyScrollRef}
              onScroll={handlePrivacyScroll}
              className="flex-1 overflow-y-auto p-6"
            >
              <div className="text-sm text-zinc-400 space-y-4">
                <p className="text-xs text-zinc-500">Last updated: April 6, 2026</p>
                
                <h3 className="text-white font-semibold">1. Introduction</h3>
                <p>This Privacy Policy explains how OnePeso Labs ("we," "us," or "our") collects, uses, and protects your information when you use thebasement (the "Service"). By using the Service, you agree to the terms outlined here.</p>
                
                <h3 className="text-white font-semibold">2. Information We Collect</h3>
                <p>Because thebasement is a private, invitation-only chat app, we limit data collection to what is strictly necessary:</p>
                <ul className="list-disc list-inside space-y-1 pl-2">
                  <li><strong className="text-white">Account Data:</strong> Your email address, name, and profile information (avatar, XP, badges) provided during sign-up via our authentication provider, Supabase.</li>
                  <li><strong className="text-white">Chat Content:</strong> Messages, images, and media you send within the app.</li>
                  <li><strong className="text-white">Technical Data:</strong> Approximate location (derived from IP address for security), device type, and app usage statistics to help us fix bugs and improve performance.</li>
                </ul>
                
                <h3 className="text-white font-semibold">3. How We Use Your Data</h3>
                <p>We use your information solely to:</p>
                <ul className="list-disc list-inside space-y-1 pl-2">
                  <li>Authenticate your identity and manage your account.</li>
                  <li>Deliver your messages to your friends.</li>
                  <li>Prevent fraud and unauthorized access (Digital Sentry Mode).</li>
                </ul>
                <p><strong className="text-white">We do not sell your personal data to third parties.</strong></p>
                
                <h3 className="text-white font-semibold">4. Data Storage and Third Parties</h3>
                <p>We use Supabase (a backend-as-a-service provider) to store your data securely. Your data is encrypted in transit and at rest. We may share information with law enforcement only if required by a valid legal order.</p>
                
                <h3 className="text-white font-semibold">5. Data Retention & Deletion</h3>
                <p>We believe in your right to be forgotten.</p>
                <ul className="list-disc list-inside space-y-1 pl-2">
                  <li><strong className="text-white">Active Data:</strong> We keep your data as long as your account is active.</li>
                  <li><strong className="text-white">User-Initiated Deletion:</strong> When you use the "Delete Account" feature in-app, your profile, messages, and progress are permanently and irreversibly purged from our production databases immediately.</li>
                  <li><strong className="text-white">Backups:</strong> Residual copies may remain in encrypted system backups for up to 90 days before being overwritten.</li>
                </ul>
                
                <h3 className="text-white font-semibold">6. Children's Privacy</h3>
                <p>Our Service is intended for users aged 16 and older. We do not knowingly collect data from anyone under this age.</p>
                
                <h3 className="text-white font-semibold">7. California Privacy Rights (CCPA)</h3>
                <p>If you are a California resident, you have the right to know what data we collect and the right to request its deletion. You can exercise these rights instantly by using the "Delete Account" feature in your app settings.</p>
                
                <h3 className="text-white font-semibold">8. Contact Us</h3>
                <p>For any questions regarding this policy, please contact us at: <span className="text-white">onepesolabs@gmail.com</span></p>
                
                <div className="h-4" />
              </div>
            </div>
            
            <div className="p-4 border-t border-white/5 bg-zinc-950/50">
              <button 
                disabled={!privacyScrolled}
                onClick={handleAcceptPrivacy}
                className={`w-full py-3 rounded-xl font-medium text-sm transition-colors ${
                  privacyScrolled 
                    ? 'bg-white text-zinc-950 hover:bg-zinc-200' 
                    : 'bg-zinc-800 text-zinc-500 cursor-not-allowed'
                }`}
              >
                {privacyScrolled ? (
                  <>I Have Read the Privacy Policy</>
                ) : (
                  <>Scroll to bottom to continue</>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
