import { MonitorPlay } from 'lucide-react';
import type { Messages } from '@/lib/i18n';

export function NoVideoView({ t }: { t: Messages }) {
  return (
    <div className="flex gap-3 text-zinc-600 dark:text-zinc-400">
      <MonitorPlay className="size-5 shrink-0" />
      <p>{t.noVideo}</p>
    </div>
  );
}
