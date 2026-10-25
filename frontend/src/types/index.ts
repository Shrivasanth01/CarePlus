export type ServiceStatus = 'Operational' | 'Degraded' | 'Down' | 'Unknown' | 'Maintenance';
export type IncidentSeverity = 'Critical' | 'High' | 'Medium' | 'Low';
export type IncidentStatus = 'Detected' | 'Investigating' | 'Identified' | 'Monitoring Recovery' | 'Resolved';
export type UserRole = 'Administrator' | 'Staff' | 'Patient' | 'Admin' | 'Operator' | 'Viewer';

export interface PatientAppointment {
  id: number;
  doctor_name: string;
  department: string;
  date_time: string;
  status: 'Confirmed' | 'Pending' | 'Completed' | 'Cancelled';
  room?: string;
  type: 'In-Person' | 'Telehealth Video';
}

export interface ClinicalSystemAlert {
  id: number;
  system_name: string;
  department: string;
  severity: 'Critical' | 'Warning' | 'Info';
  message: string;
  timestamp: string;
}

export interface User {
  id: number;
  name: string;
  email: string;
  role: UserRole;
  is_active: boolean;
  created_at: string;
  department?: string;
  patient_id?: string;
}

export interface Service {
  id: number;
  name: string;
  description?: string;
  url: string;
  category: string;
  environment: string;
  monitoring_type: string;
  status: ServiceStatus;
  monitoring_enabled: boolean;
  monitoring_interval: number;
  timeout_seconds: number;
  expected_status_code: number;
  warning_threshold_ms: number;
  critical_threshold_ms: number;
  failure_threshold: number;
  recovery_threshold: number;
  group_id?: number;
  owner_id?: number;
  group_name?: string;
  owner_name?: string;
  current_response_time_ms?: number;
  uptime_percentage_24h?: number;
  last_checked_at?: string;
  active_incident_count?: number;
  created_at: string;
  updated_at: string;
}

export interface ServiceGroupHealth {
  id: number;
  name: string;
  description?: string;
  total_services: number;
  operational: number;
  degraded: number;
  down: number;
  uptime_percentage: number;
  active_incidents: number;
}

export interface HealthCheck {
  id: number;
  service_id: number;
  service_name?: string;
  check_type: string;
  status: string;
  response_time_ms: number;
  http_status_code?: number;
  error_message?: string;
  checked_at: string;
}

export interface IncidentEvent {
  id: number;
  incident_id: number;
  event_type: string;
  message: string;
  user_id?: number;
  created_at: string;
}

export interface Incident {
  id: number;
  incident_number: string;
  service_id: number;
  service_name?: string;
  title: string;
  description?: string;
  severity: IncidentSeverity;
  status: IncidentStatus;
  detected_at: string;
  acknowledged_at?: string;
  recovery_started_at?: string;
  resolved_at?: string;
  duration_seconds?: number;
  resolution_notes?: string;
  assigned_user_id?: number;
  assigned_user_name?: string;
  events?: IncidentEvent[];
}

export interface DashboardSummary {
  total_services: number;
  operational_services: number;
  degraded_services: number;
  down_services: number;
  overall_uptime_percentage: number;
  active_incidents: number;
  avg_response_time_ms: number;
  monitoring_coverage_percentage: number;
}

export interface LatencyPoint {
  time: string;
  avg_latency: number;
  p95_latency: number;
}

export interface UptimeTrendPoint {
  time: string;
  uptime: number;
}

export interface DashboardOverview {
  summary: DashboardSummary;
  status_distribution: Record<string, number>;
  recent_checks: HealthCheck[];
  active_incidents: Incident[];
  latency_trend: LatencyPoint[];
  uptime_trend: UptimeTrendPoint[];
}

export interface MaintenanceWindow {
  id: number;
  service_id?: number;
  service_name?: string;
  title: string;
  description?: string;
  start_time: string;
  end_time: string;
  status: string;
  created_by?: number;
  created_at: string;
}

export interface NotificationItem {
  id: number;
  user_id?: number;
  service_id?: number;
  incident_id?: number;
  notification_type: string;
  title: string;
  message: string;
  is_read: boolean;
  created_at: string;
}

export interface MonitoringSettings {
  id: number;
  service_id?: number;
  monitoring_interval: number;
  timeout_seconds: number;
  retry_count: number;
  failure_threshold: number;
  recovery_threshold: number;
  warning_threshold_ms: number;
  critical_threshold_ms: number;
  updated_at: string;
}

export interface AuditLog {
  id: number;
  user_id?: number;
  user_name?: string;
  action: string;
  entity_type: string;
  entity_id?: string;
  details?: string;
  created_at: string;
}
