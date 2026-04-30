import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import LandingPage from './components/LandingPage';
import PrivacyPolicy from './components/PrivacyPolicy';
import DataDeletionRequest from './components/DataDeletionRequest';
import { RbacProvider } from './admin/rbac/RbacContext';
import { AdminLayout } from './admin/layout/AdminLayout';
import { DashboardPage } from './admin/pages/DashboardPage';
import { QueueControlPage } from './admin/pages/QueueControlPage';
import { InspectorsPage } from './admin/pages/InspectorsPage';
import { FinancePage } from './admin/pages/FinancePage';
import { AuditLogsPage } from './admin/pages/AuditLogsPage';
import { VehicleMasterPage } from './admin/pages/VehicleMasterPage';
import { ChecklistBuilderPage } from './admin/pages/ChecklistBuilderPage';
import { RegisterCustomerPage } from './admin/pages/RegisterCustomerPage';
import { NewInspectionPage } from './admin/pages/NewInspectionPage';
import { TimeFramesPage } from './admin/pages/TimeFramesPage';
import { BannerPage } from './admin/pages/BannerPage';
import { AuthProvider } from './admin/auth/AuthContext';
import { ProtectedRoute } from './admin/auth/ProtectedRoute';
import { LoginPage } from './admin/pages/LoginPage';
import RequestPage from './admin/pages/RequestPage';

export default function App() {
  return (
    <AuthProvider>
      <RbacProvider>
        <Router>
          <Routes>
            <Route path="/" element={<LandingPage />} />
            <Route path="/privacy-policy" element={<PrivacyPolicy />} />
            <Route path="/data-deletion-request" element={<DataDeletionRequest />} />
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
              <Route path="/checklists" element={<ChecklistBuilderPage />} />
              <Route path="/time-frames" element={<TimeFramesPage />} />
              <Route path="/banners" element={<BannerPage />} />
              <Route path="/audit" element={<AuditLogsPage />} />
              <Route path="/requests" element={<RequestPage />} />
              <Route path="*" element={<Navigate to="/dashboard" replace />} />
            </Route>
          </Routes>
        </Router>
      </RbacProvider>
    </AuthProvider>
  );
}
