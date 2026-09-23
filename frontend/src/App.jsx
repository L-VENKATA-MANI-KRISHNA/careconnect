import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import { NotificationProvider } from './contexts/NotificationContext';

// Layouts
import PublicLayout from './layouts/PublicLayout';
import DashboardLayout from './layouts/DashboardLayout';

// Public Pages
import LandingPage from './pages/public/LandingPage';
import ServicesPage from './pages/public/ServicesPage';
import LoginPage from './pages/public/LoginPage';
import RegisterPage from './pages/public/RegisterPage';

// Customer Pages
import CustomerDashboard from './pages/customer/CustomerDashboard';
import CreateRequestPage from './pages/customer/CreateRequestPage';
import CustomerRequestsPage from './pages/customer/CustomerRequestsPage';
import CustomerBookingsPage from './pages/customer/CustomerBookingsPage';
import CustomerInvoicesPage from './pages/customer/CustomerInvoicesPage';

// Provider Pages
import ProviderDashboard from './pages/provider/ProviderDashboard';
import ProviderAvailabilityPage from './pages/provider/ProviderAvailabilityPage';
import ProviderRequestsPage from './pages/provider/ProviderRequestsPage';
import ProviderJobsPage from './pages/provider/ProviderJobsPage';
import ProviderProfilePage from './pages/provider/ProviderProfilePage';

// Admin Pages
import AdminDashboard from './pages/admin/AdminDashboard';
import AdminUsersPage from './pages/admin/AdminUsersPage';
import AdminProvidersPage from './pages/admin/AdminProvidersPage';
import AdminCategoriesPage from './pages/admin/AdminCategoriesPage';
import AdminPricingPage from './pages/admin/AdminPricingPage';
import AdminAuditLogsPage from './pages/admin/AdminAuditLogsPage';

// Operations Pages
import OperationsDashboard from './pages/operations/OperationsDashboard';
import OperationsDispatchPage from './pages/operations/OperationsDispatchPage';

// Support Pages
import SupportDashboard from './pages/support/SupportDashboard';

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <NotificationProvider>
          <Routes>
            {/* Public Layout Routes */}
            <Route element={<PublicLayout />}>
              <Route path="/" element={<LandingPage />} />
              <Route path="/services" element={<ServicesPage />} />
              <Route path="/login" element={<LoginPage />} />
              <Route path="/register" element={<RegisterPage />} />
            </Route>

            {/* Customer Portal */}
            <Route element={<DashboardLayout allowedRoles={['CUSTOMER', 'PLATFORM_ADMIN']} />}>
              <Route path="/customer/dashboard" element={<CustomerDashboard />} />
              <Route path="/customer/create-request" element={<CreateRequestPage />} />
              <Route path="/customer/requests" element={<CustomerRequestsPage />} />
              <Route path="/customer/bookings" element={<CustomerBookingsPage />} />
              <Route path="/customer/invoices" element={<CustomerInvoicesPage />} />
            </Route>

            {/* Provider Portal */}
            <Route element={<DashboardLayout allowedRoles={['SERVICE_PROVIDER', 'PLATFORM_ADMIN']} />}>
              <Route path="/provider/dashboard" element={<ProviderDashboard />} />
              <Route path="/provider/availability" element={<ProviderAvailabilityPage />} />
              <Route path="/provider/requests" element={<ProviderRequestsPage />} />
              <Route path="/provider/jobs" element={<ProviderJobsPage />} />
              <Route path="/provider/profile" element={<ProviderProfilePage />} />
            </Route>

            {/* Admin Portal */}
            <Route element={<DashboardLayout allowedRoles={['PLATFORM_ADMIN']} />}>
              <Route path="/admin/dashboard" element={<AdminDashboard />} />
              <Route path="/admin/users" element={<AdminUsersPage />} />
              <Route path="/admin/providers" element={<AdminProvidersPage />} />
              <Route path="/admin/categories" element={<AdminCategoriesPage />} />
              <Route path="/admin/pricing" element={<AdminPricingPage />} />
              <Route path="/admin/audit-logs" element={<AdminAuditLogsPage />} />
            </Route>

            {/* Operations Portal */}
            <Route element={<DashboardLayout allowedRoles={['OPERATIONS_MANAGER', 'PLATFORM_ADMIN']} />}>
              <Route path="/operations/dashboard" element={<OperationsDashboard />} />
              <Route path="/operations/dispatch" element={<OperationsDispatchPage />} />
            </Route>

            {/* Support Portal */}
            <Route element={<DashboardLayout allowedRoles={['SUPPORT_AGENT', 'PLATFORM_ADMIN', 'OPERATIONS_MANAGER']} />}>
              <Route path="/support/dashboard" element={<SupportDashboard />} />
            </Route>

            {/* Fallback */}
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </NotificationProvider>
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;
