import React, { useEffect, useState } from 'react';
import { Layers, Plus, Server, CheckCircle, AlertOctagon, TrendingUp, ArrowRight, Trash2 } from 'lucide-react';
import { api } from '../services/api';
import { useMonitoring } from '../context/MonitoringContext';
import { ServiceGroupHealth } from '../types';
import { Modal } from '../components/common/Modal';
import { Link } from 'react-router-dom';

export const ServiceGroupsPage: React.FC = () => {
  const { refreshKey, triggerRefresh } = useMonitoring();
  const [groups, setGroups] = useState<ServiceGroupHealth[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [newGroupName, setNewGroupName] = useState('');
  const [newGroupDesc, setNewGroupDesc] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    let isMounted = true;
    api.getServiceGroups().then(res => {
      if (isMounted) {
        setGroups(res);
        setLoading(false);
      }
    });
    return () => { isMounted = false; };
  }, [refreshKey]);

  const handleCreateGroup = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newGroupName.trim()) return;
    try {
      setSaving(true);
      await api.createServiceGroup({ name: newGroupName, description: newGroupDesc });
      setIsModalOpen(false);
      setNewGroupName('');
      setNewGroupDesc('');
      triggerRefresh();
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteGroup = async (id: number) => {
    if (confirm('Delete this service group? Monitored services will remain intact.')) {
      await api.deleteServiceGroup(id);
      triggerRefresh();
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-[#1F2937] tracking-tight">Service Groups</h1>
          <p className="text-xs text-[#64748B] mt-1">
            Cluster services by business function, department, architecture tier, or infrastructure group
          </p>
        </div>
        <button
          onClick={() => setIsModalOpen(true)}
          className="px-4 py-2 bg-[#16A34A] hover:bg-[#15803D] text-white rounded-xl text-xs font-bold transition-all shadow-xs flex items-center gap-1.5 self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" />
          <span>Create Service Group</span>
        </button>
      </div>

      {/* Groups Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {groups.map(group => (
          <div
            key={group.id}
            className="bg-white p-5 rounded-2xl border border-[#E5E7EB] shadow-subtle hover:shadow-card transition-all flex flex-col justify-between"
          >
            <div>
              <div className="flex items-start justify-between gap-2">
                <div className="flex items-center gap-3">
                  <div className="p-2.5 rounded-xl bg-[#DCFCE7] text-[#166534]">
                    <Layers className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-base font-bold text-[#1F2937]">{group.name}</h3>
                    <p className="text-xs text-[#64748B] mt-0.5">{group.description || 'No description provided'}</p>
                  </div>
                </div>
                <button
                  onClick={() => handleDeleteGroup(group.id)}
                  className="p-1.5 text-slate-400 hover:text-red-600 rounded-lg transition-colors"
                  title="Delete Group"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>

              {/* Group Metrics Row */}
              <div className="grid grid-cols-4 gap-2 mt-5 p-3 rounded-xl bg-slate-50 border border-slate-100 text-center text-xs">
                <div>
                  <span className="text-[10px] uppercase font-bold text-slate-400">Services</span>
                  <p className="text-base font-bold text-slate-800">{group.total_services}</p>
                </div>
                <div>
                  <span className="text-[10px] uppercase font-bold text-slate-400">Operational</span>
                  <p className="text-base font-bold text-[#166534]">{group.operational}</p>
                </div>
                <div>
                  <span className="text-[10px] uppercase font-bold text-slate-400">Degraded / Down</span>
                  <p className="text-base font-bold text-red-600">{group.degraded + group.down}</p>
                </div>
                <div>
                  <span className="text-[10px] uppercase font-bold text-slate-400">Group Uptime</span>
                  <p className="text-base font-bold text-[#166534] font-mono">{group.uptime_percentage}%</p>
                </div>
              </div>
            </div>

            <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between">
              {group.active_incidents > 0 ? (
                <span className="text-xs text-red-600 font-bold flex items-center gap-1.5">
                  <AlertOctagon className="w-3.5 h-3.5" />
                  {group.active_incidents} Active Incident{group.active_incidents > 1 ? 's' : ''}
                </span>
              ) : (
                <span className="text-xs text-[#166534] font-semibold flex items-center gap-1.5">
                  <CheckCircle className="w-3.5 h-3.5" />
                  All Services Healthy
                </span>
              )}

              <Link
                to={`/services?group_id=${group.id}`}
                className="text-xs font-bold text-[#16A34A] hover:underline flex items-center gap-1"
              >
                <span>View Services</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>
          </div>
        ))}
      </div>

      {/* Create Group Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title="Create Service Group"
        description="Organize related services into a cohesive operational unit"
      >
        <form onSubmit={handleCreateGroup} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Group Name *
            </label>
            <input
              type="text"
              value={newGroupName}
              onChange={e => setNewGroupName(e.target.value)}
              placeholder="e.g. Telemetry & Analytics"
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#16A34A]/20 focus:border-[#16A34A]"
              required
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Description
            </label>
            <textarea
              rows={2}
              value={newGroupDesc}
              onChange={e => setNewGroupDesc(e.target.value)}
              placeholder="Describe services encompassed by this cluster..."
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#16A34A]/20 focus:border-[#16A34A]"
            />
          </div>

          <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
            <button
              type="button"
              onClick={() => setIsModalOpen(false)}
              className="px-3 py-1.5 rounded-lg border border-slate-200 text-slate-700 font-semibold text-xs"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving}
              className="px-4 py-1.5 rounded-lg bg-[#16A34A] hover:bg-[#15803D] text-white font-bold text-xs shadow-xs"
            >
              {saving ? 'Creating...' : 'Create Group'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
