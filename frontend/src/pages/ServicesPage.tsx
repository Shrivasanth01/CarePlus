import React, { useEffect, useState } from 'react';
import {
  Plus,
  Search,
  Filter,
  RefreshCw,
  MoreVertical,
  Play,
  Pause,
  Wrench,
  Trash2,
  Edit,
  ExternalLink,
  CheckCircle,
  AlertOctagon,
  ArrowUpDown
} from 'lucide-react';
import { api } from '../services/api';
import { useMonitoring } from '../context/MonitoringContext';
import { Service, ServiceStatus } from '../types';
import { StatusBadge } from '../components/common/StatusBadge';
import { ServiceModal } from '../components/services/ServiceModal';
import { Modal } from '../components/common/Modal';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export const ServicesPage: React.FC = () => {
  const { currentUser } = useAuth();
  const { refreshKey, triggerRefresh } = useMonitoring();
  const [services, setServices] = useState<Service[]>([]);
  const [loading, setLoading] = useState(true);

  // Filters
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [environmentFilter, setEnvironmentFilter] = useState<string>('all');
  const [sortField, setSortField] = useState<'name' | 'status' | 'current_response_time_ms' | 'uptime_percentage_24h'>('name');
  const [sortAsc, setSortAsc] = useState(true);

  // Modals & Actions
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingService, setEditingService] = useState<Service | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Service | null>(null);
  const [actionFeedback, setActionFeedback] = useState<string | null>(null);

  const fetchServices = async () => {
    try {
      setLoading(true);
      const data = await api.getServices();
      setServices(data);
    } catch (err: any) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchServices();
  }, [refreshKey]);

  const handleManualCheck = async (id: number) => {
    try {
      const res = await api.triggerCheck(id);
      setActionFeedback(`Manual check triggered for ${res.service_name || 'Service'}: ${res.status}`);
      triggerRefresh();
      setTimeout(() => setActionFeedback(null), 3500);
    } catch (e: any) {
      setActionFeedback(`Check failed: ${e.message}`);
    }
  };

  const handleToggleMonitoring = async (service: Service) => {
    try {
      await api.toggleEnable(service.id, !service.monitoring_enabled);
      setActionFeedback(`Monitoring ${service.monitoring_enabled ? 'paused' : 'resumed'} for ${service.name}`);
      triggerRefresh();
      setTimeout(() => setActionFeedback(null), 3000);
    } catch (e: any) {
      setActionFeedback(`Error: ${e.message}`);
    }
  };

  const handleToggleMaintenance = async (service: Service) => {
    try {
      const res = await api.toggleMaintenance(service.id);
      setActionFeedback(`${service.name}: ${res.message}`);
      triggerRefresh();
      setTimeout(() => setActionFeedback(null), 3000);
    } catch (e: any) {
      setActionFeedback(`Error: ${e.message}`);
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    try {
      await api.deleteService(deleteTarget.id);
      setActionFeedback(`Service '${deleteTarget.name}' deleted.`);
      setDeleteTarget(null);
      triggerRefresh();
      setTimeout(() => setActionFeedback(null), 3000);
    } catch (e: any) {
      setActionFeedback(`Delete failed: ${e.message}`);
    }
  };

  const handleSaveService = async (serviceData: Partial<Service>) => {
    if (editingService) {
      await api.updateService(editingService.id, serviceData);
      setActionFeedback(`Service '${editingService.name}' updated.`);
    } else {
      await api.createService(serviceData);
      setActionFeedback('New service successfully registered.');
    }
    triggerRefresh();
    setTimeout(() => setActionFeedback(null), 3000);
  };

  // Filtered and sorted services
  const filteredServices = services.filter(s => {
    const matchSearch = !search || s.name.toLowerCase().includes(search.toLowerCase()) || s.url.toLowerCase().includes(search.toLowerCase());
    const matchStatus = statusFilter === 'all' || s.status.toLowerCase() === statusFilter.toLowerCase();
    const matchCat = categoryFilter === 'all' || s.category === categoryFilter;
    const matchEnv = environmentFilter === 'all' || s.environment === environmentFilter;
    return matchSearch && matchStatus && matchCat && matchEnv;
  }).sort((a, b) => {
    let aVal = a[sortField];
    let bVal = b[sortField];
    if (aVal === undefined) aVal = '';
    if (bVal === undefined) bVal = '';
    if (aVal < bVal) return sortAsc ? -1 : 1;
    if (aVal > bVal) return sortAsc ? 1 : -1;
    return 0;
  });

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-[#1F2937] tracking-tight">
            {currentUser.role === 'Patient' || currentUser.role === 'Viewer'
              ? 'Digital Health Services'
              : currentUser.role === 'Staff' || currentUser.role === 'Operator'
              ? 'Hospital Systems & Clinical Probes'
              : 'Monitored Services Fleet'}
          </h1>
          <p className="text-xs text-[#64748B] mt-1">
            {currentUser.role === 'Patient' || currentUser.role === 'Viewer'
              ? 'Live operational availability of CarePlus telehealth, patient portal, and pharmacy services'
              : currentUser.role === 'Staff' || currentUser.role === 'Operator'
              ? 'Real-time telemetry and availability for EHR, radiology PACS, and bedside equipment'
              : 'Real-time status, endpoint configurations, probe health, and lifecycle controls'}
          </p>
        </div>
        {currentUser.role === 'Administrator' && (
          <button
            onClick={() => {
              setEditingService(null);
              setIsModalOpen(true);
            }}
            className="px-4 py-2 bg-[#16A34A] hover:bg-[#15803D] text-white rounded-xl text-xs font-bold transition-all shadow-xs flex items-center gap-1.5 self-start sm:self-auto"
          >
            <Plus className="w-4 h-4" />
            <span>Register New Service</span>
          </button>
        )}
      </div>

      {actionFeedback && (
        <div className="p-3 bg-emerald-50 border border-emerald-200 text-[#166534] rounded-xl text-xs font-medium animate-fade-in flex items-center justify-between">
          <span>{actionFeedback}</span>
          <button onClick={() => setActionFeedback(null)} className="text-xs text-emerald-700 font-bold ml-2">
            &times;
          </button>
        </div>
      )}

      {/* Filter and Search Bar */}
      <div className="bg-white p-4 rounded-2xl border border-[#E5E7EB] shadow-subtle space-y-3">
        <div className="flex flex-col md:flex-row items-center gap-3">
          <div className="relative flex-1 w-full">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Filter by name, URL, or endpoint..."
              className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-[#1F2937] focus:outline-none focus:ring-2 focus:ring-[#16A34A]/20 focus:border-[#16A34A]"
            />
          </div>

          <div className="flex flex-wrap items-center gap-2 w-full md:w-auto">
            {/* Category Filter */}
            <select
              value={categoryFilter}
              onChange={e => setCategoryFilter(e.target.value)}
              className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-700 focus:outline-none"
            >
              <option value="all">All Categories</option>
              <option value="Website">Website</option>
              <option value="REST API">REST API</option>
              <option value="Backend Service">Backend Service</option>
              <option value="Database Service">Database Service</option>
              <option value="Authentication Service">Authentication Service</option>
              <option value="Payment Service">Payment Service</option>
              <option value="Internal Service">Internal Service</option>
              <option value="Custom Service">Custom Service</option>
            </select>

            {/* Environment Filter */}
            <select
              value={environmentFilter}
              onChange={e => setEnvironmentFilter(e.target.value)}
              className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-700 focus:outline-none"
            >
              <option value="all">All Environments</option>
              <option value="Production">Production</option>
              <option value="Staging">Staging</option>
              <option value="Development">Development</option>
            </select>
          </div>
        </div>

        {/* Status Filter Tabs */}
        <div className="flex flex-wrap items-center gap-1.5 pt-2 border-t border-slate-100 text-xs font-semibold">
          <span className="text-slate-400 mr-2 text-[11px] uppercase tracking-wider">Status:</span>
          {[
            { id: 'all', label: 'All Services', count: services.length },
            { id: 'operational', label: 'Operational', count: services.filter(s => s.status === 'Operational').length },
            { id: 'degraded', label: 'Degraded', count: services.filter(s => s.status === 'Degraded').length },
            { id: 'down', label: 'Down', count: services.filter(s => s.status === 'Down').length },
            { id: 'maintenance', label: 'Maintenance', count: services.filter(s => s.status === 'Maintenance').length }
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setStatusFilter(tab.id)}
              className={`px-3 py-1 rounded-lg transition-all flex items-center gap-1.5 ${
                statusFilter === tab.id
                  ? 'bg-[#DCFCE7] text-[#166534] border border-[#BBF7D0]'
                  : 'text-slate-600 hover:bg-slate-100'
              }`}
            >
              <span>{tab.label}</span>
              <span className={`text-[10px] px-1.5 py-0.2 rounded-full ${
                statusFilter === tab.id ? 'bg-[#16A34A] text-white' : 'bg-slate-200 text-slate-700'
              }`}>
                {tab.count}
              </span>
            </button>
          ))}
        </div>
      </div>

      {/* Services Data Table */}
      <div className="bg-white rounded-2xl border border-[#E5E7EB] shadow-subtle overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 border-b border-slate-200 text-[11px] font-bold uppercase tracking-wider text-[#64748B]">
              <tr>
                <th
                  className="py-3 px-4 cursor-pointer hover:text-slate-900"
                  onClick={() => { setSortField('name'); setSortAsc(!sortAsc); }}
                >
                  <div className="flex items-center gap-1">
                    <span>Service Name & URL</span>
                    <ArrowUpDown className="w-3 h-3" />
                  </div>
                </th>
                <th className="py-3 px-4">Category</th>
                <th className="py-3 px-4">Env</th>
                <th
                  className="py-3 px-4 cursor-pointer hover:text-slate-900"
                  onClick={() => { setSortField('status'); setSortAsc(!sortAsc); }}
                >
                  <div className="flex items-center gap-1">
                    <span>Status</span>
                    <ArrowUpDown className="w-3 h-3" />
                  </div>
                </th>
                <th
                  className="py-3 px-4 cursor-pointer hover:text-slate-900"
                  onClick={() => { setSortField('current_response_time_ms'); setSortAsc(!sortAsc); }}
                >
                  <div className="flex items-center gap-1">
                    <span>Latency</span>
                    <ArrowUpDown className="w-3 h-3" />
                  </div>
                </th>
                <th
                  className="py-3 px-4 cursor-pointer hover:text-slate-900"
                  onClick={() => { setSortField('uptime_percentage_24h'); setSortAsc(!sortAsc); }}
                >
                  <div className="flex items-center gap-1">
                    <span>24h Uptime</span>
                    <ArrowUpDown className="w-3 h-3" />
                  </div>
                </th>
                <th className="py-3 px-4">Last Checked</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredServices.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-slate-400">
                    No services found matching filters
                  </td>
                </tr>
              ) : (
                filteredServices.map(service => (
                  <tr key={service.id} className="hover:bg-slate-50/70 transition-colors">
                    <td className="py-3.5 px-4">
                      <div className="flex flex-col">
                        <Link
                          to={`/services/${service.id}`}
                          className="font-bold text-slate-900 hover:text-[#16A34A] transition-colors flex items-center gap-1.5"
                        >
                          <span>{service.name}</span>
                          <ExternalLink className="w-3 h-3 opacity-0 group-hover:opacity-100" />
                        </Link>
                        <span className="font-mono text-[11px] text-slate-400 truncate max-w-xs">
                          {service.url}
                        </span>
                      </div>
                    </td>
                    <td className="py-3.5 px-4 text-slate-700">
                      <span className="bg-slate-100 text-slate-700 px-2 py-0.5 rounded text-[11px] font-medium">
                        {service.category}
                      </span>
                    </td>
                    <td className="py-3.5 px-4">
                      <span className={`px-2 py-0.5 rounded text-[11px] font-semibold ${
                        service.environment === 'Production'
                          ? 'bg-blue-50 text-blue-700'
                          : service.environment === 'Staging'
                          ? 'bg-purple-50 text-purple-700'
                          : 'bg-slate-100 text-slate-600'
                      }`}>
                        {service.environment}
                      </span>
                    </td>
                    <td className="py-3.5 px-4">
                      <StatusBadge status={service.status} size="sm" />
                    </td>
                    <td className="py-3.5 px-4 font-mono font-bold">
                      {service.current_response_time_ms ? (
                        <span className={
                          service.current_response_time_ms > service.critical_threshold_ms
                            ? 'text-red-600'
                            : service.current_response_time_ms > service.warning_threshold_ms
                            ? 'text-amber-600'
                            : 'text-[#166534]'
                        }>
                          {service.current_response_time_ms} ms
                        </span>
                      ) : (
                        <span className="text-slate-400">—</span>
                      )}
                    </td>
                    <td className="py-3.5 px-4 font-mono font-semibold">
                      <span className={service.uptime_percentage_24h && service.uptime_percentage_24h >= 99.0 ? 'text-[#166534]' : 'text-amber-700'}>
                        {service.uptime_percentage_24h ? `${service.uptime_percentage_24h}%` : '100%'}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-slate-500 text-[11px]">
                      {service.last_checked_at ? new Date(service.last_checked_at).toLocaleTimeString() : 'Pending'}
                    </td>
                    <td className="py-3.5 px-4 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        {/* Manual Check */}
                        <button
                          onClick={() => handleManualCheck(service.id)}
                          title="Trigger health check probe now"
                          className="p-1.5 text-slate-500 hover:text-[#16A34A] hover:bg-green-50 rounded-lg transition-colors"
                        >
                          <RefreshCw className="w-3.5 h-3.5" />
                        </button>

                        {/* Toggle Monitoring */}
                        <button
                          onClick={() => handleToggleMonitoring(service)}
                          title={service.monitoring_enabled ? 'Pause monitoring' : 'Resume monitoring'}
                          className={`p-1.5 rounded-lg transition-colors ${
                            service.monitoring_enabled
                              ? 'text-slate-500 hover:text-amber-600 hover:bg-amber-50'
                              : 'text-amber-600 hover:bg-amber-100'
                          }`}
                        >
                          {service.monitoring_enabled ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5" />}
                        </button>

                        {/* Maintenance Toggle */}
                        <button
                          onClick={() => handleToggleMaintenance(service)}
                          title="Toggle maintenance window"
                          className={`p-1.5 rounded-lg transition-colors ${
                            service.status === 'Maintenance'
                              ? 'text-indigo-600 bg-indigo-50'
                              : 'text-slate-500 hover:text-indigo-600 hover:bg-indigo-50'
                          }`}
                        >
                          <Wrench className="w-3.5 h-3.5" />
                        </button>

                        {/* Edit */}
                        <button
                          onClick={() => {
                            setEditingService(service);
                            setIsModalOpen(true);
                          }}
                          title="Edit service settings"
                          className="p-1.5 text-slate-500 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                        >
                          <Edit className="w-3.5 h-3.5" />
                        </button>

                        {/* Delete */}
                        <button
                          onClick={() => setDeleteTarget(service)}
                          title="Delete service"
                          className="p-1.5 text-slate-500 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add / Edit Service Modal */}
      <ServiceModal
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          setEditingService(null);
        }}
        onSave={handleSaveService}
        initialData={editingService}
      />

      {/* Delete Confirmation Modal */}
      {deleteTarget && (
        <Modal
          isOpen={!!deleteTarget}
          onClose={() => setDeleteTarget(null)}
          title="Confirm Service Deletion"
          description={`Are you sure you want to permanently remove '${deleteTarget.name}'?`}
          maxWidth="sm"
        >
          <div className="space-y-4 text-xs">
            <p className="text-slate-600">
              This will erase all historical health check logs, incident event records, and uptime telemetry for this service.
            </p>
            <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
              <button
                onClick={() => setDeleteTarget(null)}
                className="px-3 py-1.5 rounded-lg border border-slate-200 text-slate-700 hover:bg-slate-50 font-semibold"
              >
                Cancel
              </button>
              <button
                onClick={handleDelete}
                className="px-4 py-1.5 rounded-lg bg-red-600 hover:bg-red-700 text-white font-bold transition-colors"
              >
                Delete Service
              </button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
};
