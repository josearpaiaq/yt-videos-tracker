export type VideoStatus = 'pending' | 'watching' | 'done'

export interface User {
  id: number
  email: string
  name: string
  avatar_url: string
  language: '' | 'en' | 'es'
  theme: 'system' | 'light' | 'dark'
}

export type Preferences = Partial<Pick<User, 'language' | 'theme'>>

export interface List {
  id: number
  name: string
  created_at: string
  updated_at: string
}

export interface Video {
  id: number
  youtube_id: string
  title: string
  channel: string
  thumbnail_url: string
  duration_seconds: number
  position_seconds: number
  status: VideoStatus
  notes: string
  list_id: number | null
  created_at: string
  updated_at: string
}

export type VideoPatch = Partial<Pick<Video, 'position_seconds' | 'status' | 'notes' | 'list_id'>>

export class ApiError extends Error {
  readonly status: number

  constructor(status: number, message: string) {
    super(message)
    this.status = status
  }
}

let onUnauthorized = () => {}

/** Registers what to do when the session can no longer be refreshed. */
export function setUnauthorizedHandler(handler: () => void) {
  onUnauthorized = handler
}

let refreshing: Promise<boolean> | null = null

// Concurrent 401s share a single refresh request.
function refreshSession(): Promise<boolean> {
  refreshing ??= fetch('/api/auth/refresh', { method: 'POST' })
    .then((res) => res.ok)
    .finally(() => (refreshing = null))
  return refreshing
}

async function request<T>(path: string, init?: RequestInit, retry = true): Promise<T> {
  const res = await fetch(`/api${path}`, {
    ...init,
    headers: { 'Content-Type': 'application/json', ...init?.headers },
  })
  if (res.status === 401 && retry && !path.startsWith('/auth/')) {
    if (await refreshSession()) return request(path, init, false)
    onUnauthorized()
  }
  if (!res.ok) {
    const body = await res.json().catch(() => null)
    throw new ApiError(res.status, body?.error ?? res.statusText)
  }
  return res.status === 204 ? (undefined as T) : res.json()
}

export const api = {
  me: () => request<User>('/me'),
  updateMe: (prefs: Preferences) =>
    request<User>('/me', { method: 'PATCH', body: JSON.stringify(prefs) }),
  loginWithGoogle: (credential: string) =>
    request<User>('/auth/google', { method: 'POST', body: JSON.stringify({ credential }) }),
  logout: () => request<void>('/auth/logout', { method: 'POST' }),

  getLists: () => request<List[]>('/lists'),
  createList: (name: string) =>
    request<List>('/lists', { method: 'POST', body: JSON.stringify({ name }) }),
  renameList: (id: number, name: string) =>
    request<List>(`/lists/${id}`, { method: 'PATCH', body: JSON.stringify({ name }) }),
  deleteList: (id: number) => request<void>(`/lists/${id}`, { method: 'DELETE' }),

  getVideos: () => request<Video[]>('/videos'),
  createVideo: (url: string, listId: number | null) =>
    request<Video>('/videos', {
      method: 'POST',
      body: JSON.stringify({ url, list_id: listId }),
    }),
  updateVideo: (id: number, patch: VideoPatch) =>
    request<Video>(`/videos/${id}`, { method: 'PATCH', body: JSON.stringify(patch) }),
  deleteVideo: (id: number) => request<void>(`/videos/${id}`, { method: 'DELETE' }),
}
