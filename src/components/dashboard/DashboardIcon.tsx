import type { IconName } from '../../content/studypal.ts'

type DashboardIconProps = {
  name: IconName
  className?: string
}

export function DashboardIcon({ name, className = 'size-5' }: DashboardIconProps) {
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
    >
      {name === 'analytics' ? (
        <>
          <path d="M4 19V5M4 19h16" />
          <rect x="7" y="12" width="3" height="5" rx="1" />
          <rect x="12" y="8" width="3" height="9" rx="1" />
          <rect x="17" y="10" width="3" height="7" rx="1" />
        </>
      ) : null}
      {name === 'goals' ? (
        <>
          <path d="M9 6h11M9 12h11M9 18h11" />
          <path d="m3 6 1.5 1.5L7 5M3 12l1.5 1.5L7 11M3 18l1.5 1.5L7 17" />
        </>
      ) : null}
      {name === 'clock' ? (
        <>
          <circle cx="12" cy="12" r="8.5" />
          <path d="M12 7v5l3.5 2" />
        </>
      ) : null}
      {name === 'check' ? (
        <>
          <circle cx="12" cy="12" r="8.5" />
          <path d="m8 12 2.5 2.5L16 9" />
        </>
      ) : null}
      {name === 'flame' ? (
        <path d="M13.5 3.5c.4 3.2-1.6 4.7-3 6.2-1.2 1.3-2.1 2.5-1.9 4.4.1 1.3.8 2.4 1.8 3.1-.1-1.4.5-2.4 1.4-3.2.7-.6 1.4-1.2 1.5-2.4 2.1 1.5 3.6 3.5 3.2 6.1 1-.8 1.7-2 1.9-3.4.5-3.8-1.7-7.7-4.9-10.8Z" />
      ) : null}
      {name === 'target' ? (
        <>
          <circle cx="12" cy="12" r="8.5" />
          <circle cx="12" cy="12" r="4.5" />
          <circle cx="12" cy="12" r="1" fill="currentColor" stroke="none" />
        </>
      ) : null}
      {name === 'chat' ? (
        <>
          <path d="M4 5.5A2.5 2.5 0 0 1 6.5 3h11A2.5 2.5 0 0 1 20 5.5v8a2.5 2.5 0 0 1-2.5 2.5H11l-4.5 4v-4A2.5 2.5 0 0 1 4 13.5Z" />
          <path d="M8 8h8M8 11.5h5" />
        </>
      ) : null}
    </svg>
  )
}
