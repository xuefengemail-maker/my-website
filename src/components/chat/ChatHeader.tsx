import { Link } from 'react-router-dom'
import type { ChatProfile } from '../../lib/chatApi.ts'
import { ProfileSummary } from './ProfileSummary.tsx'

type ChatHeaderProps = {
  profile: ChatProfile | null
  onSignOut: () => void
}

export function ChatHeader({ profile, onSignOut }: ChatHeaderProps) {
  return (
    <header className="flex shrink-0 flex-col gap-3 rounded-3xl border border-[var(--dashboard-border)] bg-[var(--dashboard-surface)] p-4 shadow-[var(--dashboard-shadow)] sm:flex-row sm:items-center sm:justify-between">
      <div className="flex min-w-0 items-center gap-3">
        <ProfileSummary profile={profile} />
        <div className="hidden h-10 w-px bg-[var(--dashboard-border)] sm:block" />
        <div className="min-w-0">
          <h1 className="truncate text-sm font-semibold text-[var(--dashboard-text)]">AI 学习助手</h1>
          <p className="truncate text-xs text-[var(--dashboard-muted)]">基于当前 Profile 和学习摘要</p>
        </div>
      </div>
      <div className="flex items-center gap-2">
        <Link
          to="/"
          className="inline-flex min-h-11 items-center justify-center rounded-xl border border-[var(--dashboard-border)] px-3 text-xs font-semibold text-[var(--dashboard-muted)] transition-colors hover:bg-[var(--dashboard-surface-soft)] hover:text-[var(--dashboard-text)] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--hero-focus-ring)] motion-reduce:transition-none"
        >
          返回 Dashboard
        </Link>
        <button
          type="button"
          onClick={onSignOut}
          className="inline-flex min-h-11 items-center justify-center rounded-xl px-3 text-xs font-semibold text-[var(--dashboard-muted)] transition-colors hover:bg-[var(--dashboard-surface-soft)] hover:text-[var(--dashboard-text)] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--hero-focus-ring)] motion-reduce:transition-none"
        >
          退出登录
        </button>
      </div>
    </header>
  )
}
