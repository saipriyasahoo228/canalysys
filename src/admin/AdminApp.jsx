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
import { RegisterCustomerPage } from './pages/RegisterCustomerPage'
import { NewInspectionPage } from './pages/NewInspectionPage'
import { TimeFramesPage } from './pages/TimeFramesPage'
import { BannerPage } from './pages/BannerPage'
import { CityConfigurationPage } from './pages/CityConfigurationPage'
import { AuthProvider } from './auth/AuthContext'
import { ProtectedRoute } from './auth/ProtectedRoute'
import { LoginPage } from './pages/LoginPage'
import { RequestPage } from './pages/RequestPage'

export default function AdminApp() {
  return (
    <AuthProvider>
      <RbacProvider>
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<Navigate to="/login" replace />} />
            <Route path="/login" element={<LoginPage />} />

            <Route
              element={
                <ProtectedRoute>
                  <AdminLayout />
                </ProtectedRoute>
              }
            >
              <Route path="/dashboard" element={<DashboardPage />} />
              <Route path="/queue" element={<QueueControlPage />} />
              <Route path="/inspectors" element={<InspectorsPage />} />
              <Route path="/register-customer" element={<RegisterCustomerPage />} />
              <Route path="/new-inspection" element={<NewInspectionPage />} />
              <Route path="/finance" element={<FinancePage />} />
              <Route path="/vehicle-master" element={<VehicleMasterPage />} />
              <Route path="/city-configuration" element={<CityConfigurationPage />} />
              <Route path="/checklists" element={<ChecklistBuilderPage />} />
              <Route path="/time-frames" element={<TimeFramesPage />} />
              <Route path="/banners" element={<BannerPage />} />
              <Route path="/audit" element={<AuditLogsPage />} />
              <Route path="/requests" element={<RequestPage />} />
              <Route path="*" element={<Navigate to="/dashboard" replace />} />
            </Route>
          </Routes>
        </BrowserRouter>
      </RbacProvider>
    </AuthProvider>
  )
}
