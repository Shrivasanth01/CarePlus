import React, { useEffect, useState } from 'react';
import { Clock, Zap, AlertTriangle, ArrowUpRight, BarChart3, ShieldCheck } from 'lucide-react';
import { api } from '../services/api';
import { useMonitoring } from '../context/MonitoringContext';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid
} from 'recharts';

export const ResponseTimePage: React.FC = () => {
  const { refreshKey } = useMonitoring();
  const [data, setData] = useState<any>(null);
  const [period, setPeriod] = useState<string>('24h');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;
    api.getResponseTimeAnalytics(period).then(res => {
      if (isMounted) {
        setData(res);
        setLoading(false);
      }
    });
    return () => { isMounted = false; };
  }, [period, refreshKey]);

  const slowestData = (data?.slowest_services || []).map((s: any) => ({
    name: s.service_name,
    p95: s.p95_latency,
    avg: s.avg_latency
  }));

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-[#1F2937] tracking-tight">Response Time & Latency Analytics</h1>
          <p className="text-xs text-[#64748B] mt-1">
            End-to-end roundtrip performance, latency percentiles (P95, P99), and slowest endpoint diagnostics
          </p>
        </div>

        <div className="flex items-center gap-1 bg-white p-1 rounded-xl border border-slate-200 text-xs font-semibold shadow-2xs">
          {['24h', '7d'].map(p => (
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

      {/* Global Percentiles (Section 12) */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs">
          <span className="text-[10px] uppercase font-bold text-slate-400">Average Latency</span>
          <p className="mt-1 text-xl font-black text-[#166534] font-mono">
            {data?.global_metrics?.avg || 0} ms
          </p>
          <span className="text-[10px] text-slate-400">Fleet wide mean</span>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs">
          <span className="text-[10px] uppercase font-bold text-slate-400">Median Latency (P50)</span>
          <p className="mt-1 text-xl font-black text-slate-800 font-mono">
            {data?.global_metrics?.median || 0} ms
          </p>
          <span className="text-[10px] text-slate-400">Typical user experience</span>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs">
          <span className="text-[10px] uppercase font-bold text-slate-400">95th Percentile (P95)</span>
          <p className="mt-1 text-xl font-black text-amber-700 font-mono">
            {data?.global_metrics?.p95 || 0} ms
          </p>
          <span className="text-[10px] text-slate-400">Peak tail latency</span>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs">
          <span className="text-[10px] uppercase font-bold text-slate-400">99th Percentile (P99)</span>
          <p className="mt-1 text-xl font-black text-red-600 font-mono">
            {data?.global_metrics?.p99 || 0} ms
          </p>
          <span className="text-[10px] text-slate-400">Worst 1% performance</span>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs">
          <span className="text-[10px] uppercase font-bold text-slate-400">Min / Max Recorded</span>
          <p className="mt-1 text-base font-black text-slate-800 font-mono">
            {data?.global_metrics?.min || 0} / {data?.global_metrics?.max || 0} ms
          </p>
          <span className="text-[10px] text-slate-400">Observed envelope</span>
        </div>
      </div>

      {/* Slowest Services Leaderboard Chart */}
      <div className="bg-white p-5 rounded-2xl border border-[#E5E7EB] shadow-subtle">
        <h3 className="text-sm font-bold text-[#1F2937] mb-1">Slowest Monitored Endpoints (Sorted by P95 Latency)</h3>
        <p className="text-xs text-[#64748B] mb-4">Comparison of Average vs 95th percentile latency</p>

        <div className="h-64 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={slowestData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#F1F5F9" />
              <XAxis dataKey="name" tickLine={false} tick={{ fontSize: 11, fill: '#64748B' }} />
              <YAxis tickLine={false} tick={{ fontSize: 11, fill: '#64748B' }} unit="ms" />
              <Tooltip />
              <Bar dataKey="avg" fill="#16A34A" name="Average Latency" radius={[4, 4, 0, 0]} maxBarSize={30} />
              <Bar dataKey="p95" fill="#F59E0B" name="P95 Latency" radius={[4, 4, 0, 0]} maxBarSize={30} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Latency Thresholds Reference Card */}
      <div className="bg-white p-5 rounded-2xl border border-[#E5E7EB] shadow-subtle">
        <h3 className="text-sm font-bold text-[#1F2937] mb-2">Configured Latency Threshold Standards</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
          <div className="p-3.5 rounded-xl border border-green-200 bg-green-50/50">
            <span className="font-bold text-[#166534] flex items-center gap-1.5">
              <ShieldCheck className="w-4 h-4 text-[#16A34A]" />
              Healthy Baseline (&lt;300ms)
            </span>
            <p className="text-slate-600 mt-1">
              Optimal operational responsiveness. No alerts triggered.
            </p>
          </div>

          <div className="p-3.5 rounded-xl border border-amber-200 bg-amber-50/50">
            <span className="font-bold text-amber-800 flex items-center gap-1.5">
              <AlertTriangle className="w-4 h-4 text-amber-600" />
              Warning Threshold (300ms - 800ms)
            </span>
            <p className="text-slate-600 mt-1">
              Service transitions to Degraded status. Warning events logged.
            </p>
          </div>

          <div className="p-3.5 rounded-xl border border-red-200 bg-red-50/50">
            <span className="font-bold text-red-800 flex items-center gap-1.5">
              <Zap className="w-4 h-4 text-red-600" />
              Critical Breach (&gt;800ms)
            </span>
            <p className="text-slate-600 mt-1">
              Severe performance degradation. Potential incident escalation.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
