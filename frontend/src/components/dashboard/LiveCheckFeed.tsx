import React from 'react';
import { Activity, Clock } from 'lucide-react';
import { HealthCheck } from '../../types';
import { StatusBadge } from '../common/StatusBadge';
import { useMonitoring } from '../../context/MonitoringContext';

interface LiveCheckFeedProps {
  initialChecks: HealthCheck[];
}

export const LiveCheckFeed: React.FC<LiveCheckFeedProps> = ({ initialChecks }) => {
  const { recentLiveChecks } = useMonitoring();

  // Combine initial seeded checks with live incoming checks
  const checksToDisplay = recentLiveChecks.length > 0 ? recentLiveChecks : initialChecks;

  return (
    <div className="bg-white p-5 rounded-2xl border border-[#E5E7EB] shadow-subtle flex flex-col justify-between">
      <div>
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-lg bg-[#DCFCE7] text-[#166534]">
              <Activity className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-[#1F2937]">Live Health Check Stream</h3>
              <p className="text-xs text-[#64748B]">Real-time probe events received via WebSocket</p>
            </div>
          </div>
          <span className="flex items-center gap-1.5 text-xs text-[#166534] bg-[#DCFCE7] px-2.5 py-0.5 rounded-full font-medium">
            <span className="w-2 h-2 rounded-full bg-[#16A34A] animate-pulse" />
            Live
          </span>
        </div>

        <div className="space-y-2 max-h-96 overflow-y-auto pr-1">
          {checksToDisplay.slice(0, 10).map((chk) => (
            <div
              key={chk.id}
              className="p-2.5 rounded-xl border border-slate-100 hover:border-slate-200 bg-slate-50/50 hover:bg-slate-50 transition-colors flex items-center justify-between gap-2 text-xs"
            >
              <div className="flex items-center gap-2.5 min-w-0">
                <StatusBadge status={chk.status} size="sm" showPulse={false} />
                <span className="font-semibold text-slate-800 truncate">
                  {chk.service_name || `Service #${chk.service_id}`}
                </span>
                {chk.http_status_code && (
                  <span className="font-mono text-[10px] text-slate-400 bg-white px-1.5 py-0.5 rounded border border-slate-200">
                    HTTP {chk.http_status_code}
                  </span>
                )}
              </div>

              <div className="flex items-center gap-3 shrink-0">
                <span
                  className={`font-mono text-xs font-bold ${
                    chk.response_time_ms > 800
                      ? 'text-red-600'
                      : chk.response_time_ms > 300
                      ? 'text-amber-600'
                      : 'text-[#166534]'
                  }`}
                >
                  {chk.response_time_ms} ms
                </span>
                <span className="text-[10px] text-slate-400">
                  {new Date(chk.checked_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
