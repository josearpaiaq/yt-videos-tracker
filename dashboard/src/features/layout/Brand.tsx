import { Logo } from '@/components/ui/Logo'

export function Brand() {
  return (
    <span className="flex items-center gap-2">
      <Logo className="size-7" />
      <span className="text-lg font-bold tracking-tight">Where Was I</span>
    </span>
  )
}
