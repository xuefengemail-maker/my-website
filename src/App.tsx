import { HashRouter, Navigate, Route, Routes } from 'react-router-dom'
import { AuthProvider } from './auth/AuthProvider.tsx'
import { ChatPage } from './components/chat/ChatPage.tsx'
import { AnalyticsPage } from './components/dashboard/AnalyticsPage.tsx'
import { GoalsPage } from './components/goals/GoalsPage.tsx'
import { StudyPalShell } from './components/workspace/StudyPalShell.tsx'

function App() {
  return (
    <AuthProvider>
      <HashRouter>
        <Routes>
          <Route element={<StudyPalShell />}>
            <Route path="/" element={<AnalyticsPage />} />
            <Route path="/chat" element={<ChatPage />} />
            <Route path="/goals" element={<GoalsPage />} />
          </Route>
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </HashRouter>
    </AuthProvider>
  )
}

export default App
