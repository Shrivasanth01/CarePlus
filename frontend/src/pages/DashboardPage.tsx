import React, { useEffect, useState } from 'react';
import {
  Server,
  CheckCircle,
  AlertTriangle,
  XCircle,
  TrendingUp,
  AlertOctagon,
  Clock,
  ShieldCheck,
  Radio,
  Layers,
  ArrowUpRight
} from 'lucide-react';
import { api } from '../services/api';
import { useMonitoring } from '../context/MonitoringContext';
import { DashboardOverview } from '../types';
import { SummaryCard } from '../components/common/SummaryCard';
import { LatencyChart } from '../components/dashboard/LatencyChart';
import { UptimeTrendChart } from '../components/dashboard/UptimeTrendChart';
import { ActiveIncidentsCard } from '../components/dashboard/ActiveIncidentsCard';
import { LiveCheckFeed } from '../components/dashboard/LiveCheckFeed';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { PatientDashboard } from '../components/dashboard/PatientDashboard';
import { StaffDashboard } from '../components/dashboard/StaffDashboard';

export const DashboardPage: React.FC = () => {
  const { currentUser } = useAuth();
  const { refreshKey } = useMonitoring();
  const [data, setData] = useState<DashboardOverview | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;
    api.getDashboardOverview()
      .then(res => {
        if (isMounted) {
          setData(res);
          setLoading(false);
        }
      })
      .catch(err => {
        if (isMounted) {
          setError(err.message);
          setLoading(false);
        }
      });
    return () => { isMounted = false; };
  }, [refreshKey]);

  // Dedicated role viewpoints
  if (currentUser.role === 'Patient' || currentUser.role === 'Viewer') {
    return <PatientDashboard />;
  }

  if (currentUser.role === 'Staff' || currentUser.role === 'Operator') {
    return <StaffDashboard />;
  }

  if (loading && !data) {
    return (
      <div className="py-20 flex flex-col items-center justify-center space-y-3">
        <div className="w-10 h-10 border-4 border-[#16A34A] border-t-transparent rounded-full animate-spin" />
        <p className="text-xs font-semibold text-[#64748B]">Loading observability telemetry...</p>
      </div>
    );
  }

  if (error && !data) {
    return (
      <div className="p-6 bg-red-50 border border-red-200 rounded-2xl text-red-700 text-xs">
        Failed to load dashboard: {error}
      </div>
    );
  }

  const s = data?.summary || {
    total_services: 0,
    operational_services: 0,
    degraded_services: 0,
    down_services: 0,
    overall_uptime_percentage: 100,
    active_incidents: 0,
    avg_response_time_ms: 0,
    monitoring_coverage_percentage: 100
  };

  return (
    <div className="space-y-6">
      {/* Top Welcome & Subheading */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-[#1F2937] tracking-tight">
            System Observability & Service Health
          </h1>
          <p className="text-xs text-[#64748B] mt-1">
            Real-time availability telemetry, SLA uptime adherence, latency percentiles, and incident tracking
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Link
            to="/services"
            className="px-3.5 py-2 bg-[#16A34A] hover:bg-[#15803D] text-white rounded-xl text-xs font-bold transition-all shadow-xs flex items-center gap-1.5"
          >
            <span>Manage All Services</span>
            <ArrowUpRight className="w-3.5 h-3.5" />
          </Link>
        </div>
      </div>

      {/* 8 Summary Metric Cards (Section 5 requirements) */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <SummaryCard
          title="Total Services"
          value={s.total_services}
          subtitle="Monitored fleet"
          icon={Server}
          variant="normal"
        />
        <SummaryCard
          title="Operational"
          value={s.operational_services}
          subtitle="Responding healthy"
          icon={CheckCircle}
          variant="success"
          trend={{ value: `${Math.round((s.operational_services / (s.total_services || 1)) * 100)}%`, isPositive: true, label: 'fleet health' }}
        />
        <SummaryCard
          title="Degraded"
          value={s.degraded_services}
          subtitle="Latency warnings"
          icon={AlertTriangle}
          variant={s.degraded_services > 0 ? "warning" : "normal"}
        />
        <SummaryCard
          title="Down / Outages"
          value={s.down_services}
          subtitle="Critical downtime"
          icon={XCircle}
          variant={s.down_services > 0 ? "danger" : "normal"}
        />
        <SummaryCard
          title="Overall Uptime"
          value={`${s.overall_uptime_percentage}%`}
          subtitle="Past 24 hours"
          icon={TrendingUp}
          variant={s.overall_uptime_percentage >= 99.5 ? "success" : "warning"}
          trend={{ value: '99.9%', isPositive: s.overall_uptime_percentage >= 99.9, label: 'SLA target' }}
        />
        <SummaryCard
          title="Active Incidents"
          value={s.active_incidents}
          subtitle="Open disruptions"
          icon={AlertOctagon}
          variant={s.active_incidents > 0 ? "danger" : "normal"}
        />
        <SummaryCard
          title="Avg Latency"
          value={`${s.avg_response_time_ms} ms`}
          subtitle="Probe roundtrip"
          icon={Clock}
          variant={s.avg_response_time_ms > 300 ? "warning" : "normal"}
        />
        <SummaryCard
          title="Coverage"
          value={`${s.monitoring_coverage_percentage}%`}
          subtitle="Active probes"
          icon={ShieldCheck}
          variant="info"
        />
      </div>

      {/* Interactive Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <LatencyChart data={data?.latency_trend || []} />
        <UptimeTrendChart data={data?.uptime_trend || []} />
      </div>

      {/* Lower Dual Panel: Active Incidents & Live Probes Feed */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <ActiveIncidentsCard incidents={data?.active_incidents || []} />
        <LiveCheckFeed initialChecks={data?.recent_checks || []} />
      </div>
    </div>
  );
};
