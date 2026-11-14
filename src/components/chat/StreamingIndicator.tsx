export function StreamingIndicator() {
  return (
    <span className="mt-2 inline-flex items-center gap-1" role="status" aria-label="正在生成回复">
      <span className="size-1.5 animate-pulse rounded-full bg-[var(--dashboard-accent)] motion-reduce:animate-none" />
      <span className="size-1.5 animate-pulse rounded-full bg-[var(--dashboard-accent)] [animation-delay:120ms] motion-reduce:animate-none" />
      <span className="size-1.5 animate-pulse rounded-full bg-[var(--dashboard-accent)] [animation-delay:240ms] motion-reduce:animate-none" />
    </span>
  )
}
