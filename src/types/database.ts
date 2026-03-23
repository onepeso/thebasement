export type UserStatus = 'online' | 'away' | 'busy' | 'dnd' | 'offline';

export interface Profile {
  id: string;
  username: string;
  avatar_url: string;
  status?: UserStatus;
  bio?: string;
  avatar_effect?: string;
  avatar_overlays?: string;
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
}

export interface Thread {
  id: string;
  channel_id: string;
  root_message_id: string;
  created_by: string;
  created_at: string;
  reply_count: number;
  last_reply_at: string;
  root_message?: any;
}

export interface Channel {
  id: string;
  name: string;
  slug: string;
}

export interface DirectMessage {
  id: string;
  user1_id: string;
  user2_id: string;
  created_at: string;
  last_message_at: string;
  user1?: Profile;
  user2?: Profile;
  last_message?: DMMessage;
  other_user?: Profile;
}

export interface DMMessage {
  id: string;
  dm_id: string;
  sender_id: string;
  text: string;
  created_at: string;
  updated_at: string;
  profiles?: Profile;
}
