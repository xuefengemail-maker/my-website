import { useState } from 'react'
import type { FormEvent } from 'react'
import { useAuth } from '../../auth/useAuth.ts'
import { createStudySession } from '../../lib/analyticsApi.ts'
import { isLocalDateIso, localDateIso } from '../../lib/date.ts'
import { isUnauthorizedError, requestErrorMessage } from '../../lib/requestError.ts'

type RecordStudyFormProps = {
  onCreated: (studiedOn: string) => void
}

export function RecordStudyForm({ onCreated }: RecordStudyFormProps) {
  const { authorizedFetch, signOut } = useAuth()
  const [subject, setSubject] = useState('')
  const [duration, setDuration] = useState('30')
  const [studiedOn, setStudiedOn] = useState(localDateIso)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setError(null)
    setSuccess(null)

    const normalizedSubject = subject.trim()
    const minutes = Number(duration)

    if (normalizedSubject.length === 0) {
      setError('请输入学习主题')
      return
    }
    if (normalizedSubject.length > 120) {
      setError('学习主题不能超过 120 个字符')
      return
    }
    if (!Number.isInteger(minutes) || minutes < 1 || minutes > 1440) {
      setError('学习时长必须是 1 至 1440 分钟的整数')
      return
    }
    if (!isLocalDateIso(studiedOn)) {
      setError('请选择有效的学习日期')
      return
    }

    setIsSubmitting(true)
    try {
      await createStudySession(authorizedFetch, {
        subject: normalizedSubject,
        duration_minutes: minutes,
        studied_on: studiedOn,
      })
      setSuccess(`已记录「${normalizedSubject}」${minutes} 分钟。`)
      setSubject('')
      setDuration('30')
      onCreated(studiedOn)
    } catch (submitError) {
      if (isUnauthorizedError(submitError)) {
        signOut()
        return
      }
      setError(
        requestErrorMessage(submitError, {
          validation: '学习记录格式不正确，请检查主题、时长和日期',
        }),
      )
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <section
      aria-labelledby="record-study-title"
      className="rounded-3xl border border-[var(--dashboard-border)] bg-[var(--dashboard-surface)] p-5 shadow-[var(--dashboard-shadow)] sm:p-6"
    >
      <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[var(--dashboard-accent-strong)]">
            Quick log
          </p>
          <h2 id="record-study-title" className="mt-1 text-xl font-bold tracking-tight">
            记录学习
          </h2>
          <p className="mt-1 text-sm text-[var(--dashboard-muted)]">
            添加真实学习记录后，统计、日历和成就进度会同步更新。
          </p>
        </div>
      </div>

      <form
        aria-busy={isSubmitting}
        onSubmit={handleSubmit}
        className="mt-5 grid grid-cols-1 gap-4 lg:grid-cols-[minmax(0,1.5fr)_minmax(8rem,0.5fr)_minmax(10rem,0.7fr)_auto] lg:items-end"
      >
        <label className="flex flex-col gap-2 text-sm font-medium text-[var(--dashboard-text)]">
          学习主题
          <input
            type="text"
            required
            maxLength={120}
            value={subject}
            onChange={(event) => setSubject(event.target.value)}
            placeholder="例如：动态规划练习"
            className="min-h-11 rounded-xl border border-[var(--dashboard-border)] bg-[var(--dashboard-surface-soft)] px-3 text-sm text-[var(--dashboard-text)] outline-none transition-colors placeholder:text-[var(--dashboard-muted)] focus:border-[var(--dashboard-accent)] focus:ring-2 focus:ring-[var(--dashboard-accent-soft)] motion-reduce:transition-none"
          />
        </label>

        <label className="flex flex-col gap-2 text-sm font-medium text-[var(--dashboard-text)]">
          分钟数
          <input
            type="number"
            required
            min={1}
            max={1440}
            step={1}
            value={duration}
            onChange={(event) => setDuration(event.target.value)}
            className="min-h-11 rounded-xl border border-[var(--dashboard-border)] bg-[var(--dashboard-surface-soft)] px-3 text-sm text-[var(--dashboard-text)] outline-none transition-colors focus:border-[var(--dashboard-accent)] focus:ring-2 focus:ring-[var(--dashboard-accent-soft)] motion-reduce:transition-none"
          />
        </label>

        <label className="flex flex-col gap-2 text-sm font-medium text-[var(--dashboard-text)]">
          学习日期
          <input
            type="date"
            required
            value={studiedOn}
            onChange={(event) => setStudiedOn(event.target.value)}
            className="min-h-11 rounded-xl border border-[var(--dashboard-border)] bg-[var(--dashboard-surface-soft)] px-3 text-sm text-[var(--dashboard-text)] outline-none transition-colors focus:border-[var(--dashboard-accent)] focus:ring-2 focus:ring-[var(--dashboard-accent-soft)] motion-reduce:transition-none"
          />
        </label>

        <button
          type="submit"
          disabled={isSubmitting}
          className="inline-flex min-h-11 items-center justify-center rounded-xl bg-[var(--dashboard-accent)] px-5 text-sm font-semibold text-[var(--dashboard-accent-contrast)] transition-colors hover:bg-[var(--dashboard-accent-strong)] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--hero-focus-ring)] disabled:cursor-not-allowed disabled:opacity-60 motion-reduce:transition-none"
        >
          {isSubmitting ? '保存中…' : '记录学习'}
        </button>
      </form>

      {error !== null ? (
        <p
          role="alert"
          className="mt-4 rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700 dark:border-red-900/60 dark:bg-red-950/40 dark:text-red-300"
        >
          {error}
        </p>
      ) : null}

      {success !== null ? (
        <p
          role="status"
          className="mt-4 rounded-xl bg-[var(--dashboard-success-soft)] px-3 py-2 text-sm font-medium text-[var(--dashboard-success)]"
        >
          {success}
        </p>
      ) : null}
    </section>
  )
}
