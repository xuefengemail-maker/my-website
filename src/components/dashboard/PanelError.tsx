type PanelErrorProps = {
  message: string
  onRetry: () => void
}

export function PanelError({ message, onRetry }: PanelErrorProps) {
  return (
    <div
      role="alert"
      className="flex flex-col gap-3 rounded-2xl border border-red-200 bg-red-50 px-4 py-4 text-sm text-red-700 dark:border-red-900/60 dark:bg-red-950/40 dark:text-red-300 sm:flex-row sm:items-center sm:justify-between"
    >
      <p>{message}</p>
      <button
        type="button"
        onClick={onRetry}
        className="inline-flex min-h-11 w-fit items-center justify-center rounded-xl border border-current px-4 text-sm font-semibold focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--hero-focus-ring)]"
      >
        重试
      </button>
    </div>
  )
}
