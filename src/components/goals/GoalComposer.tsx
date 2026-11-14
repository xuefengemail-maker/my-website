import { useState } from 'react'
import type { FormEvent } from 'react'
import { useAuth } from '../../auth/useAuth.ts'
import { formatDateLabel } from '../../lib/date.ts'
import { validateGoalDraft, type GoalFieldErrors } from '../../lib/goalValidation.ts'
import { createGoal, type Goal } from '../../lib/goalsApi.ts'
import { isUnauthorizedError, requestErrorMessage } from '../../lib/requestError.ts'

type GoalComposerProps = {
  date: string
  onDateChange: (value: string) => void
  onCreated: (goal: Goal) => void
}

const inputClassName =
  'min-h-11 rounded-xl border border-[var(--dashboard-border)] bg-[var(--dashboard-surface-soft)] px-3 text-sm text-[var(--dashboard-text)] outline-none transition-colors placeholder:text-[var(--dashboard-muted)] focus:border-[var(--dashboard-accent)] focus:ring-2 focus:ring-[var(--dashboard-accent-soft)] aria-invalid:border-red-400 motion-reduce:transition-none'

const labelClassName =
  'flex flex-col gap-2 text-sm font-medium text-[var(--dashboard-text)]'

export function GoalComposer({ date, onDateChange, onCreated }: GoalComposerProps) {
  const { authorizedFetch, signOut } = useAuth()
  const [title, setTitle] = useState('')
  const [category, setCategory] = useState('')
  const [fieldErrors, setFieldErrors] = useState<GoalFieldErrors>({})
  const [submitError, setSubmitError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)

  const clearFieldError = (field: keyof GoalFieldErrors) => {
    setFieldErrors((current) => {
      if (current[field] === undefined) {
        return current
      }
      const next = { ...current }
      delete next[field]
      return next
    })
    setSuccess(null)
  }

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setSubmitError(null)
    setSuccess(null)

    const normalizedTitle = title.trim()
    const normalizedCategory = category.trim()
    const nextErrors = validateGoalDraft({ title, category, targetDate: date })

    if (Object.keys(nextErrors).length > 0) {
      setFieldErrors(nextErrors)
      return
    }

    setFieldErrors({})
    setIsSubmitting(true)
    try {
      const created = await createGoal(authorizedFetch, {
        title: normalizedTitle,
        category: normalizedCategory,
        target_date: date,
      })
      setTitle('')
      setCategory('')
      setSuccess(`已创建「${created.title}」，目标日期为 ${formatDateLabel(created.target_date)}。`)
      onCreated(created)
    } catch (error) {
      if (isUnauthorizedError(error)) {
        signOut()
        return
      }
      setSubmitError(
        requestErrorMessage(error, {
          validation: '目标格式不正确，请检查标题、分类和日期',
        }),
      )
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <section
      aria-labelledby="goal-composer-title"
      className="rounded-3xl border border-[var(--dashboard-border)] bg-[var(--dashboard-surface)] p-5 shadow-[var(--dashboard-shadow)] sm:p-6"
    >
      <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[var(--dashboard-accent-strong)]">
        New goal
      </p>
      <h2 id="goal-composer-title" className="mt-1 text-xl font-bold tracking-tight">
        创建学习目标
      </h2>
      <p className="mt-1 text-sm text-[var(--dashboard-muted)]">
        设定一个具体、可完成的小目标，完成后会同步到学习数据和成就进度。
      </p>

      <form
        aria-busy={isSubmitting}
        onSubmit={handleSubmit}
        noValidate
        className="mt-5 grid grid-cols-1 gap-4 lg:grid-cols-[minmax(0,1.5fr)_minmax(9rem,0.6fr)_minmax(10rem,0.7fr)_auto] lg:items-start"
      >
        <div className="flex flex-col gap-2">
          <label htmlFor="goal-title" className={labelClassName}>
            目标标题
          </label>
          <input
            id="goal-title"
            type="text"
            required
            maxLength={120}
            value={title}
            aria-invalid={fieldErrors.title !== undefined}
            aria-describedby={fieldErrors.title === undefined ? undefined : 'goal-title-error'}
            onChange={(event) => {
              setTitle(event.target.value)
              clearFieldError('title')
            }}
            placeholder="例如：完成 30 分钟算法练习"
            className={inputClassName}
          />
          {fieldErrors.title !== undefined ? (
            <p id="goal-title-error" className="text-xs text-red-600 dark:text-red-400">
              {fieldErrors.title}
            </p>
          ) : null}
        </div>

        <div className="flex flex-col gap-2">
          <label htmlFor="goal-category" className={labelClassName}>
            分类
          </label>
          <input
            id="goal-category"
            type="text"
            required
            maxLength={60}
            value={category}
            aria-invalid={fieldErrors.category !== undefined}
            aria-describedby={fieldErrors.category === undefined ? undefined : 'goal-category-error'}
            onChange={(event) => {
              setCategory(event.target.value)
              clearFieldError('category')
            }}
            placeholder="例如：算法"
            className={inputClassName}
          />
          {fieldErrors.category !== undefined ? (
            <p id="goal-category-error" className="text-xs text-red-600 dark:text-red-400">
              {fieldErrors.category}
            </p>
          ) : null}
        </div>

        <div className="flex flex-col gap-2">
          <label htmlFor="goal-target-date" className={labelClassName}>
            目标日期
          </label>
          <input
            id="goal-target-date"
            type="date"
            required
            value={date}
            aria-invalid={fieldErrors.targetDate !== undefined}
            aria-describedby={fieldErrors.targetDate === undefined ? undefined : 'goal-target-date-error'}
            onChange={(event) => {
              onDateChange(event.target.value)
              clearFieldError('targetDate')
            }}
            className={inputClassName}
          />
          {fieldErrors.targetDate !== undefined ? (
            <p id="goal-target-date-error" className="text-xs text-red-600 dark:text-red-400">
              {fieldErrors.targetDate}
            </p>
          ) : null}
        </div>

        <button
          type="submit"
          disabled={isSubmitting}
          className="inline-flex min-h-11 items-center justify-center rounded-xl bg-[var(--dashboard-accent)] px-5 text-sm font-semibold text-[var(--dashboard-accent-contrast)] transition-colors hover:bg-[var(--dashboard-accent-strong)] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--hero-focus-ring)] disabled:cursor-not-allowed disabled:opacity-60 motion-reduce:transition-none lg:mt-8"
        >
          {isSubmitting ? '创建中…' : '创建目标'}
        </button>
      </form>

      {submitError !== null ? (
        <p
          role="alert"
          className="mt-4 rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700 dark:border-red-900/60 dark:bg-red-950/40 dark:text-red-300"
        >
          {submitError}
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
