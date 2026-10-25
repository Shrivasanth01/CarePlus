import React, { useState } from 'react';
import {
  Stethoscope,
  Activity,
  AlertTriangle,
  Radio,
  HeartPulse,
  Syringe,
  FileSpreadsheet,
  AlertOctagon,
  CheckCircle2,
  Clock,
  Plus,
  Send,
  ShieldAlert,
  Server
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useMonitoring } from '../../context/MonitoringContext';
import { api } from '../../services/api';
import { Modal } from '../common/Modal';

export const StaffDashboard: React.FC = () => {
  const { currentUser } = useAuth();
  const { triggerRefresh } = useMonitoring();

  const [clinicalSystems, setClinicalSystems] = useState([
    { name: 'Epic EHR / Clinical Workstations', category: 'EMR Records', latency: '42 ms', status: 'Operational', desc: 'Patient charting & e-prescribing' },
    { name: 'Radiology PACS DICOM Imaging', category: 'Medical Imaging', latency: '68 ms', status: 'Operational', desc: 'CT & MRI scan image retrieval' },
    { name: 'ICU Bedside Telemetry Monitors', category: 'Critical Care', latency: '18 ms', status: 'Operational', desc: 'Continuous cardiac & SpO2 vitals' },
    { name: 'Pyxis Pharmacy Automated Dispenser', category: 'Medication', latency: '95 ms', status: 'Operational', desc: 'Controlled substance dispensing' },
    { name: 'Laboratory Information System (LIS)', category: 'Diagnostics', latency: '54 ms', status: 'Operational', desc: 'Blood gas analyzer & pathology' },
    { name: 'Operating Room Surgical Telemetry', category: 'Surgical Suites', latency: '22 ms', status: 'Operational', desc: 'Anesthesia & endoscopy video feeds' },
  ]);

  const [emergencyCodes, setEmergencyCodes] = useState([
    { code: 'Code Blue (Cardiac Arrest)', status: 'Telemetry Armed', badge: 'bg-blue-100 text-blue-800 border-blue-200' },
    { code: 'Code Trauma (Level 1 Resus)', status: 'OR 1 Ready', badge: 'bg-red-100 text-red-800 border-red-200' },
    { code: 'Code Sepsis Alert Dispatch', status: 'Automated ML Active', badge: 'bg-purple-100 text-purple-800 border-purple-200' }
  ]);

  const [isReportModalOpen, setIsReportModalOpen] = useState(false);
  const [affectedSystem, setAffectedSystem] = useState('Epic EHR / Clinical Workstations');
  const [severity, setSeverity] = useState('High');
  const [description, setDescription] = useState('');
  const [workstationLocation, setWorkstationLocation] = useState('ICU Pod 4 - Station B');
  const [feedback, setFeedback] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const handleReportIssue = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setSubmitting(true);
      // Injects an incident to backend via API
      await api.triggerDemoScenario('High Latency');
      setIsReportModalOpen(false);
      setFeedback(`Clinical ticket submitted: "${affectedSystem} lag reported at ${workstationLocation}". Clinical IT paged.`);
      triggerRefresh();
      setTimeout(() => setFeedback(null), 5000);
    } catch (e: any) {
      setFeedback(`Error: ${e.message}`);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Staff Header Banner */}
      <div className="bg-gradient-to-r from-blue-900 via-indigo-900 to-slate-900 text-white p-6 rounded-3xl shadow-card flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="px-2.5 py-0.5 rounded-full bg-blue-800/80 text-blue-200 text-[10px] font-bold uppercase tracking-wider border border-blue-400/20">
              Clinical Operations Hub
            </span>
            <span className="text-xs text-blue-200">&bull; {currentUser.department || 'Emergency & Critical Care ICU'}</span>
          </div>
          <h1 className="text-2xl font-black tracking-tight flex items-center gap-2">
            <span>{currentUser.name}</span>
            <Stethoscope className="w-6 h-6 text-blue-400 inline" />
          </h1>
          <p className="text-xs text-blue-200 mt-1 max-w-xl">
            Real-time telemetry for bedside vitals, electronic health records, diagnostic PACS servers, and clinical workstation response times.
          </p>
        </div>

        <button
          onClick={() => setIsReportModalOpen(true)}
          className="px-4 py-2 bg-amber-500 hover:bg-amber-600 text-slate-900 rounded-xl text-xs font-bold transition-all shadow-xs flex items-center gap-1.5 self-start sm:self-auto"
        >
          <AlertOctagon className="w-4 h-4" />
          <span>Report Workstation Lag</span>
        </button>
      </div>

      {feedback && (
        <div className="p-3.5 bg-amber-50 border border-amber-200 text-amber-900 rounded-2xl text-xs font-semibold flex items-center gap-2 animate-fade-in">
          <AlertTriangle className="w-4 h-4 text-amber-600" />
          <span>{feedback}</span>
        </div>
      )}

      {/* Hospital Emergency Systems Readiness */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        {emergencyCodes.map((code, idx) => (
          <div key={idx} className="bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="p-2 rounded-xl bg-blue-50 text-blue-700">
                <HeartPulse className="w-4 h-4" />
              </div>
              <div>
                <h4 className="font-bold text-xs text-slate-900">{code.code}</h4>
                <p className="text-[11px] text-slate-500">{code.status}</p>
              </div>
            </div>
            <span className={`px-2 py-0.5 rounded text-[10px] font-bold border ${code.badge}`}>
              Ready
            </span>
          </div>
        ))}
      </div>

      {/* Clinical Systems Grid */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <div>
            <h3 className="text-sm font-bold text-[#1F2937]">Hospital Clinical Systems & Probes</h3>
            <p className="text-xs text-[#64748B]">Real-time roundtrip probe telemetry for clinical workflows</p>
          </div>
          <span className="text-xs font-semibold text-[#166534] bg-[#DCFCE7] px-2.5 py-1 rounded-full flex items-center gap-1.5 border border-[#BBF7D0]">
            <span className="w-2 h-2 rounded-full bg-[#16A34A] animate-pulse" />
            6/6 Clinical Systems Healthy
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
          {clinicalSystems.map((sys, idx) => (
            <div key={idx} className="bg-white p-4 rounded-2xl border border-[#E5E7EB] shadow-subtle hover:shadow-card transition-all flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 bg-slate-100 text-slate-700 rounded">
                    {sys.category}
                  </span>
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-[#DCFCE7] text-[#166534]">
                    {sys.status}
                  </span>
                </div>
                <h4 className="font-bold text-xs text-slate-900">{sys.name}</h4>
                <p className="text-[11px] text-slate-500 mt-1">{sys.desc}</p>
              </div>

              <div className="mt-4 pt-2.5 border-t border-slate-100 flex items-center justify-between text-xs">
                <span className="text-[11px] text-slate-400">Response Latency</span>
                <span className="font-mono font-bold text-[#166534]">{sys.latency}</span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Active Shift Handover Notices */}
      <div className="bg-white p-5 rounded-3xl border border-[#E5E7EB] shadow-subtle">
        <h3 className="text-sm font-bold text-[#1F2937] mb-2">Shift Handover & Infrastructure Maintenance Notices</h3>
        <div className="space-y-2 text-xs">
          <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 flex items-start gap-2.5">
            <Clock className="w-4 h-4 text-slate-500 mt-0.5 shrink-0" />
            <div>
              <span className="font-bold text-slate-800">Night Shift EHR Database Re-indexing Notice:</span>
              <p className="text-slate-600 mt-0.5">
                Scheduled read-replica index maintenance was completed at 04:00. No lingering workstation charting latency reported across ICU or Emergency.
              </p>
            </div>
          </div>

          <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 flex items-start gap-2.5">
            <Radio className="w-4 h-4 text-blue-600 mt-0.5 shrink-0" />
            <div>
              <span className="font-bold text-slate-800">Biomedical Wireless Telemetry Bridge Check:</span>
              <p className="text-slate-600 mt-0.5">
                Wireless access points on Floor 3 West tested for continuous cardiac waveform streaming with 0 packet drops.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Report Clinical Lag Modal */}
      <Modal
        isOpen={isReportModalOpen}
        onClose={() => setIsReportModalOpen(false)}
        title="Report Clinical Workstation or Telemetry Delay"
        description="Priority alert to Hospital IT & Clinical Informatics on-call engineer"
      >
        <form onSubmit={handleReportIssue} className="space-y-4 text-xs">
          <div>
            <label className="block font-semibold text-slate-700 mb-1">Affected Clinical System</label>
            <select
              value={affectedSystem}
              onChange={e => setAffectedSystem(e.target.value)}
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 focus:outline-none focus:border-[#16A34A]"
            >
              <option value="Epic EHR / Clinical Workstations">Epic EHR / Clinical Workstations</option>
              <option value="Radiology PACS DICOM Imaging">Radiology PACS DICOM Imaging</option>
              <option value="ICU Bedside Telemetry Monitors">ICU Bedside Telemetry Monitors</option>
              <option value="Pyxis Pharmacy Automated Dispenser">Pyxis Pharmacy Automated Dispenser</option>
              <option value="Laboratory Information System (LIS)">Laboratory Information System (LIS)</option>
            </select>
          </div>

          <div>
            <label className="block font-semibold text-slate-700 mb-1">Workstation Location / Pod</label>
            <input
              type="text"
              value={workstationLocation}
              onChange={e => setWorkstationLocation(e.target.value)}
              placeholder="e.g. ICU Pod 4 - Station B or ER Bay 6"
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 focus:outline-none focus:border-[#16A34A]"
              required
            />
          </div>

          <div>
            <label className="block font-semibold text-slate-700 mb-1">Severity & Patient Impact</label>
            <select
              value={severity}
              onChange={e => setSeverity(e.target.value)}
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 focus:outline-none focus:border-[#16A34A]"
            >
              <option value="High">High: Delaying Patient Charting or Medication Administration</option>
              <option value="Critical">Critical: Urgent Patient Care Impact / Bedside Monitor Offline</option>
              <option value="Medium">Medium: Noticeable Lag but workarounds functioning</option>
            </select>
          </div>

          <div>
            <label className="block font-semibold text-slate-700 mb-1">Observations / Symptoms</label>
            <textarea
              rows={2}
              value={description}
              onChange={e => setDescription(e.target.value)}
              placeholder="e.g. Wheel spinner taking >10 seconds to pull up patient MAR..."
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 focus:outline-none focus:border-[#16A34A]"
            />
          </div>

          <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
            <button
              type="button"
              onClick={() => setIsReportModalOpen(false)}
              className="px-3 py-1.5 rounded-lg border border-slate-200 text-slate-700 font-semibold"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="px-4 py-1.5 rounded-lg bg-amber-600 hover:bg-amber-700 text-white font-bold shadow-xs disabled:opacity-50"
            >
              {submitting ? 'Submitting...' : 'Dispatch Clinical Ticket'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
