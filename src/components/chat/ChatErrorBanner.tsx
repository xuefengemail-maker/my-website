type ChatErrorBannerProps = {
  message: string | null
  onRetry?: () => void
  retryLabel?: string
}

export function ChatErrorBanner({
  message,
  onRetry,
  retryLabel = '重试',
}: ChatErrorBannerProps) {
  if (message === null) {
    return null
  }

  return (
    <div
      role="alert"
      className="flex shrink-0 flex-col gap-2 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 sm:flex-row sm:items-center sm:justify-between dark:border-red-900/60 dark:bg-red-950/40 dark:text-red-300"
    >
      <p>{message}</p>
      {onRetry !== undefined ? (
        <button
          type="button"
          onClick={onRetry}
          className="inline-flex min-h-11 shrink-0 items-center justify-center rounded-xl border border-current px-3 text-xs font-semibold focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--hero-focus-ring)]"
        >
          {retryLabel}
        </button>
      ) : null}
    </div>
  )
}
