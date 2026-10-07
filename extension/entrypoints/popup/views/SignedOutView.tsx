import { LogIn } from 'lucide-react';
import { DASHBOARD_URL } from '@/lib/config';
import type { Messages } from '@/lib/i18n';

export function SignedOutView({ t }: { t: Messages }) {
  return (
    <div className="space-y-3">
      <p className="text-zinc-600 dark:text-zinc-400">{t.signInPrompt}</p>
      <a
        href={DASHBOARD_URL}
        target="_blank"
        rel="noreferrer"
        className="flex items-center justify-center gap-2 rounded-lg bg-red-600 px-3 py-2 font-semibold text-white hover:bg-red-700"
      >
        <LogIn className="size-4" />
        {t.signIn}
      </a>
    </div>
  );
}
