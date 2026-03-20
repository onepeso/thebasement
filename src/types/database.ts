export interface Profile {
  id: string;
  username: string;
  avatar_url: string;
}

export interface Message {
  id: string;
  text: string;
  channel_id: string;
  user_id: string;
  created_at: string;
  profiles?: Profile;
  usernames?: Profile;
}

export interface Channel {
  id: string;
  name: string;
  slug: string;
}
