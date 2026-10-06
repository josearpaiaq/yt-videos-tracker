import { API_URL } from './config';

export type VideoStatus = 'pending' | 'watching' | 'done';

export interface User {
  id: number;
  email: string;
  name: string;
  avatar_url: string;
}

export interface List {
  id: number;
  name: string;
}

export interface Video {
  id: number;
  youtube_id: string;
  title: string;
  channel: string;
  thumbnail_url: string;
  duration_seconds: number;
  position_seconds: number;
  status: VideoStatus;
  notes: string;
  list_id: number | null;
}

export type VideoPatch = Partial<Pick<Video, 'position_seconds' | 'status' | 'list_id'>>;

export class ApiError extends Error {
  readonly status: number;

  constructor(status: number, message: string) {
    super(message);
    this.status = status;
  }
}

let refreshing: Promise<boolean> | null = null;

// Concurrent 401s share a single refresh request.
function refreshSession(): Promise<boolean> {
  refreshing ??= fetch(`${API_URL}/api/auth/refresh`, { method: 'POST', credentials: 'include' })
    .then((res) => res.ok)
    .catch(() => false)
    .finally(() => (refreshing = null));
  return refreshing;
}

async function request<T>(path: string, init?: RequestInit, retry = true): Promise<T> {
  const res = await fetch(`${API_URL}/api${path}`, {
    ...init,
    credentials: 'include',
    headers: { 'Content-Type': 'application/json', ...init?.headers },
  });
  if (res.status === 401 && retry && (await refreshSession())) {
    return request(path, init, false);
  }
  if (!res.ok) {
    const body = await res.json().catch(() => null);
    throw new ApiError(res.status, body?.error ?? res.statusText);
  }
  return res.status === 204 ? (undefined as T) : res.json();
}

export const api = {
  me: () => request<User>('/me'),
  getLists: () => request<List[]>('/lists'),
  findVideo: async (youtubeId: string) => {
    const videos = await request<Video[]>(`/videos?youtube_id=${encodeURIComponent(youtubeId)}`);
    return videos[0] ?? null;
  },
  createVideo: (url: string, listId: number | null) =>
    request<Video>('/videos', { method: 'POST', body: JSON.stringify({ url, list_id: listId }) }),
  updateVideo: (id: number, patch: VideoPatch) =>
    request<Video>(`/videos/${id}`, { method: 'PATCH', body: JSON.stringify(patch) }),
};
