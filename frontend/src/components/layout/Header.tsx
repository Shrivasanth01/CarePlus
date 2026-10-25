import React, { useState, useEffect } from 'react';
import {
  Search,
  Bell,
  RefreshCw,
  Radio,
  CheckCheck,
  AlertCircle,
  ExternalLink,
  ChevronDown,
  KeyRound,
  HeartHandshake,
  Stethoscope,
  ShieldCheck
} from 'lucide-react';
import { useMonitoring } from '../../context/MonitoringContext';
import { useAuth, PORTAL_USERS } from '../../context/AuthContext';
import { api } from '../../services/api';
import { NotificationItem, UserRole } from '../../types';
import { useNavigate } from 'react-router-dom';

interface HeaderProps {
  sidebarCollapsed: boolean;
}

export const Header: React.FC<HeaderProps> = ({ sidebarCollapsed }) => {
  const { status, triggerRefresh, unreadCount } = useMonitoring();
  const { currentUser, switchRole, setIsLoginModalOpen } = useAuth();
  const navigate = useNavigate();

  const [isRefreshing, setIsRefreshing] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [showUserMenu, setShowUserMenu] = useState(false);

  useEffect(() => {
    if (showNotifications) {
      api.getNotifications(false).then(setNotifications).catch(() => {});
    }
  }, [showNotifications]);

  const handleManualRefresh = () => {
    setIsRefreshing(true);
    triggerRefresh();
    setTimeout(() => setIsRefreshing(false), 600);
  };

  const handleMarkAllRead = async () => {
    await api.markAllNotificationsRead();
    setNotifications(prev => prev.map(n => ({ ...n, is_read: true })));
  };

  const statusConfig = {
    Connected: { color: 'bg-[#16A34A]', text: 'Live Feed Connected', border: 'border-[#BBF7D0] bg-[#DCFCE7]/50 text-[#166534]' },
    Reconnecting: { color: 'bg-amber-500 animate-pulse', text: 'Reconnecting WebSocket...', border: 'border-amber-200 bg-amber-50 text-amber-800' },
    Disconnected: { color: 'bg-red-500', text: 'Polling Fallback Active', border: 'border-red-200 bg-red-50 text-red-700' }
  }[status];

  const getRoleBadgeStyle = () => {
    if (currentUser.role === 'Patient' || currentUser.role === 'Viewer') {
      return 'bg-emerald-100 text-emerald-800 border-emerald-200';
    }
    if (currentUser.role === 'Staff' || currentUser.role === 'Operator') {
      return 'bg-blue-100 text-blue-800 border-blue-200';
    }
    return 'bg-green-100 text-[#166534] border-[#BBF7D0]';
  };

  return (
    <header className="sticky top-0 z-20 bg-white/95 backdrop-blur-md border-b border-[#E5E7EB] h-16 px-6 flex items-center justify-between">
      {/* Search Input */}
      <div className="flex items-center gap-4 flex-1 max-w-md">
        <div className="relative w-full">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search services, endpoints, incidents (Press '/' to focus)..."
            className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-[#1F2937] placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-[#16A34A]/20 focus:border-[#16A34A] transition-all"
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                navigate(`/services?search=${(e.target as HTMLInputElement).value}`);
              }
            }}
          />
        </div>
      </div>

      {/* Right Controls */}
      <div className="flex items-center gap-3">
        {/* Portal Login Quick Switcher Button */}
        <button
          onClick={() => setIsLoginModalOpen(true)}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-50 hover:bg-slate-100 border border-slate-200 text-xs font-bold text-slate-700 transition-colors shadow-2xs"
          title="Switch Portal or Sign In (Patient / Staff / Administrator)"
        >
          <KeyRound className="w-3.5 h-3.5 text-[#16A34A]" />
          <span className="hidden sm:inline">Portal Login</span>
        </button>

        {/* Live WebSocket Status Pill */}
        <div className={`hidden lg:flex items-center gap-2 px-3 py-1.5 rounded-full border text-xs font-medium ${statusConfig.border}`}>
          <span className="relative flex h-2 w-2">
            <span className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${statusConfig.color}`} />
            <span className={`relative inline-flex rounded-full h-2 w-2 ${statusConfig.color}`} />
          </span>
          <span>{statusConfig.text}</span>
        </div>

        {/* Refresh Button */}
        <button
          onClick={handleManualRefresh}
          className="p-2 rounded-xl text-slate-600 hover:text-slate-900 hover:bg-slate-100 border border-slate-200 transition-all shadow-2xs"
          title="Refresh All Metrics"
        >
          <RefreshCw className={`w-4 h-4 ${isRefreshing ? 'animate-spin text-[#16A34A]' : ''}`} />
        </button>

        {/* Notification Bell with Dropdown */}
        <div className="relative">
          <button
            onClick={() => setShowNotifications(!showNotifications)}
            className="relative p-2 rounded-xl text-slate-600 hover:text-slate-900 hover:bg-slate-100 border border-slate-200 transition-all shadow-2xs"
            title="Notifications"
          >
            <Bell className="w-4 h-4" />
            {unreadCount > 0 && (
              <span className="absolute -top-1 -right-1 bg-red-600 text-white text-[10px] font-bold h-4.5 min-w-4.5 px-1 rounded-full flex items-center justify-center animate-pulse">
                {unreadCount}
              </span>
            )}
          </button>

          {showNotifications && (
            <div className="absolute right-0 mt-2 w-80 sm:w-96 bg-white rounded-2xl shadow-elevated border border-slate-200 z-50 overflow-hidden animate-fade-in">
              <div className="px-4 py-3 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
                <span className="font-bold text-xs uppercase tracking-wider text-slate-700">
                  Incident Notifications
                </span>
                <button
                  onClick={handleMarkAllRead}
                  className="text-xs text-[#16A34A] hover:underline font-medium flex items-center gap-1"
                >
                  <CheckCheck className="w-3.5 h-3.5" />
                  Mark all read
                </button>
              </div>

              <div className="max-h-80 overflow-y-auto divide-y divide-slate-100">
                {notifications.length === 0 ? (
                  <div className="py-8 text-center text-xs text-slate-400">
                    No new notifications
                  </div>
                ) : (
                  notifications.map(n => (
                    <div
                      key={n.id}
                      className={`p-3 text-xs transition-colors ${n.is_read ? 'bg-white' : 'bg-green-50/40'}`}
                    >
                      <div className="flex items-start justify-between gap-2">
                        <span className="font-semibold text-slate-800">{n.title}</span>
                        <span className="text-[10px] text-slate-400 whitespace-nowrap">
                          {new Date(n.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </span>
                      </div>
                      <p className="mt-1 text-slate-600 line-clamp-2">{n.message}</p>
                    </div>
                  ))
                )}
              </div>

              <div className="p-2.5 bg-slate-50 border-t border-slate-200 text-center">
                <button
                  onClick={() => {
                    setShowNotifications(false);
                    navigate('/notifications');
                  }}
                  className="text-xs text-[#16A34A] font-semibold hover:underline"
                >
                  View all notifications &rarr;
                </button>
              </div>
            </div>
          )}
        </div>

        {/* User Profile Menu */}
        <div className="relative">
          <button
            onClick={() => setShowUserMenu(!showUserMenu)}
            className="flex items-center gap-2 pl-2 pr-3 py-1.5 rounded-xl border border-slate-200 hover:border-slate-300 bg-white transition-all shadow-2xs"
          >
            <div className={`w-7 h-7 rounded-lg text-white flex items-center justify-center font-bold text-xs ${
              currentUser.role === 'Patient' || currentUser.role === 'Viewer'
                ? 'bg-emerald-600'
                : currentUser.role === 'Staff' || currentUser.role === 'Operator'
                ? 'bg-blue-600'
                : 'bg-[#16A34A]'
            }`}>
              {currentUser.name.charAt(0)}
            </div>
            <span className="text-xs font-semibold text-[#1F2937] hidden md:inline">
              {currentUser.name.split(' ')[0]}
            </span>
            <span className={`text-[10px] px-1.5 py-0.5 rounded border font-semibold ${getRoleBadgeStyle()}`}>
              {currentUser.role}
            </span>
            <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
          </button>

          {showUserMenu && (
            <div className="absolute right-0 mt-2 w-64 bg-white rounded-2xl shadow-elevated border border-slate-200 z-50 p-2 animate-fade-in text-xs">
              <div className="px-3 py-2 border-b border-slate-100 mb-1">
                <p className="font-bold text-slate-800">{currentUser.name}</p>
                <p className="text-[11px] text-slate-500">{currentUser.email}</p>
                <p className="text-[10px] text-slate-400 mt-0.5">
                  {currentUser.department || currentUser.patient_id || 'CarePlus System User'}
                </p>
              </div>

              <div className="px-3 py-1.5 text-[11px] font-semibold uppercase tracking-wider text-slate-400">
                Switch Portal / Role
              </div>
              
              {/* Patient */}
              <button
                onClick={() => {
                  switchRole('Patient');
                  setShowUserMenu(false);
                }}
                className={`w-full text-left px-3 py-2 rounded-xl font-medium transition-colors flex items-center justify-between ${
                  currentUser.role === 'Patient' ? 'bg-emerald-50 text-emerald-800 font-bold' : 'hover:bg-slate-50 text-slate-700'
                }`}
              >
                <div className="flex items-center gap-2">
                  <HeartHandshake className="w-3.5 h-3.5 text-emerald-600" />
                  <div>
                    <span className="block font-semibold">Patient Portal</span>
                    <span className="text-[10px] text-slate-400">Eleanor Rigby</span>
                  </div>
                </div>
                {currentUser.role === 'Patient' && <span className="text-emerald-600 text-[10px] font-bold">&#10003; Active</span>}
              </button>

              {/* Staff */}
              <button
                onClick={() => {
                  switchRole('Staff');
                  setShowUserMenu(false);
                }}
                className={`w-full text-left px-3 py-2 rounded-xl font-medium transition-colors flex items-center justify-between ${
                  currentUser.role === 'Staff' ? 'bg-blue-50 text-blue-800 font-bold' : 'hover:bg-slate-50 text-slate-700'
                }`}
              >
                <div className="flex items-center gap-2">
                  <Stethoscope className="w-3.5 h-3.5 text-blue-600" />
                  <div>
                    <span className="block font-semibold">Clinical Staff</span>
                    <span className="text-[10px] text-slate-400">Nurse Sarah Jenkins, RN</span>
                  </div>
                </div>
                {currentUser.role === 'Staff' && <span className="text-blue-600 text-[10px] font-bold">&#10003; Active</span>}
              </button>

              {/* Administrator */}
              <button
                onClick={() => {
                  switchRole('Administrator');
                  setShowUserMenu(false);
                }}
                className={`w-full text-left px-3 py-2 rounded-xl font-medium transition-colors flex items-center justify-between ${
                  currentUser.role === 'Administrator' ? 'bg-green-50 text-[#166534] font-bold' : 'hover:bg-slate-50 text-slate-700'
                }`}
              >
                <div className="flex items-center gap-2">
                  <ShieldCheck className="w-3.5 h-3.5 text-[#16A34A]" />
                  <div>
                    <span className="block font-semibold">Administrator</span>
                    <span className="text-[10px] text-slate-400">Dr. Alexander Vance</span>
                  </div>
                </div>
                {currentUser.role === 'Administrator' && <span className="text-[#16A34A] text-[10px] font-bold">&#10003; Active</span>}
              </button>

              <div className="border-t border-slate-100 mt-2 pt-1.5 space-y-1">
                <button
                  onClick={() => {
                    setShowUserMenu(false);
                    setIsLoginModalOpen(true);
                  }}
                  className="w-full text-left px-3 py-1.5 rounded-lg text-emerald-700 hover:bg-emerald-50 font-semibold flex items-center gap-1.5"
                >
                  <KeyRound className="w-3 h-3" />
                  <span>Portal Login Modal...</span>
                </button>
                <button
                  onClick={() => {
                    setShowUserMenu(false);
                    navigate('/monitoring-config');
                  }}
                  className="w-full text-left px-3 py-1.5 rounded-lg text-slate-600 hover:bg-slate-50"
                >
                  System Settings
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};
