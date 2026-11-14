import { useEffect, useRef, useState } from 'react'
import type { AchievementItem } from '../../lib/analyticsApi.ts'
import { formatDateTime } from '../../lib/date.ts'
import { DashboardIcon } from './DashboardIcon.tsx'
import { PanelError } from './PanelError.tsx'

type AchievementWallProps = {
  achievements: readonly AchievementItem[] | null
  loading: boolean
  error: string | null
  onRetry: () => void
}

const ACHIEVEMENT_UNITS: Record<string, string> = {
  first_session: '条记录',
  streak_7: '天',
  hours_10: '分钟',
  goals_20: '个目标',
}

function AchievementSkeleton() {
  return (
    <ul
      aria-label="成就加载中"
      aria-busy="true"
      className="mt-5 grid grid-cols-1 gap-3 sm:grid-cols-2"
    >
      {Array.from({ length: 4 }, (_, index) => (
        <li
          key={index}
          className="rounded-2xl border border-[var(--dashboard-border)] bg-[var(--dashboard-surface-soft)] p-4"
        >
          <div className="flex items-start gap-3">
            <span className="size-10 animate-pulse rounded-xl bg-[var(--dashboard-border)] motion-reduce:animate-none" />
            <div className="min-w-0 flex-1">
              <span className="block h-4 w-24 animate-pulse rounded bg-[var(--dashboard-border)] motion-reduce:animate-none" />
              <span className="mt-2 block h-3 w-full animate-pulse rounded bg-[var(--dashboard-border)] motion-reduce:animate-none" />
              <span className="mt-3 block h-2 w-full animate-pulse rounded-full bg-[var(--dashboard-border)] motion-reduce:animate-none" />
            </div>
          </div>
        </li>
      ))}
    </ul>
  )
}

export function AchievementWall({
  achievements,
  loading,
  error,
  onRetry,
}: AchievementWallProps) {
  const [announcement, setAnnouncement] = useState('')
  const initializedRef = useRef(false)
  const knownUnlockedRef = useRef<Set<string>>(new Set())

  useEffect(() => {
    if (achievements === null) {
      return
    }

    const unlocked = achievements.filter((achievement) => achievement.unlocked)
    const newlyUnlocked = unlocked.filter(
      (achievement) => !knownUnlockedRef.current.has(achievement.code),
    )

    if (!initializedRef.current) {
      initializedRef.current = true
      knownUnlockedRef.current = new Set(unlocked.map((achievement) => achievement.code))
      return
    }

    if (newlyUnlocked.length > 0) {
      setAnnouncement(
        `新成就解锁：${newlyUnlocked.map((achievement) => achievement.title).join('、')}`,
      )
    }
    knownUnlockedRef.current = new Set(unlocked.map((achievement) => achievement.code))
  }, [achievements])

  return (
    <section
      id="achievements"
      aria-labelledby="achievements-title"
      className="rounded-3xl border border-[var(--dashboard-border)] bg-[var(--dashboard-surface)] p-5 shadow-[var(--dashboard-shadow)] sm:p-6"
    >
      <div>
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[var(--dashboard-accent-strong)]">
          Milestones
        </p>
        <h2 id="achievements-title" className="mt-1 text-xl font-bold tracking-tight">
          成就墙
        </h2>
        <p className="mt-1 text-sm text-[var(--dashboard-muted)]">
          记录学习、保持连续和完成目标都会推进成就解锁。
        </p>
      </div>

      <p
        role="status"
        aria-live="polite"
        className={
          announcement === ''
            ? 'sr-only'
            : 'mt-4 rounded-xl bg-[var(--dashboard-success-soft)] px-3 py-2 text-sm font-medium text-[var(--dashboard-success)]'
        }
      >
        {announcement}
      </p>

      {loading ? <AchievementSkeleton /> : null}

      {!loading && error !== null ? (
        <div className="mt-5">
          <PanelError message={error} onRetry={onRetry} />
        </div>
      ) : null}

      {!loading && error === null && achievements !== null && achievements.length === 0 ? (
        <p className="mt-5 rounded-2xl border border-dashed border-[var(--dashboard-border-strong)] bg-[var(--dashboard-surface-soft)] px-4 py-8 text-center text-sm text-[var(--dashboard-muted)]">
          成就暂不可用，请稍后再试。
        </p>
      ) : null}

      {!loading && error === null && achievements !== null && achievements.length > 0 ? (
        <ul className="mt-5 grid grid-cols-1 gap-3 sm:grid-cols-2">
          {achievements.map((achievement) => {
            const unit = ACHIEVEMENT_UNITS[achievement.code] ?? ''
            const remaining = Math.max(0, achievement.target - achievement.progress)
            const ratio = achievement.target === 0
              ? 0
              : Math.min(1, achievement.progress / achievement.target)

            return (
              <li key={achievement.code}>
                <article
                  className={
                    achievement.unlocked
                      ? 'h-full rounded-2xl border border-[var(--dashboard-accent)] bg-[var(--dashboard-accent-soft)] p-4'
                      : 'h-full rounded-2xl border border-[var(--dashboard-border)] bg-[var(--dashboard-surface-soft)] p-4'
                  }
                >
                  <div className="flex items-start gap-3">
                    <span
                      className={
                        achievement.unlocked
                          ? 'flex size-10 shrink-0 items-center justify-center rounded-xl bg-[var(--dashboard-accent)] text-[var(--dashboard-accent-contrast)]'
                          : 'flex size-10 shrink-0 items-center justify-center rounded-xl bg-[var(--dashboard-surface)] text-[var(--dashboard-muted)]'
                      }
                    >
                      <DashboardIcon name={achievement.unlocked ? 'check' : 'target'} className="size-5" />
                    </span>
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <h3 className="text-sm font-semibold text-[var(--dashboard-text)]">
                          {achievement.title}
                        </h3>
                        <span
                          className={
                            achievement.unlocked
                              ? 'rounded-full bg-[var(--dashboard-success-soft)] px-2 py-0.5 text-[11px] font-semibold text-[var(--dashboard-success)]'
                              : 'rounded-full bg-[var(--dashboard-surface)] px-2 py-0.5 text-[11px] font-medium text-[var(--dashboard-muted)]'
                          }
                        >
                          {achievement.unlocked ? '已解锁' : '未解锁'}
                        </span>
                      </div>
                      <p className="mt-1 text-xs leading-relaxed text-[var(--dashboard-muted)]">
                        {achievement.description}
                      </p>
                      <p className="mt-2 text-xs font-medium text-[var(--dashboard-text)]">
                        {achievement.progress}/{achievement.target} {unit}
                      </p>
                      <progress
                        value={ratio * 100}
                        max={100}
                        aria-label={`${achievement.title}进度`}
                        className="mt-2 h-2 w-full appearance-none overflow-hidden rounded-full bg-[var(--dashboard-track)] accent-[var(--dashboard-accent)] [&::-moz-progress-bar]:bg-[var(--dashboard-accent)] [&::-webkit-progress-bar]:bg-[var(--dashboard-track)] [&::-webkit-progress-value]:bg-[var(--dashboard-accent)]"
                      />
                      <p className="mt-2 text-[11px] text-[var(--dashboard-muted)]">
                        {achievement.unlocked && achievement.unlocked_at !== null
                          ? `解锁时间：${formatDateTime(achievement.unlocked_at)}`
                          : `还差 ${remaining} ${unit}`}
                      </p>
                    </div>
                  </div>
                </article>
              </li>
            )
          })}
        </ul>
      ) : null}
    </section>
  )
}
