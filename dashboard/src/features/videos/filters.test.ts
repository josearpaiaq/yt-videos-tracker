import { describe, expect, it } from 'vitest'
import type { Video } from '@/lib/api'
import { matchVideos, normalize, sorters, statusMatchers } from './filters'

const video = (overrides: Partial<Video>): Video => ({
  id: 1,
  youtube_id: 'dQw4w9WgXcQ',
  title: 'Video',
  channel: 'Channel',
  thumbnail_url: '',
  duration_seconds: 600,
  position_seconds: 0,
  status: 'pending',
  notes: '',
  list_id: null,
  created_at: '2026-01-01T00:00:00Z',
  updated_at: '2026-01-01T00:00:00Z',
  ...overrides,
})

const ids = (videos: Video[]) => videos.map((v) => v.id)

describe('normalize', () => {
  it('lowercases and strips accents', () => {
    expect(normalize('Canción ÁRBOL')).toBe('cancion arbol')
  })
})

describe('matchVideos', () => {
  const videos = [
    video({ id: 1, title: 'Introducción a Go', list_id: 1 }),
    video({ id: 2, title: 'Kafka', channel: 'Torti Code', list_id: 2 }),
    video({ id: 3, title: 'AWS course', list_id: null }),
  ]

  it('filters by list', () => {
    expect(ids(matchVideos(videos, 'all', ''))).toEqual([1, 2, 3])
    expect(ids(matchVideos(videos, 'none', ''))).toEqual([3])
    expect(ids(matchVideos(videos, 2, ''))).toEqual([2])
  })

  it('matches title or channel, ignoring case and accents', () => {
    expect(ids(matchVideos(videos, 'all', 'introduccion'))).toEqual([1])
    expect(ids(matchVideos(videos, 'all', '  torti '))).toEqual([2])
    expect(ids(matchVideos(videos, 1, 'kafka'))).toEqual([])
  })
})

describe('statusMatchers', () => {
  it('treats active as anything not done', () => {
    const videos = [
      video({ id: 1, status: 'pending' }),
      video({ id: 2, status: 'watching' }),
      video({ id: 3, status: 'done' }),
    ]
    expect(ids(videos.filter(statusMatchers.active))).toEqual([1, 2])
    expect(ids(videos.filter(statusMatchers.done))).toEqual([3])
    expect(ids(videos.filter(statusMatchers.all))).toEqual([1, 2, 3])
  })
})

describe('sorters', () => {
  const videos = [
    video({ id: 1, title: 'B', position_seconds: 300, duration_seconds: 600, updated_at: '2026-01-02T00:00:00Z' }),
    video({ id: 2, title: 'A', position_seconds: 60, duration_seconds: 100, updated_at: '2026-01-03T00:00:00Z' }),
    video({ id: 3, title: 'C', position_seconds: 0, duration_seconds: 0, updated_at: '2026-01-01T00:00:00Z' }),
  ]
  const sorted = (sort: keyof typeof sorters) => ids([...videos].sort(sorters[sort]))

  it('orders by most recent update', () => expect(sorted('recent')).toEqual([2, 1, 3]))
  it('orders by progress, unknown duration last', () => expect(sorted('progress')).toEqual([2, 1, 3]))
  it('orders by least time left, unknown duration last', () =>
    expect(sorted('remaining')).toEqual([2, 1, 3]))
  it('orders by title', () => expect(sorted('title')).toEqual([2, 1, 3]))
})
