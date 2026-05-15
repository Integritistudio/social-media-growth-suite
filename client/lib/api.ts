import axios from 'axios';
import { getToken, clearAuth } from './auth';
import type {
  BusinessProfile, IgPost, IgTotals, DmConversation, ConversionEntry, ImportantDM, ThemeSettings, User,
  OAuthStatus, GeneratedPost, PostStatus, PostPlatform,
  LinkedInAutomationSettingsDto, LinkedInCampaign, LinkedInProspect, LinkedInOutreachAction,
} from './types';

const api = axios.create({ baseURL: '/api', timeout: 90000 });

api.interceptors.request.use(cfg => {
  const token = getToken();
  if (token) cfg.headers.Authorization = `Bearer ${token}`;
  return cfg;
});

api.interceptors.response.use(
  r => r,
  err => {
    if (err.response?.status === 401 && typeof window !== 'undefined') {
      clearAuth();
      window.location.href = '/login';
    }
    return Promise.reject(err);
  }
);

// ── Auth ─────────────────────────────────────────────────────
export async function login(email: string, password: string) {
  const { data } = await api.post('/auth/login', { email, password });
  return data as { token: string; user: User };
}
export async function register(name: string, email: string, password: string) {
  const { data } = await api.post('/auth/register', { name, email, password });
  return data as { token: string; user: User };
}
export async function getMe() {
  const { data } = await api.get('/auth/me');
  return data as User;
}

// ── AI ───────────────────────────────────────────────────────
export async function getAIProvider(): Promise<{ provider: string }> {
  const { data } = await api.get('/ai/provider');
  return data;
}
export async function analyseWebsite(url: string): Promise<Partial<BusinessProfile>> {
  const { data } = await api.post('/ai/analyse-website', { url });
  return data;
}
export async function getTrackerFeedback(igData: Record<string, unknown>, profile: Partial<BusinessProfile>) {
  const { data } = await api.post('/ai/tracker-feedback', { igData, profile });
  return data as { analysis: string };
}
export async function buildFunnelStrategy(inputs: {
  bottleneck: string; freq: string; goal: string; followers: string; context: string; profile: Partial<BusinessProfile>;
}) {
  const { data } = await api.post('/ai/funnel-strategy', inputs);
  return data as { strategy: string };
}
export async function generateContent(tool: string, input: string, style: string, profile: Partial<BusinessProfile>) {
  const { data } = await api.post('/ai/generate-content', { tool, input, style, profile });
  return data as { content: string; imageSuggestion: string; dallePrompt: string; htmlLayout: string; provider: string };
}
export async function generateImageApi(prompt: string, htmlLayout?: string, profile?: Partial<BusinessProfile>) {
  const { data } = await api.post('/ai/generate-image', { prompt, htmlLayout, profile });
  return data as { imageData?: string; mimeType?: string; provider: string; renderOnClient?: boolean; html?: string };
}
export async function saveImageApi(imageData: string, tool: string, prompt: string) {
  const { data } = await api.post('/ai/save-image', { imageData, tool, prompt });
  return data as { success: boolean; id: number };
}

// ── Business ─────────────────────────────────────────────────
export async function getBusinessProfile() {
  const { data } = await api.get('/business/profile');
  return data as Partial<BusinessProfile>;
}
export async function saveBusinessProfile(profile: Partial<BusinessProfile>) {
  const { data } = await api.post('/business/profile', { ...profile, igHandle: profile.igHandle });
  return data;
}

// ── Tracker ──────────────────────────────────────────────────
export async function getTrackerEntries() {
  const { data } = await api.get('/tracker/entries');
  return data as { entries: ConversionEntry[]; summary: { totalImpressions: number; totalDMs: number; avgConversion: number } };
}
export async function addTrackerEntry(entry: { date: string; impressions: number; dms: number; notes?: string }) {
  const { data } = await api.post('/tracker/entries', entry);
  return data as ConversionEntry;
}
export async function deleteTrackerEntry(id: number) {
  await api.delete(`/tracker/entries/${id}`);
}
export async function getImportantDMs() {
  const { data } = await api.get('/tracker/important-dms');
  return data as ImportantDM[];
}
export async function addImportantDM(dm: { name: string; title?: string; notes?: string; ig_user_id?: string }) {
  const { data } = await api.post('/tracker/important-dms', dm);
  return data as ImportantDM;
}
export async function deleteImportantDM(id: number) {
  await api.delete(`/tracker/important-dms/${id}`);
}

// ── Social ───────────────────────────────────────────────────
export async function fetchInstagramPosts(accountId?: string, token?: string) {
  const { data } = await api.get('/social/instagram/posts', { params: { accountId, token } });
  return data as { posts: IgPost[]; totals: IgTotals };
}
export async function fetchInstagramDMs(accountId?: string, token?: string) {
  const { data } = await api.get('/social/instagram/dms', { params: { accountId, token } });
  return data as { conversations: DmConversation[] };
}
export async function publishToInstagram(imageUrl: string, caption: string) {
  const { data } = await api.post('/social/instagram/publish', { imageUrl, caption });
  return data as { success: boolean; mediaId: string };
}
export async function publishToLinkedIn(caption: string) {
  const { data } = await api.post('/social/linkedin/publish', { caption });
  return data as { success: boolean; postId: string };
}

// ── Admin ────────────────────────────────────────────────────
export async function getAdminUsers() {
  const { data } = await api.get('/admin/users');
  return data as User[];
}
export async function updateAdminUser(id: number, updates: Partial<{ role: string; is_active: boolean }>) {
  const { data } = await api.put(`/admin/users/${id}`, updates);
  return data;
}
export async function deleteAdminUser(id: number) {
  await api.delete(`/admin/users/${id}`);
}
export async function getAdminAISettings() {
  const { data } = await api.get('/admin/ai-settings');
  return data;
}
export async function saveAdminAISettings(settings: Record<string, unknown>) {
  const { data } = await api.put('/admin/ai-settings', settings);
  return data;
}

// ── Posts ─────────────────────────────────────────────────────
export async function getPosts(page = 1, status?: PostStatus) {
  const { data } = await api.get('/posts', { params: { page, limit: 20, status } });
  return data as { posts: GeneratedPost[]; total: number; page: number; pages: number };
}
export async function getPost(id: number) {
  const { data } = await api.get(`/posts/${id}`);
  return data as GeneratedPost;
}
export async function savePost(payload: {
  content: string; imageData?: string; tool: string; prompt?: string;
  platform?: PostPlatform; status?: PostStatus; aiProvider?: string;
}) {
  const { data } = await api.post('/posts', payload);
  return data as { success: boolean; id: number };
}
export async function updatePost(id: number, updates: Partial<GeneratedPost>) {
  const { data } = await api.put(`/posts/${id}`, updates);
  return data;
}
export async function deletePost(id: number) {
  await api.delete(`/posts/${id}`);
}
export async function refreshPostMetrics(id: number) {
  const { data } = await api.post(`/posts/${id}/refresh-metrics`);
  return data as { success: boolean; post: GeneratedPost };
}

// ── OAuth ─────────────────────────────────────────────────────
export function getOAuthConnectUrl(platform: 'instagram' | 'linkedin'): string {
  const token = getToken();
  // We navigate to backend which redirects to OAuth provider.
  // JWT is passed via Authorization header — but since this is a browser redirect
  // we embed it in the query. The backend reads req.query.token as fallback.
  return `/api/oauth/${platform}/connect?token=${token}`;
}
export async function getOAuthStatus(): Promise<OAuthStatus> {
  const { data } = await api.get('/oauth/status');
  return data;
}
export async function disconnectOAuth(platform: 'instagram' | 'linkedin') {
  await api.delete(`/oauth/${platform}/disconnect`);
}

// ── Public Settings (no auth) ────────────────────────────────
export async function getPublicSettings() {
  const { data } = await axios.get('/api/settings/public');
  return data as ThemeSettings;
}

// ── LinkedIn automation (admin) ───────────────────────────────
export async function getLinkedInAutomationSettings() {
  const { data } = await api.get('/linkedin-automation/settings');
  return data as LinkedInAutomationSettingsDto;
}
export async function saveLinkedInAutomationSettings(linkedinEmail: string, linkedinPassword: string) {
  const { data } = await api.put('/linkedin-automation/settings', { linkedinEmail, linkedinPassword });
  return data as { success: boolean };
}
export async function deleteLinkedInAutomationSettings() {
  const { data } = await api.delete('/linkedin-automation/settings');
  return data as { success: boolean };
}
export async function getLinkedInAutomationMeta() {
  const { data } = await api.get('/linkedin-automation/meta/roles');
  return data as { roles: string[]; maxInvitesCap: number };
}
export async function listLinkedInCampaigns() {
  const { data } = await api.get('/linkedin-automation/campaigns');
  return data as LinkedInCampaign[];
}
export async function createLinkedInCampaign(body: {
  searchQuery: string;
  targetRole: string;
  maxInvites: number;
  inviteNote: string;
}) {
  const { data } = await api.post('/linkedin-automation/campaigns', body);
  return data as LinkedInCampaign;
}
export async function updateLinkedInCampaign(
  id: number,
  body: Partial<{ searchQuery: string; targetRole: string; maxInvites: number; inviteNote: string }>
) {
  const { data } = await api.put(`/linkedin-automation/campaigns/${id}`, body);
  return data as LinkedInCampaign;
}
export async function deleteLinkedInCampaign(id: number) {
  const { data } = await api.delete(`/linkedin-automation/campaigns/${id}`);
  return data as { success: boolean };
}
export async function startLinkedInCampaign(id: number) {
  const { data } = await api.post(`/linkedin-automation/campaigns/${id}/start`);
  return data as { success: boolean; campaign: LinkedInCampaign };
}
export async function pauseLinkedInCampaign(id: number) {
  const { data } = await api.post(`/linkedin-automation/campaigns/${id}/pause`);
  return data as { success: boolean };
}
export async function listLinkedInProspects(campaignId: number) {
  const { data } = await api.get(`/linkedin-automation/campaigns/${campaignId}/prospects`);
  return data as LinkedInProspect[];
}
export async function listLinkedInOutreachActions(campaignId: number) {
  const { data } = await api.get(`/linkedin-automation/campaigns/${campaignId}/actions`);
  return data as LinkedInOutreachAction[];
}

export default api;
