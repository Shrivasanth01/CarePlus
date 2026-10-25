import React, { useState } from 'react';
import { AlertOctagon, CheckCircle, ExternalLink, ArrowRight, UserCheck } from 'lucide-react';
import { Incident } from '../../types';
import { SeverityBadge } from '../common/SeverityBadge';
import { api } from '../../services/api';
import { useMonitoring } from '../../context/MonitoringContext';
import { Link } from 'react-router-dom';

interface ActiveIncidentsCardProps {
  incidents: Incident[];
}

export const ActiveIncidentsCard: React.FC<ActiveIncidentsCardProps> = ({ incidents }) => {
  const { triggerRefresh } = useMonitoring();
  const [actingId, setActingId] = useState<number | null>(null);

  const handleAcknowledge = async (id: number) => {
    try {
      setActingId(id);
      await api.acknowledgeIncident(id);
      triggerRefresh();
    } finally {
      setActingId(null);
    }
  };

  return (
    <div className="bg-white p-5 rounded-2xl border border-[#E5E7EB] shadow-subtle flex flex-col justify-between">
      <div>
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-lg bg-red-100 text-red-700">
              <AlertOctagon className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-[#1F2937]">Active Incidents</h3>
              <p className="text-xs text-[#64748B]">Requiring attention or investigation</p>
            </div>
          </div>
          <Link
            to="/incidents"
            className="text-xs font-semibold text-[#16A34A] hover:underline flex items-center gap-1"
          >
            <span>View All</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        {incidents.length === 0 ? (
          <div className="py-8 text-center bg-slate-50/70 rounded-xl border border-dashed border-slate-200">
            <CheckCircle className="w-8 h-8 text-[#16A34A] mx-auto mb-2 opacity-80" />
            <p className="text-xs font-bold text-slate-800">All Systems Operational</p>
            <p className="text-[11px] text-slate-500 mt-0.5">No open incidents or detected disruptions</p>
          </div>
        ) : (
          <div className="space-y-2.5">
            {incidents.map((inc) => (
              <div
                key={inc.id}
                className="p-3.5 rounded-xl border border-red-100 bg-red-50/30 hover:bg-red-50/60 transition-colors flex flex-col gap-2"
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-mono text-xs font-bold text-slate-900">
                      {inc.incident_number}
                    </span>
                    <SeverityBadge severity={inc.severity} />
                    <span className="text-xs font-semibold text-slate-800 truncate">
                      {inc.service_name}
                    </span>
                  </div>
                  <span className="text-[10px] text-slate-500 whitespace-nowrap">
                    {new Date(inc.detected_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </span>
                </div>

                <p className="text-xs text-slate-600 line-clamp-1">
                  {inc.title}
                </p>

                <div className="flex items-center justify-between pt-1 border-t border-red-100/60 text-xs">
                  <span className="text-[11px] text-slate-500 flex items-center gap-1">
                    <UserCheck className="w-3 h-3 text-slate-400" />
                    {inc.assigned_user_name || 'Unassigned'}
                  </span>

                  {inc.status === 'Detected' && (
                    <button
                      onClick={() => handleAcknowledge(inc.id)}
                      disabled={actingId === inc.id}
                      className="px-2.5 py-1 bg-amber-600 hover:bg-amber-700 text-white rounded-lg text-[11px] font-semibold transition-colors disabled:opacity-50"
                    >
                      {actingId === inc.id ? 'Updating...' : 'Acknowledge'}
                    </button>
                  )}
                  {inc.status !== 'Detected' && (
                    <span className="text-[11px] font-semibold text-amber-700 bg-amber-100 px-2 py-0.5 rounded">
                      {inc.status}
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
