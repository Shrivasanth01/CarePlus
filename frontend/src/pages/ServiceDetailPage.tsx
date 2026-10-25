import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import {
  ArrowLeft,
  Server,
  RefreshCw,
  Clock,
  TrendingUp,
  AlertOctagon,
  CheckCircle2,
  XCircle,
  ExternalLink,
  Shield,
  Calendar,
  Activity
} from 'lucide-react';
import { api } from '../services/api';
import { useMonitoring } from '../context/MonitoringContext';
import { Service, HealthCheck } from '../types';
import { StatusBadge } from '../components/common/StatusBadge';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid
} from 'recharts';

export const ServiceDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const serviceId = parseInt(id || '1');
  const { refreshKey, triggerRefresh } = useMonitoring();

  const [service, setService] = useState<Service | null>(null);
  const [metrics, setMetrics] = useState<any>(null);
  const [history, setHistory] = useState<{ checks: HealthCheck[]; status_events: any[] } | null>(null);
  const [period, setPeriod] = useState<string>('24h');
  const [loading, setLoading] = useState<boolean>(true);
  const [triggeringCheck, setTriggeringCheck] = useState<boolean>(false);

  useEffect(() => {
    let isMounted = true;
    const loadData = async () => {
      try {
        setLoading(true);
        const [svc, m, h] = await Promise.all([
          api.getService(serviceId),
          api.getServiceMetrics(serviceId, period),
          api.getServiceHistory(serviceId)
        ]);
        if (isMounted) {
          setService(svc);
          setMetrics(m);
          setHistory(h);
        }
      } catch (e) {
        console.error(e);
      } finally {
        if (isMounted) setLoading(false);
      }
    };
    loadData();
    return () => { isMounted = false; };
  }, [serviceId, period, refreshKey]);

  const handleManualCheck = async () => {
    try {
      setTriggeringCheck(true);
      await api.triggerCheck(serviceId);
      triggerRefresh();
    } finally {
      setTriggeringCheck(false);
    }
  };

  if (loading && !service) {
    return (
      <div className="py-20 flex flex-col items-center justify-center space-y-3">
        <div className="w-10 h-10 border-4 border-[#16A34A] border-t-transparent rounded-full animate-spin" />
        <p className="text-xs font-semibold text-[#64748B]">Loading service observability metrics...</p>
      </div>
    );
  }

  if (!service) {
    return (
      <div className="p-6 bg-red-50 border border-red-200 rounded-2xl text-red-700 text-xs">
        Service not found. <Link to="/services" className="underline font-bold">Return to services list</Link>
      </div>
    );
  }

  // Format latency chart data from historical checks
  const latencyChartData = (history?.checks || [])
    .slice()
    .reverse()
    .map(chk => ({
      time: new Date(chk.checked_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      latency: chk.response_time_ms,
      status: chk.status
    }));

  return (
    <div className="space-y-6">
      {/* Back and Breadcrumbs */}
      <div className="flex items-center justify-between">
        <Link
          to="/services"
          className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-600 hover:text-[#16A34A] transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to All Services</span>
        </Link>

        {/* Time Filter Buttons */}
        <div className="flex items-center gap-1 bg-white p-1 rounded-xl border border-slate-200 text-xs font-semibold shadow-2xs">
          {['1h', '6h', '24h', '7d', '30d'].map(p => (
            <button
              key={p}
              onClick={() => setPeriod(p)}
              className={`px-3 py-1 rounded-lg transition-colors ${
                period === p
                  ? 'bg-[#DCFCE7] text-[#166534] font-bold shadow-2xs'
                  : 'text-slate-600 hover:bg-slate-100'
              }`}
            >
              {p.toUpperCase()}
            </button>
          ))}
        </div>
      </div>

      {/* Main Service Header Banner */}
      <div className="bg-white p-6 rounded-2xl border border-[#E5E7EB] shadow-subtle flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-black text-[#1F2937] tracking-tight">{service.name}</h1>
            <StatusBadge status={service.status} size="lg" />
          </div>
          <div className="mt-2 flex flex-wrap items-center gap-3 text-xs text-[#64748B]">
            <span className="font-mono bg-slate-100 px-2 py-0.5 rounded text-slate-700">
              {service.url}
            </span>
            <span>&bull;</span>
            <span>Category: <strong className="text-slate-800">{service.category}</strong></span>
            <span>&bull;</span>
            <span>Environment: <strong className="text-slate-800">{service.environment}</strong></span>
            <span>&bull;</span>
            <span>Owner: <strong className="text-slate-800">{service.owner_name || 'System Admin'}</strong></span>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handleManualCheck}
            disabled={triggeringCheck}
            className="px-4 py-2 bg-[#16A34A] hover:bg-[#15803D] text-white rounded-xl text-xs font-bold transition-all shadow-xs flex items-center gap-2 disabled:opacity-50"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${triggeringCheck ? 'animate-spin' : ''}`} />
            <span>Check Now</span>
          </button>
        </div>
      </div>

      {/* Metric Cards Grid (Section 8: Service Metrics) */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs">
          <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Current Latency</span>
          <p className="mt-1 text-xl font-black text-[#166534] font-mono">
            {metrics?.current_response_time_ms ? `${metrics.current_response_time_ms} ms` : '—'}
          </p>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs">
          <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Avg Latency</span>
          <p className="mt-1 text-xl font-black text-slate-800 font-mono">
            {metrics?.avg_response_time_ms} ms
          </p>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs">
          <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">P95 / P99 Latency</span>
          <p className="mt-1 text-xl font-black text-amber-700 font-mono">
            {metrics?.p95_response_time_ms} / {metrics?.p99_response_time_ms} ms
          </p>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs">
          <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Uptime Percentage</span>
          <p className="mt-1 text-xl font-black text-[#166534] font-mono">
            {metrics?.uptime_percentage}%
          </p>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs">
          <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Total Checks</span>
          <p className="mt-1 text-xl font-black text-slate-800 font-mono">
            {metrics?.total_checks}
          </p>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs">
          <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Total Downtime</span>
          <p className="mt-1 text-xl font-black text-red-600 font-mono">
            {metrics?.total_downtime_minutes} min
          </p>
        </div>
      </div>

      {/* Latency History Chart */}
      <div className="bg-white p-5 rounded-2xl border border-[#E5E7EB] shadow-subtle">
        <h3 className="text-sm font-bold text-[#1F2937] mb-3">Response Time Telemetry ({period.toUpperCase()})</h3>
        <div className="h-64 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={latencyChartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
              <defs>
                <linearGradient id="serviceLatencyGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#16A34A" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#16A34A" stopOpacity={0.0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#F1F5F9" />
              <XAxis dataKey="time" tickLine={false} tick={{ fontSize: 11, fill: '#64748B' }} />
              <YAxis tickLine={false} tick={{ fontSize: 11, fill: '#64748B' }} unit="ms" />
              <Tooltip
                content={({ active, payload, label }) => {
                  if (active && payload && payload.length) {
                    return (
                      <div className="bg-white p-3 border border-slate-200 rounded-xl shadow-elevated text-xs">
                        <p className="font-bold text-slate-800">{label}</p>
                        <p className="text-[#166534] font-semibold">Latency: {payload[0]?.value} ms</p>
                      </div>
                    );
                  }
                  return null;
                }}
              />
              <Area
                type="monotone"
                dataKey="latency"
                stroke="#16A34A"
                strokeWidth={2.5}
                fillOpacity={1}
                fill="url(#serviceLatencyGrad)"
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Recent Probes Table */}
      <div className="bg-white rounded-2xl border border-[#E5E7EB] shadow-subtle overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-200 bg-slate-50 flex items-center justify-between">
          <h3 className="text-sm font-bold text-slate-900">Health Check History Log</h3>
          <span className="text-xs text-slate-500">Showing last 50 recorded probe executions</span>
        </div>
        <div className="overflow-x-auto max-h-96">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-100/60 sticky top-0 text-[11px] font-bold uppercase tracking-wider text-slate-500">
              <tr>
                <th className="py-2.5 px-4">Timestamp</th>
                <th className="py-2.5 px-4">Status</th>
                <th className="py-2.5 px-4">HTTP Status</th>
                <th className="py-2.5 px-4">Latency</th>
                <th className="py-2.5 px-4">Error / Probe Message</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-mono">
              {history?.checks.map(chk => (
                <tr key={chk.id} className="hover:bg-slate-50">
                  <td className="py-2.5 px-4 text-slate-500">
                    {new Date(chk.checked_at).toLocaleString()}
                  </td>
                  <td className="py-2.5 px-4 font-sans">
                    <StatusBadge status={chk.status} size="sm" showPulse={false} />
                  </td>
                  <td className="py-2.5 px-4">
                    {chk.http_status_code ? (
                      <span className={`px-2 py-0.5 rounded text-[11px] font-bold ${
                        chk.http_status_code === 200 ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                      }`}>
                        {chk.http_status_code}
                      </span>
                    ) : '—'}
                  </td>
                  <td className={`py-2.5 px-4 font-bold ${
                    chk.response_time_ms > 800 ? 'text-red-600' : chk.response_time_ms > 300 ? 'text-amber-600' : 'text-[#166534]'
                  }`}>
                    {chk.response_time_ms} ms
                  </td>
                  <td className="py-2.5 px-4 font-sans text-slate-600 max-w-sm truncate">
                    {chk.error_message || 'OK'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
