import { studyPalContent } from '../../content/studypal.ts'
import { ThemeToggle } from '../ThemeToggle.tsx'
import { BrandMark } from '../dashboard/BrandMark.tsx'
import { WorkspaceNav } from './WorkspaceNav.tsx'

export function WorkspaceMobileHeader() {
  return (
    <header className="sticky top-0 z-40 shrink-0 border-b border-[var(--dashboard-border)] bg-[var(--dashboard-sidebar)] px-4 py-3 backdrop-blur-md lg:hidden">
      <div className="flex items-center justify-between gap-3">
        <BrandMark />
        <ThemeToggle />
      </div>
      <div className="mt-3">
        <WorkspaceNav items={studyPalContent.navItems} compact />
      </div>
    </header>
  )
}
