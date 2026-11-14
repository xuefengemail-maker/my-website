import type { Goal } from '../../lib/goalsApi.ts'

type GoalItemProps = {
  goal: Goal
  disabled: boolean
  onToggle: (id: number) => void
}

export function GoalItem({ goal, disabled, onToggle }: GoalItemProps) {
  const completed = goal.status === 'completed'

  return (
    <li>
      <label className="flex min-h-11 cursor-pointer items-start gap-3 rounded-xl border border-[var(--dashboard-border)] bg-[var(--dashboard-surface-soft)] p-3 transition-colors hover:border-[var(--dashboard-border-strong)] focus-within:outline-2 focus-within:outline-offset-2 focus-within:outline-[var(--hero-focus-ring)] motion-reduce:transition-none">
        <input
          type="checkbox"
          checked={completed}
          disabled={disabled}
          onChange={() => onToggle(goal.id)}
          className="mt-0.5 size-5 shrink-0 cursor-pointer accent-[var(--dashboard-accent)] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--hero-focus-ring)] disabled:cursor-wait disabled:opacity-60"
        />
        <span className="flex min-w-0 flex-1 flex-col gap-1">
          <span
            className={
              completed
                ? 'text-sm font-medium text-[var(--dashboard-muted)] line-through'
                : 'text-sm font-medium text-[var(--dashboard-text)]'
            }
          >
            {goal.title}
          </span>
          <span className="inline-flex w-fit items-center rounded-full bg-[var(--dashboard-accent-soft)] px-2 py-0.5 text-[11px] font-medium text-[var(--dashboard-accent-strong)]">
            {goal.category}
          </span>
        </span>
      </label>
    </li>
  )
}
