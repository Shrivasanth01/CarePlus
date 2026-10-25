import React from 'react';
import { IncidentSeverity } from '../../types';

interface SeverityBadgeProps {
  severity: IncidentSeverity | string;
}

export const SeverityBadge: React.FC<SeverityBadgeProps> = ({ severity }) => {
  const sev = (severity || 'Medium').toLowerCase();

  let styles = 'bg-slate-100 text-slate-800 border-slate-200';
  if (sev === 'critical') {
    styles = 'bg-red-50 text-red-700 border-red-200 ring-1 ring-red-600/10 font-bold';
  } else if (sev === 'high') {
    styles = 'bg-orange-50 text-orange-700 border-orange-200 font-semibold';
  } else if (sev === 'medium') {
    styles = 'bg-amber-50 text-amber-700 border-amber-200 font-medium';
  } else if (sev === 'low') {
    styles = 'bg-blue-50 text-blue-700 border-blue-200 font-medium';
  }

  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded text-xs border uppercase tracking-wider ${styles}`}>
      {severity}
    </span>
  );
};
