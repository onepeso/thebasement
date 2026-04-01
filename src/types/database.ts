export type UserStatus = 'online' | 'away' | 'busy' | 'dnd' | 'offline';

export interface Profile {
  id: string;
  username: string;
  avatar_url: string;
  status?: UserStatus;
  bio?: string;
  avatar_effect?: string;
  avatar_overlays?: string;
  avatar_overlay_url?: string;
  last_seen?: string;
  highlighted_badges?: string[];
  font_style?: string;
  text_color?: string;
}

export const FONT_STYLES = [
  { id: 'default', name: 'Default', fontFamily: 'inherit', sample: 'Abc' },
  { id: 'bold', name: 'Bold', fontFamily: 'inherit', fontWeight: 'bold', sample: 'Abc' },
  { id: 'italic', name: 'Italic', fontFamily: 'inherit', fontStyle: 'italic', sample: 'Abc' },
  { id: 'mono', name: 'Mono', fontFamily: 'ui-monospace, monospace', sample: 'Abc' },
  { id: 'pixel', name: 'Pixel', fontFamily: 'Press Start 2P, cursive', sample: 'Ab' },
  { id: 'retro', name: 'Retro', fontFamily: 'Courier New, monospace', sample: 'Abc' },
  { id: 'fancy', name: 'Fancy', fontFamily: 'Georgia, serif', sample: 'Abc' },
  { id: 'handwriting', name: 'Handwriting', fontFamily: 'Comic Sans MS, cursive', sample: 'Abc' },
] as const;

export const TEXT_COLORS = [
  { id: 'default', name: 'Default', color: '#818cf8' },
  { id: 'white', name: 'White', color: '#ffffff' },
  { id: 'red', name: 'Red', color: '#ef4444' },
  { id: 'orange', name: 'Orange', color: '#f97316' },
  { id: 'amber', name: 'Amber', color: '#f59e0b' },
  { id: 'yellow', name: 'Yellow', color: '#eab308' },
  { id: 'lime', name: 'Lime', color: '#84cc16' },
  { id: 'green', name: 'Green', color: '#22c55e' },
  { id: 'emerald', name: 'Emerald', color: '#10b981' },
  { id: 'teal', name: 'Teal', color: '#14b8a6' },
  { id: 'cyan', name: 'Cyan', color: '#06b6d4' },
  { id: 'blue', name: 'Blue', color: '#3b82f6' },
  { id: 'indigo', name: 'Indigo', color: '#6366f1' },
  { id: 'violet', name: 'Violet', color: '#8b5cf6' },
  { id: 'purple', name: 'Purple', color: '#a855f7' },
  { id: 'fuchsia', name: 'Fuchsia', color: '#d946ef' },
  { id: 'pink', name: 'Pink', color: '#ec4899' },
  { id: 'rose', name: 'Rose', color: '#f43f5e' },
] as const;

export type FontStyleId = typeof FONT_STYLES[number]['id'];
export type TextColorId = typeof TEXT_COLORS[number]['id'];

export interface Message {
  id: string;
  text: string;
  channel_id: string;
  user_id: string;
  created_at: string;
  thread_id?: string;
  profiles?: Profile;
  usernames?: Profile;
  reply_to_id?: string;
  is_system?: boolean;
  reply_to?: {
    id: string;
    text: string;
    profiles?: Profile;
  };
}

export interface Channel {
  id: string;
  name: string;
  slug: string;
  description?: string;
  emoji?: string;
  color?: string;
  accent_color?: string;
}

export type ChallengeType = 
  | 'login_streak'
  | 'first_message'
  | 'send_messages'
  | 'reactions_given'
  | 'pins_created'
  | 'replies_sent'
  | 'mentions_sent'
  | 'channels_created'
  | 'reactions_received';

export interface Challenge {
  id: string;
  type: ChallengeType;
  title: string;
  description: string;
  goal: number;
  xp_reward: number;
  icon: string;
}

export interface UserChallenge {
  id: string;
  user_id: string;
  challenge_id: string;
  progress: number;
  completed: boolean;
  completed_at?: string;
  challenge?: Challenge;
}

export interface UserChallengeWithChallenge extends UserChallenge {
  challenge: Challenge;
}

export type InviteStatus = 'pending' | 'accepted' | 'declined';

export interface ChannelInvite {
  id: string;
  channel_id: string;
  inviter_id: string;
  invited_user_id: string;
  status: InviteStatus;
  created_at: string;
  channel?: Channel;
  inviter?: Profile;
  invited_user?: Profile;
}

export type MemberRole = 'owner' | 'member';

export interface ChannelMember {
  id: string;
  channel_id: string;
  user_id: string;
  role: MemberRole;
  joined_at: string;
  profile?: Profile;
}

export interface Badge {
  id: string;
  name: string;
  description?: string;
  icon: string;
  color: string;
  requirement_type: string;
  requirement_value: number;
  xp_reward: number;
}

export interface UserBadge {
  id: string;
  user_id: string;
  badge_id: string;
  unlocked_at: string;
  badge?: Badge;
}

export interface BadgeWithStatus extends Badge {
  unlocked: boolean;
  unlocked_at?: string;
}
