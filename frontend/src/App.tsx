import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { MonitoringProvider } from './context/MonitoringContext';
import { Layout } from './components/layout/Layout';

// Pages
import { DashboardPage } from './pages/DashboardPage';
import { ServicesPage } from './pages/ServicesPage';
import { ServiceDetailPage } from './pages/ServiceDetailPage';
import { ServiceGroupsPage } from './pages/ServiceGroupsPage';
import { IncidentsPage } from './pages/IncidentsPage';
import { UptimeReportsPage } from './pages/UptimeReportsPage';
import { ResponseTimePage } from './pages/ResponseTimePage';
import { MaintenancePage } from './pages/MaintenancePage';
import { MonitoringConfigPage } from './pages/MonitoringConfigPage';
import { NotificationsPage } from './pages/NotificationsPage';
import { AuditLogsPage } from './pages/AuditLogsPage';

export const App: React.FC = () => {
  return (
    <BrowserRouter>
      <AuthProvider>
        <MonitoringProvider>
          <Routes>
            <Route path="/" element={<Layout />}>
              <Route index element={<DashboardPage />} />
              <Route path="services" element={<ServicesPage />} />
              <Route path="services/:id" element={<ServiceDetailPage />} />
              <Route path="service-groups" element={<ServiceGroupsPage />} />
              <Route path="incidents" element={<IncidentsPage />} />
              <Route path="uptime" element={<UptimeReportsPage />} />
              <Route path="response-time" element={<ResponseTimePage />} />
              <Route path="maintenance" element={<MaintenancePage />} />
              <Route path="monitoring-config" element={<MonitoringConfigPage />} />
              <Route path="notifications" element={<NotificationsPage />} />
              <Route path="audit-logs" element={<AuditLogsPage />} />
              <Route path="*" element={<Navigate to="/" replace />} />
            </Route>
          </Routes>
        </MonitoringProvider>
      </AuthProvider>
    </BrowserRouter>
  );
};

export default App;
