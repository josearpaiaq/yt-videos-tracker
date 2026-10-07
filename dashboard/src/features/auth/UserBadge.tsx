import { LogOut } from 'lucide-react'
import { useI18n } from '@/i18n'
import type { User } from '@/lib/api'
import { useLogout } from '@/lib/queries'

/** Avatar and name of the signed-in user, with a sign-out button. */
export function UserBadge({ user }: { user: User }) {
  const { t } = useI18n()
  const logout = useLogout()

  return (
    <div className="flex items-center gap-2 px-3">
      {user.avatar_url && (
        <img
          src={user.avatar_url}
          alt=""
          className="size-7 rounded-full"
          referrerPolicy="no-referrer"
        />
      )}
      <span className="min-w-0 flex-1 truncate text-sm text-zinc-600 dark:text-zinc-400">
        {user.name || user.email}
      </span>
      <button
        type="button"
        onClick={() => logout.mutate()}
        aria-label={t.signOut}
        title={t.signOut}
        className="rounded-md p-1.5 text-zinc-500 hover:bg-zinc-200 hover:text-zinc-900 dark:hover:bg-zinc-800 dark:hover:text-zinc-100"
      >
        <LogOut className="size-4" />
      </button>
    </div>
  )
}
