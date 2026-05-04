import { BusinessProfile, IgState } from './types';

const PROFILE_KEY = 'igs_profile';
const IG_DATA_KEY = 'igs_ig_data';

export function getProfile(): BusinessProfile | null {
  if (typeof window === 'undefined') return null;
  try {
    const raw = localStorage.getItem(PROFILE_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

export function saveProfile(profile: BusinessProfile): void {
  if (typeof window === 'undefined') return;
  localStorage.setItem(PROFILE_KEY, JSON.stringify(profile));
}

export function clearProfile(): void {
  if (typeof window === 'undefined') return;
  localStorage.removeItem(PROFILE_KEY);
}

export function cacheIgData(data: Partial<IgState>): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(IG_DATA_KEY, JSON.stringify({ ...data, lastFetched: new Date().toISOString() }));
  } catch {
    // Storage might be full
  }
}

export function getCachedIgData(): Partial<IgState> | null {
  if (typeof window === 'undefined') return null;
  try {
    const raw = localStorage.getItem(IG_DATA_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}
