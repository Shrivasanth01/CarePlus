import {
  DashboardOverview, Service, ServiceGroupHealth, Incident,
  HealthCheck, MaintenanceWindow, NotificationItem, MonitoringSettings, AuditLog
} from '../types';

const API_BASE = '/api';

export const api = {
  // Auth
  async login(email: string, password: string) {
    const res = await fetch(`${API_BASE}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password })
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({ detail: 'Authentication failed' }));
      throw new Error(err.detail || 'Login failed');
    }
    return res.json();
  },

  async getMe(token: string) {
    const res = await fetch(`${API_BASE}/auth/me`, {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    if (!res.ok) throw new Error('Failed to fetch profile');
    return res.json();
  },

  // Dashboard
  async getDashboardOverview(): Promise<DashboardOverview> {
    const res = await fetch(`${API_BASE}/dashboard/overview`);
    if (!res.ok) throw new Error('Failed to fetch dashboard data');
    return res.json();
  },

  // Services
  async getServices(params?: { search?: string; category?: string; environment?: string; status?: string; group_id?: number }): Promise<Service[]> {
    const query = new URLSearchParams();
    if (params?.search) query.append('search', params.search);
    if (params?.category) query.append('category', params.category);
    if (params?.environment) query.append('environment', params.environment);
    if (params?.status) query.append('status', params.status);
    if (params?.group_id) query.append('group_id', params.group_id.toString());

    const res = await fetch(`${API_BASE}/services?${query.toString()}`);
    if (!res.ok) throw new Error('Failed to fetch services');
    return res.json();
  },

  async getService(id: number): Promise<Service> {
    const res = await fetch(`${API_BASE}/services/${id}`);
    if (!res.ok) throw new Error('Failed to fetch service detail');
    return res.json();
  },

  async createService(data: Partial<Service>): Promise<Service> {
    const res = await fetch(`${API_BASE}/services`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({ detail: 'Failed to create service' }));
      throw new Error(err.detail || 'Failed to create service');
    }
    return res.json();
  },

  async updateService(id: number, data: Partial<Service>): Promise<Service> {
    const res = await fetch(`${API_BASE}/services/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({ detail: 'Failed to update service' }));
      throw new Error(err.detail || 'Failed to update service');
    }
    return res.json();
  },

  async deleteService(id: number): Promise<{ message: string }> {
    const res = await fetch(`${API_BASE}/services/${id}`, { method: 'DELETE' });
    if (!res.ok) throw new Error('Failed to delete service');
    return res.json();
  },

  async triggerCheck(id: number): Promise<any> {
    const res = await fetch(`${API_BASE}/services/${id}/check`, { method: 'POST' });
    if (!res.ok) throw new Error('Failed to execute health check');
    return res.json();
  },

  async toggleEnable(id: number, enable: boolean): Promise<any> {
    const endpoint = enable ? 'enable' : 'disable';
    const res = await fetch(`${API_BASE}/services/${id}/${endpoint}`, { method: 'POST' });
    return res.json();
  },

  async toggleMaintenance(id: number): Promise<any> {
    const res = await fetch(`${API_BASE}/services/${id}/maintenance`, { method: 'POST' });
    return res.json();
  },

  async getServiceMetrics(id: number, period: string = '24h'): Promise<any> {
    const res = await fetch(`${API_BASE}/services/${id}/metrics?period=${period}`);
    if (!res.ok) throw new Error('Failed to fetch service metrics');
    return res.json();
  },

  async getServiceHistory(id: number): Promise<any> {
    const res = await fetch(`${API_BASE}/services/${id}/history`);
    if (!res.ok) throw new Error('Failed to fetch service history');
    return res.json();
  },

  // Service Groups
  async getServiceGroups(): Promise<ServiceGroupHealth[]> {
    const res = await fetch(`${API_BASE}/service-groups`);
    if (!res.ok) throw new Error('Failed to fetch service groups');
    return res.json();
  },

  async createServiceGroup(data: { name: string; description?: string }): Promise<any> {
    const res = await fetch(`${API_BASE}/service-groups`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });
    if (!res.ok) throw new Error('Failed to create group');
    return res.json();
  },

  async deleteServiceGroup(id: number): Promise<any> {
    const res = await fetch(`${API_BASE}/service-groups/${id}`, { method: 'DELETE' });
    return res.json();
  },

  // Incidents
  async getIncidents(params?: { status?: string; severity?: string }): Promise<Incident[]> {
    const query = new URLSearchParams();
    if (params?.status) query.append('status', params.status);
    if (params?.severity) query.append('severity', params.severity);

    const res = await fetch(`${API_BASE}/incidents?${query.toString()}`);
    if (!res.ok) throw new Error('Failed to fetch incidents');
    return res.json();
  },

  async getIncident(id: number): Promise<Incident> {
    const res = await fetch(`${API_BASE}/incidents/${id}`);
    if (!res.ok) throw new Error('Failed to fetch incident');
    return res.json();
  },

  async acknowledgeIncident(id: number): Promise<any> {
    const res = await fetch(`${API_BASE}/incidents/${id}/acknowledge`, { method: 'POST' });
    return res.json();
  },

  async updateIncidentStatus(id: number, status: string, notes?: string): Promise<any> {
    const res = await fetch(`${API_BASE}/incidents/${id}/update-status`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status, notes })
    });
    return res.json();
  },

  async resolveIncident(id: number, resolution_notes: string): Promise<any> {
    const res = await fetch(`${API_BASE}/incidents/${id}/resolve`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ resolution_notes })
    });
    return res.json();
  },

  // Uptime
  async getUptimeSummary(): Promise<any> {
    const res = await fetch(`${API_BASE}/uptime/summary`);
    return res.json();
  },

  async getUptimeServices(period: string = '24h', method: string = 'interval'): Promise<any[]> {
    const res = await fetch(`${API_BASE}/uptime/services?period=${period}&method=${method}`);
    return res.json();
  },

  // Analytics
  async getAvailabilityAnalytics(period: string = '24h'): Promise<any> {
    const res = await fetch(`${API_BASE}/analytics/availability?period=${period}`);
    return res.json();
  },

  async getResponseTimeAnalytics(period: string = '24h'): Promise<any> {
    const res = await fetch(`${API_BASE}/analytics/response-time?period=${period}`);
    return res.json();
  },

  async getIncidentAnalytics(period: string = '30d'): Promise<any> {
    const res = await fetch(`${API_BASE}/analytics/incidents?period=${period}`);
    return res.json();
  },

  async getReliability(): Promise<any> {
    const res = await fetch(`${API_BASE}/analytics/reliability`);
    return res.json();
  },

  // Maintenance Windows
  async getMaintenanceWindows(): Promise<MaintenanceWindow[]> {
    const res = await fetch(`${API_BASE}/maintenance`);
    return res.json();
  },

  async createMaintenanceWindow(data: Partial<MaintenanceWindow>): Promise<MaintenanceWindow> {
    const res = await fetch(`${API_BASE}/maintenance`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({ detail: 'Failed to schedule maintenance' }));
      throw new Error(err.detail || 'Failed to schedule maintenance');
    }
    return res.json();
  },

  async deleteMaintenanceWindow(id: number): Promise<any> {
    const res = await fetch(`${API_BASE}/maintenance/${id}`, { method: 'DELETE' });
    return res.json();
  },

  // Notifications
  async getNotifications(unreadOnly: boolean = false): Promise<NotificationItem[]> {
    const res = await fetch(`${API_BASE}/notifications?unread_only=${unreadOnly}`);
    return res.json();
  },

  async markNotificationRead(id: number): Promise<any> {
    const res = await fetch(`${API_BASE}/notifications/${id}/read`, { method: 'POST' });
    return res.json();
  },

  async markAllNotificationsRead(): Promise<any> {
    const res = await fetch(`${API_BASE}/notifications/read-all`, { method: 'POST' });
    return res.json();
  },

  // Monitoring Settings
  async getMonitoringSettings(): Promise<MonitoringSettings> {
    const res = await fetch(`${API_BASE}/monitoring/settings`);
    return res.json();
  },

  async updateMonitoringSettings(data: Partial<MonitoringSettings>): Promise<MonitoringSettings> {
    const res = await fetch(`${API_BASE}/monitoring/settings`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });
    return res.json();
  },

  async startMonitoringScheduler(): Promise<any> {
    const res = await fetch(`${API_BASE}/monitoring/start`, { method: 'POST' });
    return res.json();
  },

  async stopMonitoringScheduler(): Promise<any> {
    const res = await fetch(`${API_BASE}/monitoring/stop`, { method: 'POST' });
    return res.json();
  },

  async getMonitoringStatus(): Promise<any> {
    const res = await fetch(`${API_BASE}/monitoring/status`);
    return res.json();
  },

  // Audit Logs
  async getAuditLogs(params?: { action?: string; entity_type?: string }): Promise<AuditLog[]> {
    const query = new URLSearchParams();
    if (params?.action) query.append('action', params.action);
    if (params?.entity_type) query.append('entity_type', params.entity_type);
    const res = await fetch(`${API_BASE}/audit-logs?${query.toString()}`);
    return res.json();
  },

  // Demo Controls
  async getDemoScenarios(): Promise<any[]> {
    const res = await fetch(`${API_BASE}/demo/scenarios`);
    return res.json();
  },

  async triggerDemoScenario(scenario: string, service_id?: number): Promise<any> {
    const res = await fetch(`${API_BASE}/demo/trigger`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ scenario, service_id })
    });
    return res.json();
  },

  async resetDemo(): Promise<any> {
    const res = await fetch(`${API_BASE}/demo/reset`, { method: 'POST' });
    return res.json();
  }
};
