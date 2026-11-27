// Small fetch wrapper: attaches the access token, refreshes it once on a
// 401, and surfaces API error messages.

import type { TokenPair } from './types';

const API_URL = import.meta.env.VITE_API_URL ?? 'http://localhost:8080';

const ACCESS_KEY = 'biblio.access_token';
const REFRESH_KEY = 'biblio.refresh_token';

export function getAccessToken(): string | null {
  return localStorage.getItem(ACCESS_KEY);
}

export function getRefreshToken(): string | null {
  return localStorage.getItem(REFRESH_KEY);
}

export function storeTokens(tokens: TokenPair): void {
  localStorage.setItem(ACCESS_KEY, tokens.access_token);
  localStorage.setItem(REFRESH_KEY, tokens.refresh_token);
}

export function clearTokens(): void {
  localStorage.removeItem(ACCESS_KEY);
  localStorage.removeItem(REFRESH_KEY);
}

export class ApiError extends Error {
  status: number;

  constructor(status: number, message: string) {
    super(message);
    this.status = status;
  }
}

let refreshing: Promise<boolean> | null = null;

async function tryRefresh(): Promise<boolean> {
  const refreshToken = getRefreshToken();
  if (!refreshToken) return false;
  try {
    const res = await fetch(`${API_URL}/auth/refresh`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ refresh_token: refreshToken }),
    });
    if (!res.ok) return false;
    const tokens: TokenPair = await res.json();
    storeTokens(tokens);
    return true;
  } catch {
    return false;
  }
}

async function rawRequest<T>(
  method: string,
  path: string,
  body?: unknown,
): Promise<T> {
  const headers: Record<string, string> = {};
  const token = getAccessToken();
  if (token) headers.Authorization = `Bearer ${token}`;
  if (body !== undefined) headers['Content-Type'] = 'application/json';

  const res = await fetch(`${API_URL}${path}`, {
    method,
    headers,
    body: body === undefined ? undefined : JSON.stringify(body),
  });

  if (res.status === 204) return undefined as T;

  const text = await res.text();
  const data = text ? JSON.parse(text) : undefined;
  if (!res.ok) {
    const message =
      (data && typeof data.error === 'string' && data.error) ||
      `request failed with status ${res.status}`;
    throw new ApiError(res.status, message);
  }
  return data as T;
}

export async function request<T>(
  method: string,
  path: string,
  body?: unknown,
): Promise<T> {
  try {
    return await rawRequest<T>(method, path, body);
  } catch (err) {
    if (err instanceof ApiError && err.status === 401 && getRefreshToken()) {
      refreshing ??= tryRefresh().finally(() => {
        refreshing = null;
      });
      if (await refreshing) {
        return rawRequest<T>(method, path, body);
      }
      clearTokens();
    }
    throw err;
  }
}

export const api = {
  get: <T>(path: string) => request<T>('GET', path),
  post: <T>(path: string, body?: unknown) => request<T>('POST', path, body),
  patch: <T>(path: string, body?: unknown) => request<T>('PATCH', path, body),
};
