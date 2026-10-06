const pad = (n: number) => String(n).padStart(2, '0')

/** Formats seconds as "h:mm:ss" (or "m:ss" under an hour). */
export function formatTime(totalSeconds: number): string {
  const h = Math.floor(totalSeconds / 3600)
  const m = Math.floor((totalSeconds % 3600) / 60)
  const s = totalSeconds % 60
  return h > 0 ? `${h}:${pad(m)}:${pad(s)}` : `${m}:${pad(s)}`
}

/**
 * Parses "h:mm:ss", "m:ss" or a bare number of minutes into seconds.
 * Returns null when the input is not a valid time.
 */
export function parseTime(input: string): number | null {
  const value = input.trim()
  if (/^\d+$/.test(value)) return Number(value) * 60

  const parts = value.split(':')
  if (parts.length < 2 || parts.length > 3) return null
  if (!parts.every((p) => /^\d+$/.test(p))) return null

  const nums = parts.map(Number)
  const [s, m, h = 0] = nums.reverse()
  if (s >= 60 || (parts.length === 3 && m >= 60)) return null
  return h * 3600 + m * 60 + s
}

export function youtubeUrl(youtubeId: string, seconds: number): string {
  return `https://www.youtube.com/watch?v=${youtubeId}&t=${seconds}s`
}
