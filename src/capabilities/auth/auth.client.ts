import { apiGet, apiPost } from '@/services/apiClient';

export interface AdminLoginResult {
  isAuthenticated: boolean;
  errorMessage?: string;
}

export async function authenticateAdmin(password: string): Promise<AdminLoginResult> {
  const response = await fetch('/api/auth/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ password }),
  });
  if (response.ok) return { isAuthenticated: true };

  const data = await response.json() as { error?: { message?: string } };
  return {
    isAuthenticated: false,
    errorMessage: data.error?.message ?? 'Invalid password',
  };
}

export async function login(password: string): Promise<boolean> {
  const response = await apiPost<void>('/api/auth/login', { password });
  return response.success;
}

export async function logout(): Promise<void> {
  await apiPost<void>('/api/auth/logout', {});
}

export async function requestLogout(): Promise<void> {
  await fetch('/api/auth/logout', { method: 'POST' });
}

export async function checkSession(): Promise<boolean> {
  const response = await apiGet<{ authenticated: boolean }>('/api/auth/session');
  return response.success && (response.data?.authenticated ?? false);
}
