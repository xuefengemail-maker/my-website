import { NavLink } from 'react-router-dom'
import type { NavItem } from '../../content/studypal.ts'
import { DashboardIcon } from '../dashboard/DashboardIcon.tsx'

type WorkspaceNavProps = {
  items: readonly NavItem[]
  compact?: boolean
}

function linkClassName(compact: boolean, isActive: boolean): string {
  const base = compact
    ? 'inline-flex min-h-11 min-w-11 items-center justify-center gap-1.5 whitespace-nowrap rounded-xl px-3 text-xs font-medium transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--hero-focus-ring)] motion-reduce:transition-none'
    : 'flex min-h-11 items-center gap-3 rounded-xl px-3 text-sm font-medium transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--hero-focus-ring)] motion-reduce:transition-none'

  return isActive
    ? `${base} bg-[var(--dashboard-accent-soft)] text-[var(--dashboard-accent-strong)]`
    : `${base} text-[var(--dashboard-muted)] hover:bg-[var(--dashboard-accent-soft)] hover:text-[var(--dashboard-accent-strong)]`
}

export function WorkspaceNav({ items, compact = false }: WorkspaceNavProps) {
  return (
    <nav aria-label="StudyPal 主导航">
      <ul className={compact ? 'flex gap-1 overflow-x-auto pb-1' : 'flex flex-col gap-1'}>
        {items.map((item) => (
          <li key={item.to} className={compact ? 'shrink-0' : undefined}>
            <NavLink
              to={item.to}
              end={item.to === '/'}
              className={({ isActive }) => linkClassName(compact, isActive)}
            >
              <DashboardIcon name={item.icon} className="size-4 shrink-0" />
              <span>{item.label}</span>
            </NavLink>
          </li>
        ))}
      </ul>
    </nav>
  )
}
