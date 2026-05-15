export interface BusinessProfile {
  name: string;
  niche: string;
  what: string;
  services: string;
  target: string;
  usp: string;
  tone: string;
  igHandle: string;
}

export interface IgInsights {
  impressions: number;
  reach: number;
  engagement: number;
  saved: number;
}

export interface IgPost {
  id: string;
  caption: string;
  media_type: string;
  media_url: string;
  thumbnail_url?: string;
  permalink: string;
  timestamp: string;
  like_count: number;
  comments_count: number;
  insights: IgInsights;
}

export interface DmParticipant { name: string; email?: string }
export interface DmMessage {
  message: string;
  from: { name: string; email?: string };
  created_time: string;
}
export interface DmConversation {
  id: string;
  participants: { data: DmParticipant[] };
  messages?: { data: DmMessage[] };
  updated_time: string;
  unread_count?: number;
}

export interface IgTotals {
  impressions: number;
  reach: number;
  engagement: number;
  saved: number;
  posts: number;
}

export interface IgState {
  posts: IgPost[];
  totals: IgTotals;
  conversations: DmConversation[];
  lastFetched: string | null;
  loading: boolean;
  error: string | null;
}

export interface AppSettings {
  isSet: { claudeKey: boolean; openaiKey: boolean; metaToken: boolean; igAccountId: boolean; linkedinToken: boolean; linkedinUrn: boolean };
  keys: { claudeKey: string; openaiKey: string; metaToken: string; igAccountId: string; linkedinToken: string; linkedinUrn: string };
}

export interface User {
  id: number;
  name: string;
  email: string;
  role: 'admin' | 'user';
  is_active?: boolean;
  created_at?: string;
}

export interface ConversionEntry {
  id: number;
  date: string;
  impressions: number;
  dms: number;
  conversion_rate: number;
  notes?: string;
}

export interface ImportantDM {
  id: number;
  ig_user_id?: string;
  name: string;
  title?: string;
  notes?: string;
  source?: string;
  created_at: string;
}

export interface ThemeSettings {
  provider: string;
  themePrimary: string;
  themeSecondary: string;
  themeButton: string;
  themeMode: 'dark' | 'light';
  font: string;
}

export type PostStatus = 'draft' | 'scheduled' | 'posted';
export type PostPlatform = 'instagram' | 'linkedin' | 'both';

export interface GeneratedPost {
  id: number;
  user_id: number;
  tool: string;
  content: string;
  image_data?: string;
  image_type?: string;
  prompt?: string;
  ai_provider?: string;
  status: PostStatus;
  platform: PostPlatform;
  posted_at?: string;
  ig_post_id?: string;
  ig_impressions: number;
  ig_reach: number;
  ig_likes: number;
  ig_comments: number;
  ig_saved: number;
  li_post_id?: string;
  li_impressions: number;
  li_likes: number;
  li_comments: number;
  li_reposts: number;
  metrics_updated_at?: string;
  created_at: string;
}

export interface SocialConnectionStatus {
  connected: boolean;
  account_id?: string;
  account_name?: string;
  account_pic?: string;
  expires?: string;
}

export interface OAuthStatus {
  instagram?: SocialConnectionStatus;
  linkedin?: SocialConnectionStatus;
}

export type LinkedInCampaignStatus =
  | 'draft' | 'queued' | 'running' | 'paused' | 'completed' | 'failed';

export interface LinkedInAutomationSettingsDto {
  hasCredentials: boolean;
  linkedinEmailHint: string;
  lastLoginAt: string | null;
  lastLoginError: string | null;
}

export interface LinkedInCampaign {
  id: number;
  user_id: number;
  search_query: string;
  target_role: string;
  max_invites: number;
  invite_note: string;
  status: LinkedInCampaignStatus;
  error_message: string | null;
  run_requested_at: string | null;
  started_at: string | null;
  finished_at: string | null;
  invites_sent: number;
  cancel_requested?: boolean;
  created_at: string;
  updated_at: string;
}

export interface LinkedInProspect {
  id: number;
  campaign_id: number;
  company_name: string | null;
  company_url: string | null;
  person_name: string;
  person_url: string;
  title: string | null;
  dedupe_key: string;
  created_at: string;
}

export interface LinkedInOutreachAction {
  id: number;
  campaign_id: number;
  prospect_id: number | null;
  status: 'queued' | 'sent' | 'skipped' | 'failed';
  error_code: string | null;
  detail: string | null;
  created_at: string;
}
