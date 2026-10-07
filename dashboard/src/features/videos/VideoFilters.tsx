import { ArrowUpDown, Search } from 'lucide-react'
import { useI18n } from '@/i18n'
import type { Sort, StatusFilter } from './filters'

const fieldClass =
  'w-full rounded-lg border border-zinc-300 bg-white py-1.5 pr-3 pl-8 text-sm outline-none focus:border-red-500 dark:border-zinc-700 dark:bg-zinc-900'

interface Props {
  status: StatusFilter
  counts: Record<StatusFilter, number>
  onStatusChange: (status: StatusFilter) => void
  query: string
  onQueryChange: (query: string) => void
  sort: Sort
  onSortChange: (sort: Sort) => void
}

/** Status tabs plus the search box and sort selector. */
export function VideoFilters({
  status,
  counts,
  onStatusChange,
  query,
  onQueryChange,
  sort,
  onSortChange,
}: Props) {
  const { t } = useI18n()
  const tabs: { value: StatusFilter; label: string }[] = [
    { value: 'active', label: t.toWatch },
    { value: 'done', label: t.done },
    { value: 'all', label: t.all },
  ]

  return (
    <div className="space-y-3">
      <div
        className="flex gap-1 overflow-x-auto border-b border-zinc-200 dark:border-zinc-800"
        role="tablist"
      >
        {tabs.map((tab) => (
          <button
            key={tab.value}
            type="button"
            role="tab"
            aria-selected={status === tab.value}
            onClick={() => onStatusChange(tab.value)}
            className={`-mb-px shrink-0 border-b-2 px-3 py-2 text-sm font-medium ${
              status === tab.value
                ? 'border-red-600 text-zinc-900 dark:text-zinc-100'
                : 'border-transparent text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-100'
            }`}
          >
            {tab.label}
            <span className="ml-1.5 font-mono text-xs text-zinc-400 tabular-nums">
              {counts[tab.value]}
            </span>
          </button>
        ))}
      </div>

      <div className="flex flex-col gap-2 sm:flex-row">
        <label className="relative flex-1">
          <Search className="pointer-events-none absolute top-1/2 left-2.5 size-4 -translate-y-1/2 text-zinc-400" />
          <input
            type="search"
            value={query}
            onChange={(e) => onQueryChange(e.target.value)}
            placeholder={t.search}
            aria-label={t.search}
            className={`${fieldClass} placeholder:text-zinc-400 focus:ring-2 focus:ring-red-500/20`}
          />
        </label>
        <label className="relative">
          <ArrowUpDown className="pointer-events-none absolute top-1/2 left-2.5 size-4 -translate-y-1/2 text-zinc-400" />
          <select
            value={sort}
            onChange={(e) => onSortChange(e.target.value as Sort)}
            aria-label={t.sortBy}
            className={`${fieldClass} sm:w-auto`}
          >
            <option value="recent">{t.sortRecent}</option>
            <option value="progress">{t.sortProgress}</option>
            <option value="remaining">{t.sortRemaining}</option>
            <option value="title">{t.sortTitle}</option>
          </select>
        </label>
      </div>
    </div>
  )
}
