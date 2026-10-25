import React from 'react';
import { ServiceStatus } from '../../types';

interface StatusBadgeProps {
  status: ServiceStatus | string;
  size?: 'sm' | 'md' | 'lg';
  showPulse?: boolean;
}

export const StatusBadge: React.FC<StatusBadgeProps> = ({
  status,
  size = 'md',
  showPulse = true
}) => {
  const normStatus = (status || 'Unknown').toLowerCase();

  let bgClass = 'bg-slate-100 text-slate-700 border-slate-200';
  let dotClass = 'bg-slate-400';
  let text = status;

  if (normStatus === 'operational' || normStatus === 'healthy') {
    bgClass = 'bg-[#DCFCE7] text-[#166534] border-[#BBF7D0]';
    dotClass = 'bg-[#16A34A]';
    text = 'Operational';
  } else if (normStatus === 'degraded' || normStatus === 'warning') {
    bgClass = 'bg-amber-100 text-amber-800 border-amber-200';
    dotClass = 'bg-amber-500';
    text = 'Degraded';
  } else if (normStatus === 'down' || normStatus === 'critical') {
    bgClass = 'bg-red-100 text-red-800 border-red-200';
    dotClass = 'bg-red-600';
    text = 'Down';
  } else if (normStatus === 'maintenance') {
    bgClass = 'bg-indigo-100 text-indigo-800 border-indigo-200';
    dotClass = 'bg-indigo-500';
    text = 'Maintenance';
  }

  const sizeClasses = {
    sm: 'text-xs px-2 py-0.5 gap-1.5',
    md: 'text-xs px-2.5 py-1 gap-2 font-medium',
    lg: 'text-sm px-3.5 py-1.5 gap-2.5 font-semibold'
  };

  return (
    <span className={`inline-flex items-center rounded-full border shadow-xs transition-colors ${sizeClasses[size]} ${bgClass}`}>
      <span className="relative flex h-2 w-2">
        {showPulse && normStatus !== 'unknown' && normStatus !== 'maintenance' && (
          <span className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${dotClass}`} />
        )}
        <span className={`relative inline-flex rounded-full h-2 w-2 ${dotClass}`} />
      </span>
      <span>{text}</span>
    </span>
  );
};
