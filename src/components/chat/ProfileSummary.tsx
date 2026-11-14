import { useState } from 'react'
import type { ChatProfile } from '../../lib/chatApi.ts'

type ProfileSummaryProps = {
  profile: ChatProfile | null
}

export function ProfileSummary({ profile }: ProfileSummaryProps) {
  const [imageFailed, setImageFailed] = useState(false)
  const avatarUrl = profile?.avatar_url ?? null
  const showImage = avatarUrl !== null && !imageFailed

  return (
    <div className="flex min-w-0 items-center gap-3">
      {showImage ? (
        <img
          src={avatarUrl}
          alt="用户头像"
          loading="lazy"
          referrerPolicy="no-referrer"
          onError={() => setImageFailed(true)}
          className="size-10 shrink-0 rounded-2xl object-cover ring-1 ring-[var(--dashboard-border)]"
        />
      ) : (
        <span className="flex size-10 shrink-0 items-center justify-center rounded-2xl bg-[var(--dashboard-accent)] text-sm font-bold text-[var(--dashboard-accent-contrast)]">
          SP
        </span>
      )}
      <div className="min-w-0">
        <p className="truncate text-sm font-semibold text-[var(--dashboard-text)]">学习者</p>
        <div className="mt-1 flex flex-wrap items-center gap-1.5 text-[11px] font-medium text-[var(--dashboard-muted)]">
          <span className="rounded-full bg-[var(--dashboard-surface-soft)] px-2 py-0.5">
            连续 {profile?.streak_days ?? 0} 天
          </span>
          <span className="rounded-full bg-[var(--dashboard-accent-soft)] px-2 py-0.5 text-[var(--dashboard-accent-strong)]">
            Lv.{profile?.level ?? 1}
          </span>
        </div>
      </div>
    </div>
  )
}
