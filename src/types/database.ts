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
