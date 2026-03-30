export type UserStatus = 'online' | 'away' | 'busy' | 'dnd' | 'offline';

export interface Profile {
  id: string;
  username: string;
  avatar_url: string;
  status?: UserStatus;
  bio?: string;
  avatar_effect?: string;
  avatar_overlays?: string;
  last_seen?: string;
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
