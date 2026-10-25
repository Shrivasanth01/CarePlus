import React from 'react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid
} from 'recharts';
import { UptimeTrendPoint } from '../../types';

interface UptimeTrendChartProps {
  data: UptimeTrendPoint[];
}

export const UptimeTrendChart: React.FC<UptimeTrendChartProps> = ({ data }) => {
  return (
    <div className="bg-white p-5 rounded-2xl border border-[#E5E7EB] shadow-subtle">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="text-sm font-bold text-[#1F2937]">System Availability Trend</h3>
          <p className="text-xs text-[#64748B] mt-0.5">Historical availability percentage across monitored windows</p>
        </div>
        <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-[#DCFCE7] text-[#166534] border border-[#BBF7D0]">
          SLA Target: 99.9%
        </span>
      </div>

      <div className="h-64 w-full">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#F1F5F9" />
            <XAxis
              dataKey="time"
              tickLine={false}
              axisLine={{ stroke: '#E2E8F0' }}
              tick={{ fontSize: 11, fill: '#64748B' }}
            />
            <YAxis
              tickLine={false}
              axisLine={false}
              domain={[90, 100]}
              tick={{ fontSize: 11, fill: '#64748B' }}
              unit="%"
            />
            <Tooltip
              content={({ active, payload, label }) => {
                if (active && payload && payload.length) {
                  const val = payload[0]?.value as number;
                  return (
                    <div className="bg-white p-3 border border-slate-200 rounded-xl shadow-elevated text-xs">
                      <p className="font-bold text-slate-800 mb-1">{label}</p>
                      <p className={`font-semibold ${val >= 99.9 ? 'text-[#166534]' : 'text-amber-700'}`}>
                        Uptime: {val}%
                      </p>
                    </div>
                  );
                }
                return null;
              }}
            />
            <Bar
              dataKey="uptime"
              fill="#16A34A"
              radius={[4, 4, 0, 0]}
              maxBarSize={40}
            />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};
