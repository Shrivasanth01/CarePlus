import React, { useState, useEffect } from 'react';
import { Modal } from '../common/Modal';
import { Service } from '../../types';

interface ServiceModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (data: Partial<Service>) => Promise<void>;
  initialData?: Service | null;
}

export const ServiceModal: React.FC<ServiceModalProps> = ({
  isOpen,
  onClose,
  onSave,
  initialData
}) => {
  const [formData, setFormData] = useState<Partial<Service>>({
    name: '',
    url: '',
    description: '',
    category: 'REST API',
    environment: 'Production',
    monitoring_type: 'HTTP',
    monitoring_interval: 15,
    timeout_seconds: 5,
    expected_status_code: 200,
    warning_threshold_ms: 300,
    critical_threshold_ms: 800,
    failure_threshold: 3,
    recovery_threshold: 2,
    monitoring_enabled: true
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (initialData) {
      setFormData(initialData);
    } else {
      setFormData({
        name: '',
        url: '',
        description: '',
        category: 'REST API',
        environment: 'Production',
        monitoring_type: 'HTTP',
        monitoring_interval: 15,
        timeout_seconds: 5,
        expected_status_code: 200,
        warning_threshold_ms: 300,
        critical_threshold_ms: 800,
        failure_threshold: 3,
        recovery_threshold: 2,
        monitoring_enabled: true
      });
    }
    setError(null);
  }, [initialData, isOpen]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name?.trim()) {
      setError('Service name is required');
      return;
    }
    if (!formData.url?.trim()) {
      setError('Service URL is required');
      return;
    }

    try {
      setLoading(true);
      setError(null);
      await onSave(formData);
      onClose();
    } catch (err: any) {
      setError(err.message || 'Failed to save service');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={initialData ? 'Edit Monitored Service' : 'Register New Monitored Service'}
      description="Configure endpoint parameters, latency thresholds, and probe intervals"
      maxWidth="xl"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        {error && (
          <div className="p-3 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs">
            {error}
          </div>
        )}

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="sm:col-span-2">
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Service Name *
            </label>
            <input
              type="text"
              value={formData.name || ''}
              onChange={e => setFormData({ ...formData, name: e.target.value })}
              placeholder="e.g. Patient Record API"
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#16A34A]/20 focus:border-[#16A34A]"
              required
            />
          </div>

          <div className="sm:col-span-2">
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Endpoint URL or Simulation Identifier *
            </label>
            <input
              type="text"
              value={formData.url || ''}
              onChange={e => setFormData({ ...formData, url: e.target.value })}
              placeholder="https://api.careplus.io/health or sim://my-service/health"
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#16A34A]/20 focus:border-[#16A34A]"
              required
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Category
            </label>
            <select
              value={formData.category || 'REST API'}
              onChange={e => setFormData({ ...formData, category: e.target.value })}
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#16A34A]/20 focus:border-[#16A34A]"
            >
              <option value="Website">Website</option>
              <option value="REST API">REST API</option>
              <option value="Backend Service">Backend Service</option>
              <option value="Database Service">Database Service</option>
              <option value="Authentication Service">Authentication Service</option>
              <option value="Payment Service">Payment Service</option>
              <option value="Internal Service">Internal Service</option>
              <option value="Custom Service">Custom Service</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Environment
            </label>
            <select
              value={formData.environment || 'Production'}
              onChange={e => setFormData({ ...formData, environment: e.target.value })}
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#16A34A]/20 focus:border-[#16A34A]"
            >
              <option value="Production">Production</option>
              <option value="Staging">Staging</option>
              <option value="Development">Development</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Monitoring Type
            </label>
            <select
              value={formData.monitoring_type || 'HTTP'}
              onChange={e => setFormData({ ...formData, monitoring_type: e.target.value })}
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#16A34A]/20 focus:border-[#16A34A]"
            >
              <option value="HTTP">HTTP Endpoint</option>
              <option value="HTTPS">HTTPS Endpoint</option>
              <option value="Simulated">Simulated Monitoring</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Probe Interval (seconds)
            </label>
            <input
              type="number"
              min="5"
              max="3600"
              value={formData.monitoring_interval || 15}
              onChange={e => setFormData({ ...formData, monitoring_interval: parseInt(e.target.value) || 15 })}
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#16A34A]/20 focus:border-[#16A34A]"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Warning Latency Threshold (ms)
            </label>
            <input
              type="number"
              min="50"
              value={formData.warning_threshold_ms || 300}
              onChange={e => setFormData({ ...formData, warning_threshold_ms: parseInt(e.target.value) || 300 })}
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#16A34A]/20 focus:border-[#16A34A]"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Critical Latency Threshold (ms)
            </label>
            <input
              type="number"
              min="100"
              value={formData.critical_threshold_ms || 800}
              onChange={e => setFormData({ ...formData, critical_threshold_ms: parseInt(e.target.value) || 800 })}
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#16A34A]/20 focus:border-[#16A34A]"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Failure Threshold (consecutive checks)
            </label>
            <input
              type="number"
              min="1"
              max="10"
              value={formData.failure_threshold || 3}
              onChange={e => setFormData({ ...formData, failure_threshold: parseInt(e.target.value) || 3 })}
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#16A34A]/20 focus:border-[#16A34A]"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Recovery Threshold (consecutive checks)
            </label>
            <input
              type="number"
              min="1"
              max="10"
              value={formData.recovery_threshold || 2}
              onChange={e => setFormData({ ...formData, recovery_threshold: parseInt(e.target.value) || 2 })}
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#16A34A]/20 focus:border-[#16A34A]"
            />
          </div>

          <div className="sm:col-span-2">
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Service Description
            </label>
            <textarea
              rows={2}
              value={formData.description || ''}
              onChange={e => setFormData({ ...formData, description: e.target.value })}
              placeholder="Brief description of role, dependencies, or owner..."
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#16A34A]/20 focus:border-[#16A34A]"
            />
          </div>
        </div>

        <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 border border-slate-200 text-slate-700 rounded-xl text-xs font-semibold hover:bg-slate-50 transition-colors"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={loading}
            className="px-5 py-2 bg-[#16A34A] hover:bg-[#15803D] text-white rounded-xl text-xs font-semibold transition-colors shadow-xs disabled:opacity-50"
          >
            {loading ? 'Saving...' : initialData ? 'Save Changes' : 'Register Service'}
          </button>
        </div>
      </form>
    </Modal>
  );
};
