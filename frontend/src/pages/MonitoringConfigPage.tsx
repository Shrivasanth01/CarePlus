import React, { useEffect, useState } from 'react';
import { Sliders, Save, Play, Square, Shield, CheckCircle2, AlertTriangle, Radio } from 'lucide-react';
import { api } from '../services/api';
import { useMonitoring } from '../context/MonitoringContext';
import { MonitoringSettings } from '../types';

export const MonitoringConfigPage: React.FC = () => {
  const { refreshKey, triggerRefresh } = useMonitoring();
  const [settings, setSettings] = useState<MonitoringSettings | null>(null);
  const [status, setStatus] = useState<any>(null);
  const [saving, setSaving] = useState(false);
  const [feedback, setFeedback] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;
    Promise.all([
      api.getMonitoringSettings(),
      api.getMonitoringStatus()
    ]).then(([s, st]) => {
      if (isMounted) {
        setSettings(s);
        setStatus(st);
      }
    });
    return () => { isMounted = false; };
  }, [refreshKey]);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!settings) return;
    try {
      setSaving(true);
      await api.updateMonitoringSettings(settings);
      setFeedback('Global monitoring configuration saved successfully.');
      triggerRefresh();
      setTimeout(() => setFeedback(null), 4000);
    } finally {
      setSaving(false);
    }
  };

  const handleToggleScheduler = async (start: boolean) => {
    if (start) {
      await api.startMonitoringScheduler();
    } else {
      await api.stopMonitoringScheduler();
    }
    triggerRefresh();
  };

  if (!settings) {
    return (
      <div className="py-20 flex justify-center">
        <div className="w-8 h-8 border-4 border-[#16A34A] border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-[#1F2937] tracking-tight">Monitoring Configuration</h1>
          <p className="text-xs text-[#64748B] mt-1">
            Global probe intervals, SSRF network filters, failure triggers, and scheduler lifecycle
          </p>
        </div>

        {/* Scheduler Control Toggle */}
        <div className="flex items-center gap-3 bg-white p-2 rounded-xl border border-slate-200 shadow-2xs self-start sm:self-auto">
          <div className="flex items-center gap-2 text-xs font-semibold px-2">
            <span className={`w-2.5 h-2.5 rounded-full ${status?.scheduler_running ? 'bg-[#16A34A] animate-pulse' : 'bg-red-500'}`} />
            <span>Scheduler: {status?.scheduler_running ? 'Active & Running' : 'Stopped'}</span>
          </div>
          {status?.scheduler_running ? (
            <button
              onClick={() => handleToggleScheduler(false)}
              className="px-3 py-1 bg-red-600 hover:bg-red-700 text-white rounded-lg text-xs font-bold transition-colors flex items-center gap-1.5 shadow-xs"
            >
              <Square className="w-3.5 h-3.5 fill-current" />
              <span>Stop Scheduler</span>
            </button>
          ) : (
            <button
              onClick={() => handleToggleScheduler(true)}
              className="px-3 py-1 bg-[#16A34A] hover:bg-[#15803D] text-white rounded-lg text-xs font-bold transition-colors flex items-center gap-1.5 shadow-xs"
            >
              <Play className="w-3.5 h-3.5 fill-current" />
              <span>Start Scheduler</span>
            </button>
          )}
        </div>
      </div>

      {feedback && (
        <div className="p-3 bg-emerald-50 border border-emerald-200 text-[#166534] rounded-xl text-xs font-medium animate-fade-in flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4" />
          <span>{feedback}</span>
        </div>
      )}

      {/* Main Settings Form */}
      <form onSubmit={handleSave} className="bg-white p-6 rounded-2xl border border-[#E5E7EB] shadow-subtle space-y-6">
        <div>
          <h3 className="text-sm font-bold text-[#1F2937] mb-1">Global Probing & Threshold Defaults</h3>
          <p className="text-xs text-[#64748B]">These parameters apply to all registered services unless explicitly overridden</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-5 text-xs">
          <div>
            <label className="block font-semibold text-slate-700 mb-1">
              Default Monitoring Interval (seconds)
            </label>
            <input
              type="number"
              min="5"
              max="3600"
              value={settings.monitoring_interval}
              onChange={e => setSettings({ ...settings, monitoring_interval: parseInt(e.target.value) || 15 })}
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 focus:outline-none focus:border-[#16A34A]"
            />
            <span className="text-[10px] text-slate-400 mt-0.5 block">Frequency at which each enabled service endpoint is probed</span>
          </div>

          <div>
            <label className="block font-semibold text-slate-700 mb-1">
              Probe Timeout Duration (seconds)
            </label>
            <input
              type="number"
              min="1"
              max="60"
              value={settings.timeout_seconds}
              onChange={e => setSettings({ ...settings, timeout_seconds: parseInt(e.target.value) || 5 })}
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 focus:outline-none focus:border-[#16A34A]"
            />
            <span className="text-[10px] text-slate-400 mt-0.5 block">Deadline before an unanswered request is classified as timed out</span>
          </div>

          <div>
            <label className="block font-semibold text-slate-700 mb-1">
              Warning Response Time Threshold (ms)
            </label>
            <input
              type="number"
              min="50"
              value={settings.warning_threshold_ms}
              onChange={e => setSettings({ ...settings, warning_threshold_ms: parseInt(e.target.value) || 300 })}
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 focus:outline-none focus:border-[#16A34A]"
            />
            <span className="text-[10px] text-slate-400 mt-0.5 block">Latencies exceeding this mark trigger Degraded status</span>
          </div>

          <div>
            <label className="block font-semibold text-slate-700 mb-1">
              Critical Response Time Threshold (ms)
            </label>
            <input
              type="number"
              min="100"
              value={settings.critical_threshold_ms}
              onChange={e => setSettings({ ...settings, critical_threshold_ms: parseInt(e.target.value) || 800 })}
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 focus:outline-none focus:border-[#16A34A]"
            />
            <span className="text-[10px] text-slate-400 mt-0.5 block">Severe tail latency mark requiring engineer investigation</span>
          </div>

          <div>
            <label className="block font-semibold text-slate-700 mb-1">
              Failure Threshold (Consecutive Failed Checks)
            </label>
            <input
              type="number"
              min="1"
              max="10"
              value={settings.failure_threshold}
              onChange={e => setSettings({ ...settings, failure_threshold: parseInt(e.target.value) || 3 })}
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 focus:outline-none focus:border-[#16A34A]"
            />
            <span className="text-[10px] text-slate-400 mt-0.5 block">Number of continuous failures before automatically creating an incident</span>
          </div>

          <div>
            <label className="block font-semibold text-slate-700 mb-1">
              Recovery Confirmation Threshold (Consecutive Successes)
            </label>
            <input
              type="number"
              min="1"
              max="10"
              value={settings.recovery_threshold}
              onChange={e => setSettings({ ...settings, recovery_threshold: parseInt(e.target.value) || 2 })}
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 focus:outline-none focus:border-[#16A34A]"
            />
            <span className="text-[10px] text-slate-400 mt-0.5 block">Number of continuous healthy checks before auto-resolving an ongoing incident</span>
          </div>
        </div>

        {/* Security & SSRF Protection Status (Section 23) */}
        <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-2">
          <div className="flex items-center gap-2 text-xs font-bold text-slate-800">
            <Shield className="w-4 h-4 text-[#16A34A]" />
            <span>Endpoint Monitoring Security & SSRF Defense (Section 23)</span>
          </div>
          <p className="text-xs text-slate-600">
            The monitoring engine strictly validates target schemes (HTTP/HTTPS only) and blocks loopback (127.0.0.1, localhost), AWS/GCP cloud metadata (169.254.169.254), and private subnets (10.0.0.0/8, 172.16.0.0/12, 192.168.0.0/16).
          </p>
          <div className="flex items-center gap-2 pt-1 text-[11px] font-semibold text-[#166534]">
            <CheckCircle2 className="w-3.5 h-3.5 text-[#16A34A]" />
            <span>SSRF Protection is Active & Enforced</span>
          </div>
        </div>

        <div className="flex justify-end pt-2">
          <button
            type="submit"
            disabled={saving}
            className="px-5 py-2.5 bg-[#16A34A] hover:bg-[#15803D] text-white rounded-xl text-xs font-bold transition-all shadow-xs flex items-center gap-1.5 disabled:opacity-50"
          >
            <Save className="w-4 h-4" />
            <span>{saving ? 'Saving Changes...' : 'Save Configuration'}</span>
          </button>
        </div>
      </form>
    </div>
  );
};
