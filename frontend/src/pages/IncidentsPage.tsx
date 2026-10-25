import React, { useEffect, useState } from 'react';
import { AlertOctagon, CheckCircle2, Clock, Search, Filter, ShieldAlert, ArrowRight } from 'lucide-react';
import { api } from '../services/api';
import { useMonitoring } from '../context/MonitoringContext';
import { Incident } from '../types';
import { SeverityBadge } from '../components/common/SeverityBadge';
import { IncidentModal } from '../components/incidents/IncidentModal';

export const IncidentsPage: React.FC = () => {
  const { refreshKey, triggerRefresh } = useMonitoring();
  const [incidents, setIncidents] = useState<Incident[]>([]);
  const [tab, setTab] = useState<'active' | 'all' | 'resolved'>('active');
  const [severityFilter, setSeverityFilter] = useState<string>('all');
  const [search, setSearch] = useState('');
  const [selectedIncident, setSelectedIncident] = useState<Incident | null>(null);

  const fetchIncidents = async () => {
    try {
      const data = await api.getIncidents({
        status: tab === 'active' ? 'active' : (tab === 'resolved' ? 'Resolved' : undefined),
        severity: severityFilter === 'all' ? undefined : severityFilter
      });
      setIncidents(data);
    } catch (e) {
      console.error(e);
    }
  };

  useEffect(() => {
    fetchIncidents();
  }, [tab, severityFilter, refreshKey]);

  const filteredIncidents = incidents.filter(i => {
    return !search || i.title.toLowerCase().includes(search.toLowerCase()) || i.incident_number.toLowerCase().includes(search.toLowerCase());
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-[#1F2937] tracking-tight">Incident Management</h1>
          <p className="text-xs text-[#64748B] mt-1">
            Outage lifecycle tracking, root cause investigations, MTTR analytics, and resolution notes
          </p>
        </div>
      </div>

      {/* Tabs and Controls */}
      <div className="bg-white p-4 rounded-2xl border border-[#E5E7EB] shadow-subtle space-y-3">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
          {/* Tab Selection */}
          <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl text-xs font-semibold">
            {[
              { id: 'active', label: 'Active Outages' },
              { id: 'resolved', label: 'Resolved History' },
              { id: 'all', label: 'All Incidents' }
            ].map(t => (
              <button
                key={t.id}
                onClick={() => setTab(t.id as any)}
                className={`px-3 py-1.5 rounded-lg transition-colors ${
                  tab === t.id
                    ? 'bg-white text-slate-900 shadow-2xs font-bold'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                {t.label}
              </button>
            ))}
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto">
            {/* Search */}
            <div className="relative flex-1 sm:w-64">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={search}
                onChange={e => setSearch(e.target.value)}
                placeholder="Search by ID or description..."
                className="w-full pl-9 pr-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 focus:outline-none focus:border-[#16A34A]"
              />
            </div>

            {/* Severity Filter */}
            <select
              value={severityFilter}
              onChange={e => setSeverityFilter(e.target.value)}
              className="px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-700"
            >
              <option value="all">All Severities</option>
              <option value="Critical">Critical</option>
              <option value="High">High</option>
              <option value="Medium">Medium</option>
              <option value="Low">Low</option>
            </select>
          </div>
        </div>
      </div>

      {/* Incidents Table */}
      <div className="bg-white rounded-2xl border border-[#E5E7EB] shadow-subtle overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 border-b border-slate-200 text-[11px] font-bold uppercase tracking-wider text-[#64748B]">
              <tr>
                <th className="py-3 px-4">Incident ID</th>
                <th className="py-3 px-4">Affected Service</th>
                <th className="py-3 px-4">Severity</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4">Detected At</th>
                <th className="py-3 px-4">Duration</th>
                <th className="py-3 px-4">Assignee</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredIncidents.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-slate-400">
                    No incidents found
                  </td>
                </tr>
              ) : (
                filteredIncidents.map(inc => (
                  <tr
                    key={inc.id}
                    onClick={() => setSelectedIncident(inc)}
                    className="hover:bg-slate-50/70 transition-colors cursor-pointer"
                  >
                    <td className="py-3.5 px-4 font-mono font-bold text-slate-900">
                      {inc.incident_number}
                    </td>
                    <td className="py-3.5 px-4 font-bold text-slate-800">
                      {inc.service_name || 'System Service'}
                    </td>
                    <td className="py-3.5 px-4">
                      <SeverityBadge severity={inc.severity} />
                    </td>
                    <td className="py-3.5 px-4">
                      <span className={`px-2 py-0.5 rounded text-[11px] font-bold ${
                        inc.status === 'Resolved'
                          ? 'bg-green-100 text-[#166534]'
                          : inc.status === 'Detected'
                          ? 'bg-red-100 text-red-800'
                          : 'bg-amber-100 text-amber-800'
                      }`}>
                        {inc.status}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-slate-500 font-mono">
                      {new Date(inc.detected_at).toLocaleString()}
                    </td>
                    <td className="py-3.5 px-4 text-slate-700 font-mono">
                      {inc.duration_seconds ? `${Math.round(inc.duration_seconds / 60)} min` : 'Ongoing'}
                    </td>
                    <td className="py-3.5 px-4 text-slate-600">
                      {inc.assigned_user_name || 'Unassigned'}
                    </td>
                    <td className="py-3.5 px-4 text-right">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelectedIncident(inc);
                        }}
                        className="px-2.5 py-1 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-lg text-[11px] font-semibold transition-colors"
                      >
                        Manage &rarr;
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Incident Detail Modal */}
      <IncidentModal
        incident={selectedIncident}
        isOpen={!!selectedIncident}
        onClose={() => setSelectedIncident(null)}
        onRefresh={() => {
          fetchIncidents();
          triggerRefresh();
        }}
      />
    </div>
  );
};
