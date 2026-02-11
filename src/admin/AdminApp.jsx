import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom'
import { RbacProvider } from './rbac/RbacContext'
import { AdminLayout } from './layout/AdminLayout'
import { DashboardPage } from './pages/DashboardPage'
import { QueueControlPage } from './pages/QueueControlPage'
import { InspectorsPage } from './pages/InspectorsPage'
import { FinancePage } from './pages/FinancePage'
import { AuditLogsPage } from './pages/AuditLogsPage'
import { VehicleMasterPage } from './pages/VehicleMasterPage'
import { ChecklistBuilderPage } from './pages/ChecklistBuilderPage'

export default function AdminApp() {
  return (
    <RbacProvider>
      <BrowserRouter>
        <Routes>
          <Route element={<AdminLayout />}>
            <Route path="/" element={<Navigate to="/dashboard" replace />} />
            <Route path="/dashboard" element={<DashboardPage />} />
            <Route path="/queue" element={<QueueControlPage />} />
            <Route path="/inspectors" element={<InspectorsPage />} />
            <Route path="/finance" element={<FinancePage />} />
            <Route path="/vehicle-master" element={<VehicleMasterPage />} />
            <Route path="/checklists" element={<ChecklistBuilderPage />} />
            <Route path="/audit" element={<AuditLogsPage />} />
            <Route path="*" element={<Navigate to="/dashboard" replace />} />
          </Route>
        </Routes>
      </BrowserRouter>
    </RbacProvider>
  )
}
