const pad = (n: number) => String(n).padStart(2, '0');

/** Formats seconds as "h:mm:ss" (or "m:ss" under an hour). */
export function formatTime(totalSeconds: number): string {
  const total = Math.floor(totalSeconds);
  const h = Math.floor(total / 3600);
  const m = Math.floor((total % 3600) / 60);
  const s = total % 60;
  return h > 0 ? `${h}:${pad(m)}:${pad(s)}` : `${m}:${pad(s)}`;
}
