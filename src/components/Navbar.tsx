import { siteContent } from '../content/site.ts'
import { ThemeToggle } from './ThemeToggle.tsx'

export function Navbar() {
  return (
    <nav
      aria-label="主导航"
      className="fixed inset-x-0 top-0 z-50 h-16 border-b border-[var(--nav-border)] bg-[var(--nav-bg-solid)] supports-[backdrop-filter:blur(1px)]:bg-[var(--nav-bg)] supports-[backdrop-filter:blur(1px)]:backdrop-blur-md"
    >
      <div className="mx-auto flex h-full max-w-6xl items-center justify-between gap-2 px-3 sm:px-6">
        <a
          href="#hero"
          className="flex min-h-11 min-w-0 items-center text-xs font-semibold text-[var(--nav-text)] focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[var(--hero-focus-ring)] sm:text-sm"
        >
          <span className="truncate">{siteContent.name}</span>
        </a>
        <div className="flex shrink-0 items-center gap-0 sm:gap-1">
          <ul className="flex items-center gap-0 sm:gap-1">
            {siteContent.navItems.map((item) => (
              <li key={item.href}>
                <a
                  href={item.href}
                  className="inline-flex min-h-11 min-w-11 items-center justify-center rounded-md px-1 text-sm font-medium text-[var(--nav-text)] hover:text-[var(--nav-text-hover)] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--hero-focus-ring)] sm:px-3"
                >
                  {item.label}
                </a>
              </li>
            ))}
          </ul>
          <ThemeToggle />
        </div>
      </div>
    </nav>
  )
}
