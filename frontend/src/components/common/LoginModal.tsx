import React, { useState } from 'react';
import { Modal } from './Modal';
import { useAuth } from '../../context/AuthContext';
import { ShieldCheck, Stethoscope, HeartHandshake, KeyRound, ArrowRight, CheckCircle2 } from 'lucide-react';

export const LoginModal: React.FC = () => {
  const { isLoginModalOpen, setIsLoginModalOpen, loginWithRole, currentUser } = useAuth();
  const [selectedRole, setSelectedRole] = useState<'Administrator' | 'Staff' | 'Patient'>('Patient');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);

  if (!isLoginModalOpen) return null;

  const handleCustomLogin = (e: React.FormEvent) => {
    e.preventDefault();
    loginWithRole(selectedRole);
  };

  const roles = [
    {
      id: 'Patient' as const,
      title: 'Patient Portal',
      badge: 'Healthcare Consumer',
      icon: HeartHandshake,
      bg: 'bg-emerald-50 text-emerald-700 border-emerald-200',
      activeBg: 'bg-emerald-600 text-white',
      demoUser: 'Eleanor Rigby (PT-88219)',
      features: [
        'Check upcoming doctor consultations & appointments',
        'Book new specialist appointments in real time',
        'Live health services uptime (Telehealth, Prescriptions, Bill Pay)',
        'Submit patient support tickets'
      ]
    },
    {
      id: 'Staff' as const,
      title: 'Clinical & Medical Staff',
      badge: 'Doctors, Nurses & Technicians',
      icon: Stethoscope,
      bg: 'bg-blue-50 text-blue-700 border-blue-200',
      activeBg: 'bg-blue-600 text-white',
      demoUser: 'Nurse Sarah Jenkins, RN (Critical Care)',
      features: [
        'Real-time Clinical Operations Hub',
        'Monitor EHR (Epic/Cerner), Radiology PACS, & ICU Telemetry',
        'Emergency Code readiness status (Code Blue / Code Red)',
        'Report immediate clinical workstation & telemetry lag'
      ]
    },
    {
      id: 'Administrator' as const,
      title: 'IT & Infrastructure Admin',
      badge: 'SRE & Systems Operators',
      icon: ShieldCheck,
      bg: 'bg-emerald-900 text-emerald-100 border-emerald-800',
      activeBg: 'bg-[#166534] text-white',
      demoUser: 'Dr. Alexander Vance (IT Systems Admin)',
      features: [
        'Fleetwide microservices monitoring & automated probing',
        'Incident lifecycle management (Detected → Investigating → Resolved)',
        'SLA availability, Uptime timeline blocks, & P95/P99 latency',
        'Interactive Demo scenario simulator & SSRF controls'
      ]
    }
  ];

  const currentRoleConfig = roles.find(r => r.id === selectedRole)!;

  return (
    <Modal
      isOpen={isLoginModalOpen}
      onClose={() => setIsLoginModalOpen(false)}
      title="Select Your Portal & Sign In"
      description="Each role has its own dedicated point of view, clinical workflows, and operational capabilities"
      maxWidth="2xl"
    >
      <div className="space-y-6">
        {/* Role Selector Tabs */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {roles.map(r => {
            const Icon = r.icon;
            const isSelected = selectedRole === r.id;
            return (
              <button
                key={r.id}
                type="button"
                onClick={() => {
                  setSelectedRole(r.id);
                  setEmail(r.id === 'Patient' ? 'patient@careplus.com' : r.id === 'Staff' ? 'staff@careplus.com' : 'admin@careplus.com');
                  setPassword(r.id === 'Patient' ? 'patient123' : r.id === 'Staff' ? 'staff123' : 'admin123');
                }}
                className={`p-3.5 rounded-2xl border text-left transition-all relative flex flex-col justify-between ${
                  isSelected
                    ? 'border-[#16A34A] ring-2 ring-[#16A34A]/20 bg-white shadow-card'
                    : 'border-slate-200 bg-slate-50/50 hover:bg-slate-50'
                }`}
              >
                <div>
                  <div className={`w-8 h-8 rounded-xl flex items-center justify-center mb-2.5 ${r.bg}`}>
                    <Icon className="w-4 h-4" />
                  </div>
                  <h4 className="font-bold text-xs text-slate-900">{r.title}</h4>
                  <p className="text-[10px] text-slate-500 mt-0.5">{r.badge}</p>
                </div>
                {isSelected && (
                  <span className="mt-2 text-[10px] font-bold text-[#16A34A] flex items-center gap-1">
                    <CheckCircle2 className="w-3 h-3" />
                    Selected
                  </span>
                )}
              </button>
            );
          })}
        </div>

        {/* Selected Role Perspective Features */}
        <div className="p-4 rounded-xl bg-slate-50 border border-slate-200">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold text-slate-900 uppercase tracking-wider">
              {currentRoleConfig.title} &bull; Perspective & Features
            </span>
            <span className="text-[11px] font-medium text-slate-500">
              User: <strong>{currentRoleConfig.demoUser}</strong>
            </span>
          </div>
          <ul className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs text-slate-700">
            {currentRoleConfig.features.map((feat, idx) => (
              <li key={idx} className="flex items-start gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-[#16A34A] mt-1.5 shrink-0" />
                <span>{feat}</span>
              </li>
            ))}
          </ul>
        </div>

        {/* Action Buttons */}
        <div className="space-y-3 pt-2">
          {/* Quick Demo One-Click Sign In */}
          <button
            type="button"
            onClick={() => loginWithRole(selectedRole)}
            className="w-full py-3 px-4 bg-[#16A34A] hover:bg-[#15803D] text-white rounded-xl text-xs font-bold shadow-md hover:shadow-lg transition-all flex items-center justify-center gap-2 group"
          >
            <span>One-Click Sign In as {currentRoleConfig.demoUser.split(' ')[0]} ({currentRoleConfig.id})</span>
            <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
          </button>

          <p className="text-center text-[11px] text-slate-400">
            Or sign in with email credentials below:
          </p>

          <form onSubmit={handleCustomLogin} className="space-y-3">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                  Email Address
                </label>
                <input
                  type="email"
                  value={email || (selectedRole === 'Patient' ? 'patient@careplus.com' : selectedRole === 'Staff' ? 'staff@careplus.com' : 'admin@careplus.com')}
                  onChange={e => setEmail(e.target.value)}
                  className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs text-slate-900 focus:outline-none focus:border-[#16A34A]"
                  required
                />
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                  Password
                </label>
                <input
                  type="password"
                  value={password || (selectedRole === 'Patient' ? 'patient123' : selectedRole === 'Staff' ? 'staff123' : 'admin123')}
                  onChange={e => setPassword(e.target.value)}
                  className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs text-slate-900 focus:outline-none focus:border-[#16A34A]"
                  required
                />
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setIsLoginModalOpen(false)}
                className="px-4 py-2 border border-slate-200 text-slate-700 hover:bg-slate-50 rounded-xl text-xs font-semibold"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-5 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold transition-colors"
              >
                Sign In to {selectedRole} Portal
              </button>
            </div>
          </form>
        </div>
      </div>
    </Modal>
  );
};
