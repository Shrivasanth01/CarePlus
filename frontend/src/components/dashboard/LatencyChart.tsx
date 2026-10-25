import React from 'react';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid
} from 'recharts';
import { LatencyPoint } from '../../types';

interface LatencyChartProps {
  data: LatencyPoint[];
}

export const LatencyChart: React.FC<LatencyChartProps> = ({ data }) => {
  return (
    <div className="bg-white p-5 rounded-2xl border border-[#E5E7EB] shadow-subtle">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="text-sm font-bold text-[#1F2937]">Response Time & Latency Trends</h3>
          <p className="text-xs text-[#64748B] mt-0.5">Average and 95th Percentile (P95) latency</p>
        </div>
        <div className="flex items-center gap-4 text-xs font-medium">
          <div className="flex items-center gap-1.5">
            <span className="w-3 h-3 rounded-full bg-[#16A34A]" />
            <span className="text-[#64748B]">Avg Latency</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-3 h-3 rounded-full bg-amber-500" />
            <span className="text-[#64748B]">P95 Latency</span>
          </div>
        </div>
      </div>

      <div className="h-64 w-full">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={data} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
            <defs>
              <linearGradient id="avgGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#16A34A" stopOpacity={0.25} />
                <stop offset="95%" stopColor="#16A34A" stopOpacity={0.0} />
              </linearGradient>
              <linearGradient id="p95Gradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#F59E0B" stopOpacity={0.2} />
                <stop offset="95%" stopColor="#F59E0B" stopOpacity={0.0} />
              </linearGradient>
            </defs>
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
              tick={{ fontSize: 11, fill: '#64748B' }}
              unit="ms"
            />
            <Tooltip
              content={({ active, payload, label }) => {
                if (active && payload && payload.length) {
                  return (
                    <div className="bg-white p-3 border border-slate-200 rounded-xl shadow-elevated text-xs">
                      <p className="font-bold text-slate-800 mb-1.5">{label}</p>
                      <div className="space-y-1">
                        <p className="text-[#166534] font-medium flex justify-between gap-3">
                          <span>Average:</span>
                          <span className="font-bold">{payload[0]?.value} ms</span>
                        </p>
                        <p className="text-amber-700 font-medium flex justify-between gap-3">
                          <span>P95 Latency:</span>
                          <span className="font-bold">{payload[1]?.value} ms</span>
                        </p>
                      </div>
                    </div>
                  );
                }
                return null;
              }}
            />
            <Area
              type="monotone"
              dataKey="avg_latency"
              stroke="#16A34A"
              strokeWidth={2.5}
              fillOpacity={1}
              fill="url(#avgGradient)"
              name="Avg Latency"
            />
            <Area
              type="monotone"
              dataKey="p95_latency"
              stroke="#F59E0B"
              strokeWidth={2}
              strokeDasharray="4 4"
              fillOpacity={1}
              fill="url(#p95Gradient)"
              name="P95 Latency"
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};
