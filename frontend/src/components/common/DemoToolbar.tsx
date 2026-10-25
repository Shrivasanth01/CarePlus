import React, { useState } from 'react';
import { Play, RotateCcw, AlertTriangle, Zap, Activity, CheckCircle, ShieldAlert, ChevronDown, ChevronUp } from 'lucide-react';
import { api } from '../../services/api';
import { useMonitoring } from '../../context/MonitoringContext';

export const DemoToolbar: React.FC = () => {
  const { triggerRefresh } = useMonitoring();
  const [loading, setLoading] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [isExpanded, setIsExpanded] = useState<boolean>(true);

  const handleTriggerScenario = async (scenario: string, label: string) => {
    try {
      setLoading(label);
      const res = await api.triggerDemoScenario(scenario);
      setMessage(`Triggered: ${label} (${res.service_name || 'Service'})`);
      triggerRefresh();
      setTimeout(() => setMessage(null), 4000);
    } catch (e: any) {
      setMessage(`Error: ${e.message}`);
    } finally {
      setLoading(null);
    }
  };

  const handleReset = async () => {
    try {
      setLoading('Reset');
      await api.resetDemo();
      setMessage('Demo reset: All services restored to Operational baseline');
      triggerRefresh();
      setTimeout(() => setMessage(null), 4000);
    } catch (e: any) {
      setMessage(`Error: ${e.message}`);
    } finally {
      setLoading(null);
    }
  };

  return (
    <div className="bg-gradient-to-r from-emerald-800 via-[#166534] to-emerald-950 text-white shadow-md border-b border-emerald-700/50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <span className="flex h-2.5 w-2.5 relative">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
              <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-400" />
            </span>
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold uppercase tracking-wider bg-emerald-700/60 text-emerald-200 px-2 py-0.5 rounded border border-emerald-600/40">
                Interactive Demo Controls
              </span>
              <span className="text-xs text-emerald-100 hidden md:inline">
                Simulate production incidents, latency spikes, or swift recovery live
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {message && (
              <span className="text-xs bg-black/30 text-emerald-200 px-2.5 py-1 rounded-md animate-fade-in font-medium">
                {message}
              </span>
            )}
            <button
              onClick={() => setIsExpanded(!isExpanded)}
              className="p-1 rounded text-emerald-200 hover:text-white hover:bg-emerald-700/50 transition-colors text-xs flex items-center gap-1"
            >
              <span>{isExpanded ? 'Hide' : 'Quick Actions'}</span>
              {isExpanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
            </button>
          </div>
        </div>

        {isExpanded && (
          <div className="mt-2 pt-2 border-t border-emerald-700/40 flex flex-wrap items-center gap-2">
            <button
              onClick={() => handleTriggerScenario('Complete Outage', 'Outage')}
              disabled={!!loading}
              className="inline-flex items-center gap-1.5 px-3 py-1 bg-red-600 hover:bg-red-700 text-white rounded-lg text-xs font-medium transition-all shadow-xs disabled:opacity-50"
            >
              <ShieldAlert className="w-3.5 h-3.5" />
              <span>Simulate Outage</span>
            </button>

            <button
              onClick={() => handleTriggerScenario('High Latency', 'Latency Spike')}
              disabled={!!loading}
              className="inline-flex items-center gap-1.5 px-3 py-1 bg-amber-600 hover:bg-amber-700 text-white rounded-lg text-xs font-medium transition-all shadow-xs disabled:opacity-50"
            >
              <Zap className="w-3.5 h-3.5" />
              <span>Spike Latency (1400ms)</span>
            </button>

            <button
              onClick={() => handleTriggerScenario('Slow Response', 'Slow Response')}
              disabled={!!loading}
              className="inline-flex items-center gap-1.5 px-3 py-1 bg-yellow-600 hover:bg-yellow-700 text-white rounded-lg text-xs font-medium transition-all shadow-xs disabled:opacity-50"
            >
              <Activity className="w-3.5 h-3.5" />
              <span>Degrade Warning (550ms)</span>
            </button>

            <button
              onClick={() => handleTriggerScenario('Recovery', 'Auto Recovery')}
              disabled={!!loading}
              className="inline-flex items-center gap-1.5 px-3 py-1 bg-[#16A34A] hover:bg-green-700 text-white rounded-lg text-xs font-medium transition-all shadow-xs disabled:opacity-50"
            >
              <CheckCircle className="w-3.5 h-3.5" />
              <span>Trigger Swift Recovery</span>
            </button>

            <button
              onClick={handleReset}
              disabled={!!loading}
              className="inline-flex items-center gap-1.5 px-3 py-1 bg-slate-700 hover:bg-slate-800 text-slate-100 rounded-lg text-xs font-medium transition-all shadow-xs ml-auto disabled:opacity-50"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Reset Demo State</span>
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
