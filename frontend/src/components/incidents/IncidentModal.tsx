import React, { useState } from 'react';
import { Modal } from '../common/Modal';
import { Incident } from '../../types';
import { SeverityBadge } from '../common/SeverityBadge';
import { api } from '../../services/api';
import { CheckCircle2, Clock, AlertCircle } from 'lucide-react';

interface IncidentModalProps {
  incident: Incident | null;
  isOpen: boolean;
  onClose: () => void;
  onRefresh: () => void;
}

export const IncidentModal: React.FC<IncidentModalProps> = ({
  incident,
  isOpen,
  onClose,
  onRefresh
}) => {
  const [resolutionNotes, setResolutionNotes] = useState('');
  const [statusUpdate, setStatusUpdate] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!incident) return null;

  const handleResolve = async () => {
    if (!resolutionNotes.trim()) {
      setError('Please provide resolution notes before resolving.');
      return;
    }
    try {
      setLoading(true);
      setError(null);
      await api.resolveIncident(incident.id, resolutionNotes);
      onRefresh();
      onClose();
    } catch (e: any) {
      setError(e.message || 'Failed to resolve incident');
    } finally {
      setLoading(false);
    }
  };

  const handleStatusChange = async (newStatus: string) => {
    try {
      setLoading(true);
      setError(null);
      await api.updateIncidentStatus(incident.id, newStatus, `Transitioned to ${newStatus}`);
      onRefresh();
    } catch (e: any) {
      setError(e.message || 'Failed to update status');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={`Incident: ${incident.incident_number}`}
      description={incident.service_name || 'System Service'}
      maxWidth="xl"
    >
      <div className="space-y-5 text-xs">
        {error && (
          <div className="p-3 rounded-xl bg-red-50 border border-red-200 text-red-700">
            {error}
          </div>
        )}

        {/* Header Overview Card */}
        <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-sm font-bold text-slate-900">{incident.title}</span>
            <SeverityBadge severity={incident.severity} />
          </div>
          <p className="text-slate-600">{incident.description}</p>
          <div className="flex flex-wrap items-center gap-4 text-slate-500 pt-2 border-t border-slate-200/60">
            <span>Detected: {new Date(incident.detected_at).toLocaleString()}</span>
            <span>Current Status: <strong className="text-slate-800">{incident.status}</strong></span>
            <span>Assignee: <strong className="text-slate-800">{incident.assigned_user_name || 'Unassigned'}</strong></span>
          </div>
        </div>

        {/* Status Lifecycle Actions */}
        {incident.status !== 'Resolved' && (
          <div className="space-y-3 p-4 bg-emerald-50/40 rounded-xl border border-emerald-100">
            <h4 className="font-bold text-slate-800 text-xs">Update Incident Lifecycle Status</h4>
            <div className="flex flex-wrap gap-2">
              {['Investigating', 'Identified', 'Monitoring Recovery'].map(st => (
                <button
                  key={st}
                  onClick={() => handleStatusChange(st)}
                  disabled={loading || incident.status === st}
                  className={`px-3 py-1.5 rounded-lg font-medium transition-colors ${
                    incident.status === st
                      ? 'bg-[#16A34A] text-white font-bold'
                      : 'bg-white border border-slate-200 text-slate-700 hover:bg-slate-100'
                  }`}
                >
                  {st}
                </button>
              ))}
            </div>

            {/* Resolve Box */}
            <div className="pt-2">
              <label className="block font-semibold text-slate-700 mb-1">
                Resolution Notes (Required to close)
              </label>
              <textarea
                rows={2}
                value={resolutionNotes}
                onChange={e => setResolutionNotes(e.target.value)}
                placeholder="Describe root cause fix or remediation steps..."
                className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#16A34A]/20 focus:border-[#16A34A]"
              />
              <div className="mt-2 flex justify-end">
                <button
                  onClick={handleResolve}
                  disabled={loading}
                  className="px-4 py-2 bg-[#16A34A] hover:bg-[#15803D] text-white rounded-xl font-bold flex items-center gap-1.5 transition-colors disabled:opacity-50"
                >
                  <CheckCircle2 className="w-4 h-4" />
                  <span>Mark Incident Resolved</span>
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Resolved Banner */}
        {incident.status === 'Resolved' && (
          <div className="p-4 bg-[#DCFCE7] rounded-xl border border-[#BBF7D0] text-[#166534]">
            <p className="font-bold flex items-center gap-1.5">
              <CheckCircle2 className="w-4 h-4" />
              Resolved on {incident.resolved_at ? new Date(incident.resolved_at).toLocaleString() : 'N/A'}
            </p>
            {incident.resolution_notes && (
              <p className="mt-1 text-slate-700 bg-white/70 p-2 rounded-lg border border-[#BBF7D0]">
                {incident.resolution_notes}
              </p>
            )}
            {incident.duration_seconds && (
              <p className="mt-1 text-[11px] text-slate-500">
                Total Outage Duration: {Math.round(incident.duration_seconds / 60)} minutes
              </p>
            )}
          </div>
        )}

        {/* Timeline of events */}
        <div className="space-y-2">
          <h4 className="font-bold text-slate-800 text-xs">Incident Event Timeline</h4>
          <div className="space-y-2 border-l-2 border-slate-200 pl-3 ml-1">
            {incident.events?.map(ev => (
              <div key={ev.id} className="relative">
                <div className="flex items-center justify-between text-slate-700">
                  <span className="font-bold">{ev.event_type}</span>
                  <span className="text-[10px] text-slate-400">
                    {new Date(ev.created_at).toLocaleTimeString()}
                  </span>
                </div>
                <p className="text-slate-600 mt-0.5">{ev.message}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </Modal>
  );
};
