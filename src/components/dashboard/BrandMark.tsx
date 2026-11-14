import { Link } from 'react-router-dom'
import { studyPalContent } from '../../content/studypal.ts'

export function BrandMark() {
  return (
    <Link
      to="/"
      aria-label={`${studyPalContent.productName} 学习总览`}
      className="flex min-h-11 min-w-0 items-center gap-3 rounded-xl text-[var(--dashboard-text)] focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[var(--hero-focus-ring)]"
    >
      <span
        aria-hidden="true"
        className="flex size-10 shrink-0 items-center justify-center rounded-2xl bg-[var(--dashboard-accent)] text-sm font-bold text-[var(--dashboard-accent-contrast)]"
      >
        SP
      </span>
      <span className="flex min-w-0 flex-col">
        <span className="truncate text-sm font-semibold tracking-tight">
          {studyPalContent.productName}
        </span>
        <span className="truncate text-xs text-[var(--dashboard-muted)]">
          {studyPalContent.tagline}
        </span>
      </span>
    </Link>
  )
}
