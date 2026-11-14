type ScrollToBottomButtonProps = {
  onClick: () => void
}

export function ScrollToBottomButton({ onClick }: ScrollToBottomButtonProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="absolute bottom-4 right-4 inline-flex min-h-11 items-center gap-1.5 rounded-full border border-[var(--dashboard-border)] bg-[var(--dashboard-surface)] px-3 text-xs font-semibold text-[var(--dashboard-text)] shadow-[var(--dashboard-shadow)] transition-colors hover:bg-[var(--dashboard-surface-soft)] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--hero-focus-ring)] motion-reduce:transition-none"
    >
      <svg aria-hidden="true" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="size-4">
        <path d="M12 5v14M6 13l6 6 6-6" />
      </svg>
      回到底部
    </button>
  )
}
