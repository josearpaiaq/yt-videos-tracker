export function Logo({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 32 32" className={className} aria-hidden>
      <rect width="32" height="32" rx="8" fill="#dc2626" />
      <path d="M12 9.5v13l10-6.5z" fill="#fff" />
    </svg>
  )
}
