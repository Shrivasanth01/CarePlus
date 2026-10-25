import React, { useEffect, useState } from 'react';
import { TrendingUp, Download, CheckCircle, ShieldAlert, Clock, Calendar, HelpCircle } from 'lucide-react';
import { api } from '../services/api';
import { useMonitoring } from '../context/MonitoringContext';

export const UptimeReportsPage: React.FC = () => {
  const { refreshKey } = useMonitoring();
  const [summary, setSummary] = useState<any>(null);
  const [serviceUptimes, setServiceUptimes] = useState<any[]>([]);
  const [period, setPeriod] = useState<string>('24h');
  const [method, setMethod] = useState<'interval' | 'check'>('interval');
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    let isMounted = true;
    setLoading(true);
    Promise.all([
      api.getUptimeSummary(),
      api.getUptimeServices(period, method)
    ]).then(([sum, svcs]) => {
      if (isMounted) {
        setSummary(sum);
        setServiceUptimes(svcs);
        setLoading(false);
      }
    }).catch(() => {
      if (isMounted) setLoading(false);
    });
    return () => { isMounted = false; };
  }, [period, method, refreshKey]);

  const handleExportCSV = () => {
    window.location.href = '/api/analytics/export?format=csv';
  };

  return (
    <div className="space-y-6">
      {/* Page Title & Export */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-[#1F2937] tracking-tight">Uptime & Availability Reports</h1>
          <p className="text-xs text-[#64748B] mt-1">
            Auditable availability metrics across reporting periods, excluding authorized maintenance windows
          </p>
        </div>
        <button
          onClick={handleExportCSV}
          className="px-4 py-2 bg-white hover:bg-slate-50 border border-slate-200 text-slate-700 rounded-xl text-xs font-bold transition-all shadow-xs flex items-center gap-1.5 self-start sm:self-auto"
        >
          <Download className="w-4 h-4 text-[#16A34A]" />
          <span>Export Availability CSV</span>
        </button>
      </div>

      {/* System Uptime Periods Cards (Section 11) */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
        {summary?.periods && Object.entries(summary.periods).map(([p, val]) => (
          <div
            key={p}
            onClick={() => setPeriod(p)}
            className={`p-4 rounded-xl border transition-all cursor-pointer ${
              period === p
                ? 'bg-white border-[#16A34A] ring-2 ring-[#16A34A]/20 shadow-subtle'
                : 'bg-white border-slate-200 hover:border-slate-300 shadow-2xs'
            }`}
          >
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                {p.toUpperCase()} Uptime
              </span>
              <TrendingUp className="w-4 h-4 text-[#16A34A]" />
            </div>
            <p className="mt-2 text-2xl font-black text-[#166534] font-mono">
              {String(val)}%
            </p>
            <span className="text-[10px] text-slate-500 mt-1 block">
              SLA Standard &bull; 99.9%
            </span>
          </div>
        ))}
      </div>

      {/* Calculation Controls & Explanation */}
      <div className="bg-white p-4 rounded-2xl border border-[#E5E7EB] shadow-subtle flex flex-col md:flex-row md:items-center justify-between gap-4 text-xs">
        <div className="flex items-center gap-2">
          <span className="font-bold text-slate-700">Calculation Method:</span>
          <div className="inline-flex rounded-xl bg-slate-100 p-1 border border-slate-200">
            <button
              onClick={() => setMethod('interval')}
              className={`px-3 py-1 rounded-lg font-bold transition-colors ${
                method === 'interval' ? 'bg-[#16A34A] text-white shadow-xs' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Interval-Based (Time Window)
            </button>
            <button
              onClick={() => setMethod('check')}
              className={`px-3 py-1 rounded-lg font-bold transition-colors ${
                method === 'check' ? 'bg-[#16A34A] text-white shadow-xs' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Check-Based (Probe Ratio)
            </button>
          </div>
        </div>

        <div className="flex items-center gap-4 text-[11px] text-slate-500">
          <div className="flex items-center gap-1.5">
            <span className="w-3 h-3 rounded-xs bg-[#16A34A]" />
            <span>Operational (≥99%)</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-3 h-3 rounded-xs bg-amber-500" />
            <span>Degraded (80-99%)</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-3 h-3 rounded-xs bg-red-600" />
            <span>Outage (&lt;80%)</span>
          </div>
        </div>
      </div>

      {/* Detailed Services Uptime Table with Visual Timeline Bars */}
      <div className="bg-white rounded-2xl border border-[#E5E7EB] shadow-subtle overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-200 bg-slate-50 flex items-center justify-between">
          <h3 className="text-sm font-bold text-slate-900">Service Availability & Timeline Blocks ({period.toUpperCase()})</h3>
          <span className="text-xs text-slate-500">Uptime calculated with authorized maintenance excluded</span>
        </div>

        <div className="divide-y divide-slate-100">
          {serviceUptimes.map(svc => (
            <div key={svc.service_id} className="p-4 hover:bg-slate-50/60 transition-colors">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-2">
                <div>
                  <span className="font-bold text-slate-900 text-xs">{svc.service_name}</span>
                  <span className="ml-2 text-[10px] bg-slate-100 text-slate-600 px-1.5 py-0.5 rounded font-mono">
                    {svc.category}
                  </span>
                </div>
                <div className="flex items-center gap-4 text-xs font-mono">
                  <span className="text-slate-500">
                    Downtime: <strong className="text-red-600">{svc.total_downtime_minutes} min</strong>
                  </span>
                  <span className="font-bold text-[#166534] text-sm">
                    {svc.uptime_percentage}%
                  </span>
                </div>
              </div>

              {/* Visual Timeline Blocks (Section 11) */}
              <div className="flex items-center gap-0.5 h-6 w-full rounded-md overflow-hidden bg-slate-100 p-0.5">
                {svc.timeline_blocks?.map((blk: any, idx: number) => {
                  let bg = 'bg-[#16A34A]';
                  if (blk.status === 'down') bg = 'bg-red-600';
                  else if (blk.status === 'degraded') bg = 'bg-amber-500';

                  return (
                    <div
                      key={idx}
                      className={`flex-1 h-full rounded-xs transition-opacity hover:opacity-75 ${bg}`}
                      title={`${blk.time} &bull; ${blk.uptime}% Uptime (${blk.status})`}
                    />
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
