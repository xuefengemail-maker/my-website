import { useState } from 'react'
import type { FormEvent } from 'react'
import { useAuth } from '../../auth/useAuth.ts'
import { ApiError } from '../../lib/apiClient.ts'

type AuthMode = 'login' | 'register'

function authErrorMessage(error: unknown): string {
  if (error instanceof ApiError) {
    if (error.status === 401) {
      return '邮箱或密码不正确'
    }
    if (error.status === 409) {
      return '该邮箱已注册，请直接登录'
    }
    if (error.status === 422) {
      return '请输入有效的邮箱和符合要求的密码'
    }
    return error.message
  }
  return '网络连接失败，请稍后重试'
}

export function AuthPanel() {
  const { login, register } = useAuth()
  const [mode, setMode] = useState<AuthMode>('login')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)

  const switchMode = (nextMode: AuthMode) => {
    setMode(nextMode)
    setError(null)
  }

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setError(null)

    if (mode === 'register' && password.length < 8) {
      setError('密码至少需要 8 个字符')
      return
    }

    setIsSubmitting(true)
    try {
      if (mode === 'login') {
        await login(email.trim(), password)
      } else {
        await register(email.trim(), password)
      }
    } catch (submitError) {
      setError(authErrorMessage(submitError))
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <section className="mx-auto flex w-full max-w-md flex-col gap-6 px-4 py-8 sm:py-12">
      <div className="rounded-3xl border border-[var(--dashboard-border)] bg-[var(--dashboard-surface)] p-6 shadow-[var(--dashboard-shadow)] sm:p-8">
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[var(--dashboard-accent-strong)]">
          StudyPal / 学习工作区
        </p>
        <h1 className="mt-3 text-2xl font-bold tracking-tight text-[var(--dashboard-text)] sm:text-3xl">
          登录后开始学习
        </h1>
        <p className="mt-2 text-sm leading-relaxed text-[var(--dashboard-muted)]">
          登录后查看学习数据、学习目标和 AI 学习建议。
        </p>

        <div className="mt-6 grid grid-cols-2 gap-1 rounded-xl bg-[var(--dashboard-surface-soft)] p-1">
          <button
            type="button"
            onClick={() => switchMode('login')}
            aria-pressed={mode === 'login'}
            className={
              mode === 'login'
                ? 'min-h-11 rounded-lg bg-[var(--dashboard-surface)] text-sm font-semibold text-[var(--dashboard-text)] shadow-sm focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--hero-focus-ring)]'
                : 'min-h-11 rounded-lg text-sm font-medium text-[var(--dashboard-muted)] hover:text-[var(--dashboard-text)] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--hero-focus-ring)]'
            }
          >
            登录
          </button>
          <button
            type="button"
            onClick={() => switchMode('register')}
            aria-pressed={mode === 'register'}
            className={
              mode === 'register'
                ? 'min-h-11 rounded-lg bg-[var(--dashboard-surface)] text-sm font-semibold text-[var(--dashboard-text)] shadow-sm focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--hero-focus-ring)]'
                : 'min-h-11 rounded-lg text-sm font-medium text-[var(--dashboard-muted)] hover:text-[var(--dashboard-text)] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--hero-focus-ring)]'
            }
          >
            注册
          </button>
        </div>

        <form className="mt-6 flex flex-col gap-4" onSubmit={handleSubmit}>
          <label className="flex flex-col gap-2 text-sm font-medium text-[var(--dashboard-text)]">
            邮箱
            <input
              type="email"
              required
              autoComplete="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              className="min-h-11 rounded-xl border border-[var(--dashboard-border)] bg-[var(--dashboard-surface-soft)] px-3 text-sm text-[var(--dashboard-text)] outline-none transition-colors focus:border-[var(--dashboard-accent)] focus:ring-2 focus:ring-[var(--dashboard-accent-soft)] motion-reduce:transition-none"
            />
          </label>
          <label className="flex flex-col gap-2 text-sm font-medium text-[var(--dashboard-text)]">
            密码
            <input
              type="password"
              required
              minLength={mode === 'register' ? 8 : 1}
              autoComplete={mode === 'login' ? 'current-password' : 'new-password'}
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              className="min-h-11 rounded-xl border border-[var(--dashboard-border)] bg-[var(--dashboard-surface-soft)] px-3 text-sm text-[var(--dashboard-text)] outline-none transition-colors focus:border-[var(--dashboard-accent)] focus:ring-2 focus:ring-[var(--dashboard-accent-soft)] motion-reduce:transition-none"
            />
          </label>

          {mode === 'register' ? (
            <p className="text-xs leading-relaxed text-[var(--dashboard-muted)]">
              密码需为 8 至 128 个字符。注册成功后将自动登录。
            </p>
          ) : null}

          {error !== null ? (
            <p
              role="alert"
              className="rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700 dark:border-red-900/60 dark:bg-red-950/40 dark:text-red-300"
            >
              {error}
            </p>
          ) : null}

          <button
            type="submit"
            disabled={isSubmitting}
            className="inline-flex min-h-11 items-center justify-center rounded-xl bg-[var(--dashboard-accent)] px-4 text-sm font-semibold text-[var(--dashboard-accent-contrast)] transition-colors hover:bg-[var(--dashboard-accent-strong)] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--hero-focus-ring)] disabled:cursor-not-allowed disabled:opacity-60 motion-reduce:transition-none"
          >
            {isSubmitting ? '处理中…' : mode === 'login' ? '登录并继续' : '注册并继续'}
          </button>
        </form>
      </div>
    </section>
  )
}
