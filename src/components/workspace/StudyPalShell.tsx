import { Outlet } from 'react-router-dom'
import { useAuth } from '../../auth/useAuth.ts'
import { AuthPanel } from '../auth/AuthPanel.tsx'
import { WorkspaceMobileHeader } from './WorkspaceMobileHeader.tsx'
import { WorkspaceSidebar } from './WorkspaceSidebar.tsx'

export function StudyPalShell() {
  const { isAuthenticated } = useAuth()

  return (
    <div className="flex h-svh flex-col overflow-hidden bg-[var(--dashboard-bg)] text-[var(--dashboard-text)] lg:grid lg:grid-cols-[16rem_minmax(0,1fr)]">
      <WorkspaceSidebar />
      <div className="flex min-h-0 min-w-0 flex-1 flex-col">
        <WorkspaceMobileHeader />
        <div className="min-h-0 flex-1 overflow-y-auto">
          {isAuthenticated ? <Outlet /> : <AuthPanel />}
        </div>
      </div>
    </div>
  )
}
