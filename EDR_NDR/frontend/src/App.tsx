import { Navigate, Route, Routes } from 'react-router-dom'
import { Sidebar } from './components/layout/Sidebar'
import { DashboardPage } from './pages/DashboardPage'
import { AlertsPage } from './pages/AlertsPage'
import { InvestigatePage } from './pages/InvestigatePage'
import { AgentsPage } from './pages/AgentsPage'
import { RulesPage } from './pages/RulesPage'
import { ThreatIntelPage } from './pages/ThreatIntelPage'
import { SettingsPage } from './pages/SettingsPage'

function App() {
  return (
    <div className="flex h-screen w-screen overflow-hidden">
      <Sidebar />
      <main className="min-w-0 flex-1">
        <Routes>
          <Route path="/" element={<Navigate to="/dashboard" replace />} />
          <Route path="/dashboard" element={<DashboardPage />} />
          <Route path="/alerts" element={<AlertsPage />} />
          <Route path="/investigate" element={<InvestigatePage />} />
          <Route path="/agents" element={<AgentsPage />} />
          <Route path="/rules" element={<RulesPage />} />
          <Route path="/threat-intel" element={<ThreatIntelPage />} />
          <Route path="/settings" element={<SettingsPage />} />
        </Routes>
      </main>
    </div>
  )
}

export default App
