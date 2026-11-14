import { studyPalContent } from '../../content/studypal.ts'
import { ThemeToggle } from '../ThemeToggle.tsx'
import { BrandMark } from '../dashboard/BrandMark.tsx'
import { WorkspaceNav } from './WorkspaceNav.tsx'

export function WorkspaceSidebar() {
  return (
    <aside className="hidden border-r border-[var(--dashboard-border)] bg-[var(--dashboard-sidebar)] lg:sticky lg:top-0 lg:flex lg:h-svh lg:flex-col lg:gap-8 lg:px-4 lg:py-6">
      <BrandMark />
      <WorkspaceNav items={studyPalContent.navItems} />
      <div className="mt-auto flex flex-col gap-4 rounded-2xl border border-[var(--dashboard-border)] bg-[var(--dashboard-surface-soft)] p-4">
        <div>
          <p className="text-sm font-semibold text-[var(--dashboard-text)]">保持节奏</p>
          <p className="mt-1 text-xs leading-relaxed text-[var(--dashboard-muted)]">
            每天完成一点点，比偶尔冲刺更可靠。
          </p>
        </div>
        <div className="flex items-center justify-between gap-3">
          <span className="text-xs font-medium text-[var(--dashboard-muted)]">外观</span>
          <ThemeToggle />
        </div>
      </div>
    </aside>
  )
}
