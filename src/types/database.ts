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
}

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
