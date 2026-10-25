import React from 'react';
import { LucideIcon } from 'lucide-react';

interface SummaryCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  icon: LucideIcon;
  variant?: 'normal' | 'success' | 'warning' | 'danger' | 'info';
  trend?: {
    value: string;
    isPositive?: boolean;
    label?: string;
  };
}

export const SummaryCard: React.FC<SummaryCardProps> = ({
  title,
  value,
  subtitle,
  icon: Icon,
  variant = 'normal',
  trend
}) => {
  const variantStyles = {
    normal: {
      bg: 'bg-white',
      border: 'border-[#E5E7EB]',
      iconBg: 'bg-slate-50 text-slate-700',
      valueColor: 'text-[#1F2937]'
    },
    success: {
      bg: 'bg-white',
      border: 'border-[#BBF7D0] hover:border-[#16A34A]',
      iconBg: 'bg-[#DCFCE7] text-[#166534]',
      valueColor: 'text-[#166534]'
    },
    warning: {
      bg: 'bg-white',
      border: 'border-amber-200 hover:border-amber-400',
      iconBg: 'bg-amber-100 text-amber-800',
      valueColor: 'text-amber-800'
    },
    danger: {
      bg: 'bg-white',
      border: 'border-red-200 hover:border-red-500',
      iconBg: 'bg-red-100 text-red-700',
      valueColor: 'text-red-700'
    },
    info: {
      bg: 'bg-white',
      border: 'border-blue-200 hover:border-blue-400',
      iconBg: 'bg-blue-100 text-blue-800',
      valueColor: 'text-blue-800'
    }
  }[variant];

  return (
    <div className={`p-5 rounded-xl border ${variantStyles.border} ${variantStyles.bg} shadow-subtle hover:shadow-card transition-all duration-200 flex flex-col justify-between`}>
      <div className="flex items-center justify-between">
        <span className="text-xs font-semibold uppercase tracking-wider text-[#64748B]">
          {title}
        </span>
        <div className={`p-2.5 rounded-lg ${variantStyles.iconBg}`}>
          <Icon className="w-5 h-5" />
        </div>
      </div>

      <div className="mt-3">
        <div className={`text-2xl font-bold tracking-tight ${variantStyles.valueColor}`}>
          {value}
        </div>
        {subtitle && (
          <p className="mt-1 text-xs text-[#64748B] font-normal truncate">
            {subtitle}
          </p>
        )}
      </div>

      {trend && (
        <div className="mt-3 pt-3 border-t border-slate-100 flex items-center text-xs">
          <span className={`font-semibold mr-1.5 ${trend.isPositive ? 'text-green-600' : 'text-red-600'}`}>
            {trend.value}
          </span>
          <span className="text-slate-500">{trend.label || 'vs last period'}</span>
        </div>
      )}
    </div>
  );
};
