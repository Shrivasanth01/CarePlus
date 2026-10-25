import React, { useEffect, useState } from 'react';
import { Calendar, Plus, Clock, Wrench, Shield, Trash2, CheckCircle, Info } from 'lucide-react';
import { api } from '../services/api';
import { useMonitoring } from '../context/MonitoringContext';
import { MaintenanceWindow, Service } from '../types';
import { Modal } from '../components/common/Modal';

export const MaintenancePage: React.FC = () => {
  const { refreshKey, triggerRefresh } = useMonitoring();
  const [windows, setWindows] = useState<MaintenanceWindow[]>([]);
  const [services, setServices] = useState<Service[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Form
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [serviceId, setServiceId] = useState<string>('all');
  const [startTime, setStartTime] = useState('');
  const [endTime, setEndTime] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;
    Promise.all([
      api.getMaintenanceWindows(),
      api.getServices()
    ]).then(([mw, svcs]) => {
      if (isMounted) {
        setWindows(mw);
        setServices(svcs);
      }
    });
    return () => { isMounted = false; };
  }, [refreshKey]);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !startTime || !endTime) {
      setError('Title, start time, and end time are required');
      return;
    }
    try {
      setSaving(true);
      setError(null);
      await api.createMaintenanceWindow({
        title,
        description,
        service_id: serviceId === 'all' ? undefined : parseInt(serviceId),
        start_time: new Date(startTime).toISOString(),
        end_time: new Date(endTime).toISOString()
      });
      setIsModalOpen(false);
      setTitle('');
      setDescription('');
      triggerRefresh();
    } catch (e: any) {
      setError(e.message || 'Failed to schedule maintenance');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: number) => {
    if (confirm('Cancel this maintenance window? Normal alerting rules will immediately resume.')) {
      await api.deleteMaintenanceWindow(id);
      triggerRefresh();
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-[#1F2937] tracking-tight">Maintenance Windows</h1>
          <p className="text-xs text-[#64748B] mt-1">
            Planned maintenance schedules with automated outage incident suppression and SLA uptime protection
          </p>
        </div>
        <button
          onClick={() => setIsModalOpen(true)}
          className="px-4 py-2 bg-[#16A34A] hover:bg-[#15803D] text-white rounded-xl text-xs font-bold transition-all shadow-xs flex items-center gap-1.5 self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" />
          <span>Schedule Maintenance Window</span>
        </button>
      </div>

      {/* SLA Policy Callout */}
      <div className="p-4 rounded-2xl bg-indigo-50/70 border border-indigo-100 flex items-start gap-3 text-xs text-indigo-900">
        <Info className="w-5 h-5 text-indigo-600 shrink-0 mt-0.5" />
        <div>
          <span className="font-bold">Automated Maintenance Protocol (Section 17):</span>
          <p className="mt-0.5 text-indigo-800 leading-relaxed">
            During active maintenance windows, services display the purple <em>Maintenance</em> status badge. Ordinary outage incident alerts are suppressed to avoid false alarms while continuous health check recording is preserved. Eligible maintenance durations are automatically excluded from SLA downtime computations.
          </p>
        </div>
      </div>

      {/* Windows Table */}
      <div className="bg-white rounded-2xl border border-[#E5E7EB] shadow-subtle overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 border-b border-slate-200 text-[11px] font-bold uppercase tracking-wider text-[#64748B]">
              <tr>
                <th className="py-3 px-4">Maintenance Title</th>
                <th className="py-3 px-4">Scope / Service</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4">Start Time</th>
                <th className="py-3 px-4">End Time</th>
                <th className="py-3 px-4">Reason & Description</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {windows.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-slate-400">
                    No scheduled maintenance windows
                  </td>
                </tr>
              ) : (
                windows.map(mw => (
                  <tr key={mw.id} className="hover:bg-slate-50 transition-colors">
                    <td className="py-3.5 px-4 font-bold text-slate-900">
                      {mw.title}
                    </td>
                    <td className="py-3.5 px-4">
                      <span className="px-2 py-0.5 rounded text-[11px] font-semibold bg-slate-100 text-slate-800">
                        {mw.service_name || 'All Services'}
                      </span>
                    </td>
                    <td className="py-3.5 px-4">
                      <span className={`px-2 py-0.5 rounded text-[11px] font-bold ${
                        mw.status === 'In Progress'
                          ? 'bg-indigo-100 text-indigo-800 animate-pulse'
                          : mw.status === 'Scheduled'
                          ? 'bg-blue-100 text-blue-800'
                          : 'bg-slate-100 text-slate-600'
                      }`}>
                        {mw.status}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-slate-600 font-mono">
                      {new Date(mw.start_time).toLocaleString()}
                    </td>
                    <td className="py-3.5 px-4 text-slate-600 font-mono">
                      {new Date(mw.end_time).toLocaleString()}
                    </td>
                    <td className="py-3.5 px-4 text-slate-600 max-w-xs truncate">
                      {mw.description || 'Routine maintenance'}
                    </td>
                    <td className="py-3.5 px-4 text-right">
                      <button
                        onClick={() => handleDelete(mw.id)}
                        className="p-1.5 text-slate-400 hover:text-red-600 rounded-lg transition-colors"
                        title="Cancel / Delete Window"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Schedule Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title="Schedule Maintenance Window"
        description="Exclude planned upgrades from SLA downtime and suppress alerting"
      >
        <form onSubmit={handleCreate} className="space-y-4 text-xs">
          {error && (
            <div className="p-3 rounded-xl bg-red-50 border border-red-200 text-red-700">
              {error}
            </div>
          )}

          <div>
            <label className="block font-semibold text-slate-700 mb-1">
              Maintenance Title *
            </label>
            <input
              type="text"
              value={title}
              onChange={e => setTitle(e.target.value)}
              placeholder="e.g. Database Index Rebuild & Version Upgrade"
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 focus:outline-none focus:border-[#16A34A]"
              required
            />
          </div>

          <div>
            <label className="block font-semibold text-slate-700 mb-1">
              Target Service
            </label>
            <select
              value={serviceId}
              onChange={e => setServiceId(e.target.value)}
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 focus:outline-none focus:border-[#16A34A]"
            >
              <option value="all">Entire Fleet (All Services)</option>
              {services.map(s => (
                <option key={s.id} value={s.id.toString()}>{s.name} ({s.environment})</option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block font-semibold text-slate-700 mb-1">
                Start Datetime *
              </label>
              <input
                type="datetime-local"
                value={startTime}
                onChange={e => setStartTime(e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 focus:outline-none focus:border-[#16A34A]"
                required
              />
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">
                End Datetime *
              </label>
              <input
                type="datetime-local"
                value={endTime}
                onChange={e => setEndTime(e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 focus:outline-none focus:border-[#16A34A]"
                required
              />
            </div>
          </div>

          <div>
            <label className="block font-semibold text-slate-700 mb-1">
              Maintenance Reason & Description
            </label>
            <textarea
              rows={2}
              value={description}
              onChange={e => setDescription(e.target.value)}
              placeholder="Describe planned interventions and failover precautions..."
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 focus:outline-none focus:border-[#16A34A]"
            />
          </div>

          <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
            <button
              type="button"
              onClick={() => setIsModalOpen(false)}
              className="px-3 py-1.5 rounded-lg border border-slate-200 text-slate-700 font-semibold"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving}
              className="px-4 py-1.5 rounded-lg bg-[#16A34A] hover:bg-[#15803D] text-white font-bold shadow-xs"
            >
              {saving ? 'Scheduling...' : 'Confirm Maintenance'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
