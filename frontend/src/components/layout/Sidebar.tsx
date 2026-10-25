import React from 'react';
import { NavLink } from 'react-router-dom';
import {
  LayoutDashboard,
  Server,
  Layers,
  AlertOctagon,
  TrendingUp,
  Clock,
  Calendar,
  Sliders,
  Bell,
  FileText,
  Activity,
  ChevronLeft,
  ChevronRight,
  ShieldCheck,
  HeartHandshake,
  Stethoscope,
  KeyRound
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useMonitoring } from '../../context/MonitoringContext';

interface SidebarProps {
  collapsed: boolean;
  setCollapsed: (val: boolean) => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ collapsed, setCollapsed }) => {
  const { currentUser, setIsLoginModalOpen, switchRole } = useAuth();
  const { unreadCount } = useMonitoring();

  // Role-specific navigation items
  const getNavItems = () => {
    if (currentUser.role === 'Patient' || currentUser.role === 'Viewer') {
      return [
        { name: 'Patient Portal', path: '/', icon: LayoutDashboard },
        { name: 'Digital Services', path: '/services', icon: Server },
        { name: 'Notifications', path: '/notifications', icon: Bell, badge: unreadCount > 0 ? unreadCount : undefined },
      ];
    }

    if (currentUser.role === 'Staff' || currentUser.role === 'Operator') {
      return [
        { name: 'Clinical Ops Hub', path: '/', icon: LayoutDashboard },
        { name: 'Hospital Systems', path: '/services', icon: Server },
        { name: 'Active Incidents', path: '/incidents', icon: AlertOctagon, badge: unreadCount > 0 ? unreadCount : undefined },
        { name: 'Maintenance', path: '/maintenance', icon: Calendar },
        { name: 'Staff Alerts', path: '/notifications', icon: Bell },
      ];
    }

    // Default Administrator navigation
    return [
      { name: 'Dashboard', path: '/', icon: LayoutDashboard },
      { name: 'Services', path: '/services', icon: Server },
      { name: 'Service Groups', path: '/service-groups', icon: Layers },
      { name: 'Incidents', path: '/incidents', icon: AlertOctagon, badge: unreadCount > 0 ? unreadCount : undefined },
      { name: 'Uptime Reports', path: '/uptime', icon: TrendingUp },
      { name: 'Response Time', path: '/response-time', icon: Clock },
      { name: 'Maintenance', path: '/maintenance', icon: Calendar },
      { name: 'Monitoring Config', path: '/monitoring-config', icon: Sliders },
      { name: 'Notifications', path: '/notifications', icon: Bell },
      { name: 'Audit Logs', path: '/audit-logs', icon: FileText },
    ];
  };

  const navItems = getNavItems();

  const getRoleIcon = () => {
    if (currentUser.role === 'Patient' || currentUser.role === 'Viewer') return HeartHandshake;
    if (currentUser.role === 'Staff' || currentUser.role === 'Operator') return Stethoscope;
    return ShieldCheck;
  };

  const RoleIcon = getRoleIcon();

  return (
    <aside
      className={`fixed top-0 left-0 z-30 h-screen bg-white border-r border-[#E5E7EB] transition-all duration-300 ease-in-out flex flex-col justify-between ${
        collapsed ? 'w-20' : 'w-64'
      }`}
    >
      {/* Floating Edge Collapse / Expand Toggle Button */}
      <button
        type="button"
        onClick={() => setCollapsed(!collapsed)}
        className="absolute -right-3 top-5 z-40 w-6 h-6 rounded-full bg-white border border-[#E5E7EB] shadow-md flex items-center justify-center text-slate-500 hover:text-[#16A34A] hover:border-[#16A34A] hover:scale-110 active:scale-95 transition-all duration-200 cursor-pointer"
        title={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
        aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
      >
        {collapsed ? <ChevronRight className="w-3.5 h-3.5" /> : <ChevronLeft className="w-3.5 h-3.5" />}
      </button>

      {/* Top Header / Branding */}
      <div>
        <div
          className={`h-16 flex items-center border-b border-[#E5E7EB] transition-all duration-300 ${
            collapsed ? 'justify-center px-0' : 'justify-between px-4'
          }`}
        >
          <div
            className={`flex items-center gap-3 overflow-hidden cursor-pointer ${
              collapsed ? 'justify-center' : ''
            }`}
            onClick={() => collapsed && setCollapsed(false)}
            title={collapsed ? 'CarePlus Observability (Click to expand)' : undefined}
          >
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#16A34A] to-[#166534] flex items-center justify-center text-white shadow-xs shrink-0">
              <Activity className="w-6 h-6 animate-pulse-subtle" />
            </div>
            {!collapsed && (
              <div className="flex flex-col whitespace-nowrap overflow-hidden">
                <span className="font-extrabold text-lg text-[#1F2937] tracking-tight flex items-center gap-1.5">
                  Care<span className="text-[#16A34A]">Plus</span>
                </span>
                <span className="text-[10px] uppercase font-bold tracking-wider text-[#64748B]">
                  Health Observability
                </span>
              </div>
            )}
          </div>
        </div>

        {/* Portal Perspective Pill (when expanded) */}
        {!collapsed && (
          <div className="px-3 pt-3">
            <div className={`px-3 py-1.5 rounded-xl border text-[11px] font-bold flex items-center gap-2 ${
              currentUser.role === 'Patient' || currentUser.role === 'Viewer'
                ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                : currentUser.role === 'Staff' || currentUser.role === 'Operator'
                ? 'bg-blue-50 text-blue-800 border-blue-200'
                : 'bg-slate-900 text-white border-slate-800'
            }`}>
              <RoleIcon className="w-3.5 h-3.5 shrink-0" />
              <span className="truncate">
                {currentUser.role === 'Patient' || currentUser.role === 'Viewer'
                  ? 'Patient Portal View'
                  : currentUser.role === 'Staff' || currentUser.role === 'Operator'
                  ? 'Clinical Staff Hub'
                  : 'Administrator Console'}
              </span>
            </div>
          </div>
        )}

        {/* Navigation Links */}
        <nav className="p-3 space-y-1">
          {navItems.map((item) => (
            <NavLink
              key={item.path}
              to={item.path}
              className={({ isActive }) =>
                `flex items-center rounded-xl font-medium text-sm transition-all duration-200 ${
                  collapsed ? 'justify-center p-2.5' : 'gap-3 px-3 py-2.5'
                } ${
                  isActive
                    ? 'bg-[#DCFCE7] text-[#166534] font-semibold shadow-xs'
                    : 'text-[#64748B] hover:text-[#1F2937] hover:bg-slate-50'
                }`
              }
              title={collapsed ? item.name : undefined}
            >
              <item.icon className="w-5 h-5 shrink-0" />
              {!collapsed && <span className="truncate whitespace-nowrap">{item.name}</span>}
              {!collapsed && item.badge && (
                <span className="ml-auto bg-red-600 text-white text-[11px] font-bold px-2 py-0.5 rounded-full">
                  {item.badge}
                </span>
              )}
            </NavLink>
          ))}
        </nav>
      </div>

      {/* User Profile & Role Switcher */}
      <div className="p-3 border-t border-[#E5E7EB] bg-slate-50/70">
        {!collapsed ? (
          <div className="space-y-2.5">
            <div className="flex items-center gap-3 px-1">
              <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-xs shadow-xs text-white ${
                currentUser.role === 'Patient' || currentUser.role === 'Viewer'
                  ? 'bg-emerald-600'
                  : currentUser.role === 'Staff' || currentUser.role === 'Operator'
                  ? 'bg-blue-600'
                  : 'bg-[#16A34A]'
              }`}>
                {currentUser.name.charAt(0)}
              </div>
              <div className="flex flex-col truncate min-w-0">
                <span className="text-xs font-semibold text-[#1F2937] truncate">
                  {currentUser.name}
                </span>
                <span className="text-[10px] text-[#64748B] flex items-center gap-1 truncate">
                  <RoleIcon className="w-3 h-3 text-[#16A34A] shrink-0" />
                  <span className="truncate">{currentUser.role} Portal</span>
                </span>
              </div>
            </div>

            {/* Portal Switch Button */}
            <button
              type="button"
              onClick={() => setIsLoginModalOpen(true)}
              className="w-full py-1.5 px-2.5 bg-white border border-[#16A34A]/40 text-[#166534] hover:bg-[#DCFCE7] rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 shadow-2xs"
            >
              <KeyRound className="w-3.5 h-3.5 text-[#16A34A]" />
              <span>Switch Portal Login</span>
            </button>
          </div>
        ) : (
          <div className="flex flex-col items-center gap-2">
            <button
              type="button"
              onClick={() => setIsLoginModalOpen(true)}
              className={`w-9 h-9 rounded-xl flex items-center justify-center font-bold text-xs shadow-xs text-white hover:scale-105 transition-transform ${
                currentUser.role === 'Patient' || currentUser.role === 'Viewer'
                  ? 'bg-emerald-600'
                  : currentUser.role === 'Staff' || currentUser.role === 'Operator'
                  ? 'bg-blue-600'
                  : 'bg-[#16A34A]'
              }`}
              title={`${currentUser.name} (${currentUser.role}) — Click to Switch Portal`}
            >
              {currentUser.name.charAt(0)}
            </button>
          </div>
        )}
      </div>
    </aside>
  );
};
