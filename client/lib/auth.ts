export function getToken(): string | null {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem('igs_token');
}

export function setToken(token: string): void {
  localStorage.setItem('igs_token', token);
}

export function getStoredUser(): { id: number; name: string; email: string; role: string } | null {
  if (typeof window === 'undefined') return null;
  try {
    const u = localStorage.getItem('igs_user');
    return u ? JSON.parse(u) : null;
  } catch { return null; }
}

export function setStoredUser(user: object): void {
  localStorage.setItem('igs_user', JSON.stringify(user));
}

export function clearAuth(): void {
  localStorage.removeItem('igs_token');
  localStorage.removeItem('igs_user');
}
