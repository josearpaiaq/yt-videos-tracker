import { useI18n } from '@/i18n'

export function ServerErrorView({ message }: { message: string }) {
  const { t } = useI18n()
  return (
    <p className="p-8 text-sm text-red-600">
      {t.serverUnreachable}: {message}
    </p>
  )
}
