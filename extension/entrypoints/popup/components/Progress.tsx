import { formatTime } from '@/lib/time';

/** Current position, total duration and a progress bar. */
export function Progress({ position, duration }: { position: number; duration: number }) {
  const percent = duration > 0 ? Math.min(100, (position / duration) * 100) : 0;
  return (
    <div className="space-y-1.5">
      <div className="flex items-baseline justify-between font-mono tabular-nums">
        <span className="text-base font-medium">{formatTime(position)}</span>
        {duration > 0 && <span className="text-xs text-zinc-500">{formatTime(duration)}</span>}
      </div>
      <div className="h-1.5 overflow-hidden rounded-full bg-zinc-200 dark:bg-zinc-800">
        <div className="h-full bg-red-600" style={{ width: `${percent}%` }} />
      </div>
    </div>
  );
}
