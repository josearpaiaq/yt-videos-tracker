import { ExternalLink, Loader2 } from 'lucide-react';
import { DASHBOARD_URL } from '@/lib/config';
import type { Messages } from '@/lib/i18n';

/** Brand, a subtle sync indicator while reconciling with the API, and the dashboard link. */
export function Header({ t, syncing }: { t: Messages; syncing: boolean }) {
  return (
    <header className="mb-4 flex items-center gap-2">
      <img src="/icon/32.png" alt="" className="size-5" />
      <span className="font-bold tracking-tight">Where Was I</span>
      {syncing && (
        <span title={t.syncing} role="status" aria-label={t.syncing}>
          <Loader2 className="size-3.5 animate-spin text-zinc-400" />
        </span>
      )}
      <a
        href={DASHBOARD_URL}
        target="_blank"
        rel="noreferrer"
        className="ml-auto inline-flex items-center gap-1 text-xs text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-100"
      >
        {t.dashboard}
        <ExternalLink className="size-3" />
      </a>
    </header>
  );
}
