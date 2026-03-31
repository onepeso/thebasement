import { useState, useEffect, useRef } from 'react';
import { Profile } from '@/types/database';
import { useChatStore } from '@/store/useChatStore';

interface AvatarWithEffectProps {
  profile?: Profile | null;
  username?: string;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  className?: string;
  showStatus?: boolean;
  isOnline?: boolean;
  onClick?: () => void;
}

const SIZE_CLASSES = {
  sm: 'w-8 h-8',
  md: 'w-9 h-9',
  lg: 'w-10 h-10',
  xl: 'w-16 h-16 sm:w-20 sm:h-20',
};

const ACCESSORY_SIZE_CLASSES = {
  sm: { 
    top: '-top-1', 
    right: '-right-1',
    bottom: '-bottom-1',
    svg: 'w-5 h-5',
    png: 'w-8 h-8 sm:w-10 sm:h-10',
    ring: 'ring-[3px]',
    blur: 'blur-sm',
  },
  md: { 
    top: '-top-1.5', 
    right: '-right-1.5',
    bottom: '-bottom-1.5',
    svg: 'w-6 h-6',
    png: 'w-12 h-12 sm:w-14 sm:h-14',
    ring: 'ring-[4px]',
    blur: 'blur-md',
  },
  lg: { 
    top: '-top-2', 
    right: '-right-2',
    bottom: '-bottom-2',
    svg: 'w-7 h-7',
    png: 'w-14 h-14 sm:w-16 sm:h-16',
    ring: 'ring-[5px]',
    blur: 'blur-lg',
  },
  xl: { 
    top: '-top-3', 
    right: '-right-3',
    bottom: '-bottom-3',
    svg: 'w-12 h-12',
    png: 'w-20 h-20 sm:w-24 sm:h-24',
    ring: 'ring-[6px]',
    blur: 'blur-xl',
  },
};

const STATUS_DOT_SIZE = {
  sm: 'w-2.5 h-2.5',
  md: 'w-3 h-3',
  lg: 'w-3 h-3',
  xl: 'w-4 h-4',
};

export function AvatarWithEffect({ profile, username, size = 'md', className = '', showStatus = true, isOnline, onClick }: AvatarWithEffectProps) {
  const { reduceMotion, isTabVisible } = useChatStore();
  const [isHovered, setIsHovered] = useState(false);
  const [hasPlayedIntro, setHasPlayedIntro] = useState(false);
  const effectRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  
  const avatarUrl = profile?.avatar_url || `https://ui-avatars.com/api/?name=${username || profile?.username || 'U'}`;
  const effect = profile?.avatar_effect;
  const overlay = profile?.avatar_overlays;
  const overlayUrl = profile?.avatar_overlay_url;
  const storedStatus = profile?.status as string | undefined;
  
  const status = isOnline 
    ? (storedStatus || 'online')
    : 'offline';

  useEffect(() => {
    if (!reduceMotion && effect && effect !== 'none') {
      setHasPlayedIntro(true);
      effectRef.current = setTimeout(() => {
        setHasPlayedIntro(false);
      }, 5000);
    }
    return () => {
      if (effectRef.current) clearTimeout(effectRef.current);
    };
  }, [reduceMotion, effect, profile?.id]);

  const shouldAnimate = !reduceMotion && isTabVisible && effect && effect !== 'none' && (hasPlayedIntro || isHovered);
  
  const sizeConfig = ACCESSORY_SIZE_CLASSES[size];

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    let timeout: ReturnType<typeof setTimeout>;
    
    const handleMouseEnter = () => {
      timeout = setTimeout(() => setIsHovered(true), 50);
    };
    
    const handleMouseLeave = () => {
      clearTimeout(timeout);
      setIsHovered(false);
    };

    container.addEventListener('mouseenter', handleMouseEnter);
    container.addEventListener('mouseleave', handleMouseLeave);

    return () => {
      container.removeEventListener('mouseenter', handleMouseEnter);
      container.removeEventListener('mouseleave', handleMouseLeave);
      clearTimeout(timeout);
    };
  }, []);

  const renderEffect = (inner: React.ReactNode) => {
    if (!effect || effect === 'none') return inner;

    if (effect === 'fire') {
      return (
        <div className="relative">
          <div className={`absolute inset-0 rounded-full bg-gradient-to-b from-orange-500 via-red-500 to-transparent ${sizeConfig.blur} opacity-60 ${shouldAnimate ? 'animate-pulse' : ''}`} />
          {shouldAnimate && <div className={`absolute inset-0 rounded-full animate-ping bg-gradient-to-b from-yellow-400 to-red-500 opacity-30`} />}
          <div className="relative">{inner}</div>
        </div>
      );
    }

    if (effect === 'basketball') {
      return (
        <div className="relative">
          <div className={`absolute -inset-1 sm:-inset-2 rounded-full ${shouldAnimate ? 'animate-spin' : ''}`} style={{ animationDuration: '3s' }}>
            <div className={`w-full h-full rounded-full border-2 sm:border-[3px] border-orange-500 opacity-50`} />
          </div>
          <div className="relative">{inner}</div>
        </div>
      );
    }

    return inner;
  };

  const renderAccessory = () => {
    if (overlayUrl && overlayUrl !== 'none') {
      return (
        <div className={`absolute ${sizeConfig.top} left-1/2 -translate-x-1/2 z-20 drop-shadow-lg`}>
          <img 
            src={overlayUrl} 
            className={`${sizeConfig.png} object-contain`}
            alt="avatar overlay"
          />
        </div>
      );
    }

    if (!overlay || overlay === 'none') return null;

    if (overlay === 'crown') {
      return (
        <div className={`absolute ${sizeConfig.top} left-1/2 -translate-x-1/2 z-20 drop-shadow-lg`}>
          <svg viewBox="0 0 24 24" className={sizeConfig.svg} fill="#fbbf24">
            <path d="M5 16L3 6l5 4 4-7 4 7 5-4-2 10H5z"/>
            <rect x="5" y="17" width="14" height="3" rx="1"/>
          </svg>
        </div>
      );
    }

    if (overlay === 'halo') {
      return (
        <div className={`absolute ${sizeConfig.top} left-1/2 -translate-x-1/2 z-20 drop-shadow-lg`}>
          <svg viewBox="0 0 24 24" className={sizeConfig.svg} fill="#fef08a">
            <ellipse cx="12" cy="4" rx="8" ry="3"/>
          </svg>
        </div>
      );
    }

    if (overlay === 'horns') {
      return (
        <div className={`absolute ${sizeConfig.top} left-1/2 -translate-x-1/2 z-20 drop-shadow-lg`}>
          <svg viewBox="0 0 24 24" className={sizeConfig.svg} fill="#ef4444">
            <path d="M3 6c0-3 2.5-5 5-5 0 3-2.5 5-5 5z"/>
            <path d="M21 6c0-3-2.5-5-5-5 0 3 2.5 5 5 5z"/>
          </svg>
        </div>
      );
    }

    if (overlay === 'peeking-cat') {
      return (
        <div className={`absolute ${sizeConfig.bottom} ${sizeConfig.right} z-30`}>
          <svg viewBox="0 0 40 30" className={sizeConfig.svg}>
            <ellipse cx="20" cy="22" rx="15" ry="8" fill="#f5a623"/>
            <circle cx="12" cy="20" r="4" fill="#f5a623"/>
            <circle cx="28" cy="20" r="4" fill="#f5a623"/>
            <ellipse cx="20" cy="24" rx="3" ry="2" fill="#ffb6c1"/>
            <circle cx="14" cy="18" r="1.5" fill="#333"/>
            <circle cx="26" cy="18" r="1.5" fill="#333"/>
            <path d="M18 22 Q20 24 22 22" stroke="#333" strokeWidth="1" fill="none"/>
            <path d="M8 8 Q12 16 14 14" stroke="#f5a623" strokeWidth="4" fill="none" strokeLinecap="round"/>
            <path d="M32 8 Q28 16 26 14" stroke="#f5a623" strokeWidth="4" fill="none" strokeLinecap="round"/>
          </svg>
        </div>
      );
    }

    if (overlay === 'ssj-hair') {
      return (
        <div className={`absolute ${sizeConfig.top} left-1/2 -translate-x-1/2 z-20`}>
          <svg viewBox="0 0 40 30" className={sizeConfig.svg}>
            <path d="M5 22 L2 8 L8 14 L10 2 L14 16 L20 0 L26 16 L30 2 L32 14 L38 8 L35 22" 
                  fill="#facc15" stroke="#eab308" strokeWidth="0.5" strokeLinejoin="round"/>
            <path d="M8 24 L4 14 L10 18 L14 10 L20 14 L26 10 L30 18 L36 14 L32 24 Z" 
                  fill="#facc15" stroke="#eab308" strokeWidth="0.5"/>
          </svg>
        </div>
      );
    }

    return null;
  };

  const getStatusColor = () => {
    switch (status) {
      case 'online': return 'bg-emerald-500';
      case 'away': return 'bg-yellow-500';
      case 'busy': return 'bg-red-500';
      case 'dnd': return 'bg-red-600';
      default: return 'bg-zinc-600';
    }
  };

  return (
    <div 
      ref={containerRef}
      className={`relative inline-block ${className} ${onClick ? 'cursor-pointer' : ''}`}
      onClick={onClick}
    >
      {renderEffect(
        <>
          <img
            src={avatarUrl}
            className={`${SIZE_CLASSES[size]} rounded-full object-cover shadow-lg ${
              effect === 'fire' ? `${sizeConfig.ring} ring-orange-500/50` : 
              effect === 'basketball' ? `${sizeConfig.ring} ring-orange-500/30` : ''
            }`}
            alt={profile?.username || username || ''}
          />
          {renderAccessory()}
        </>
      )}
      {showStatus && (
        <div className={`absolute -bottom-0.5 -right-0.5 ${STATUS_DOT_SIZE[size]} ${getStatusColor()} rounded-full border-2 border-zinc-900 shadow-lg z-10`} />
      )}
    </div>
  );
}
