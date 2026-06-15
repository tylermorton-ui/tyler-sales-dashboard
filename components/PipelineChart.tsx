'use client';

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from 'recharts';

type Stage = { label: string; value: number; count: number };

const STAGE_COLORS = ['#BFDBFE', '#93C5FD', '#60A5FA', '#3B82F6', '#2563EB', '#1D4ED8'];

function fmt(v: number) {
  if (v >= 1_000_000) return `$${(v / 1_000_000).toFixed(1)}M`;
  if (v >= 1_000) return `$${Math.round(v / 1_000)}K`;
  return `$${v.toFixed(0)}`;
}

function CustomTooltip({ active, payload }: { active?: boolean; payload?: { payload: Stage }[] }) {
  if (!active || !payload?.length) return null;
  const { label, value, count } = payload[0].payload;
  return (
    <div className="bg-white border border-gray-200 rounded-lg shadow-lg p-3 text-sm">
      <p className="font-semibold text-gray-900 mb-1">{label}</p>
      <p className="text-blue-600 font-medium">{fmt(value)}</p>
      <p className="text-gray-500">
        {count} deal{count !== 1 ? 's' : ''}
      </p>
    </div>
  );
}

export default function PipelineChart({ stages }: { stages: Stage[] }) {
  if (!stages.length) {
    return (
      <div className="flex items-center justify-center h-52 text-gray-400 text-sm">
        No active pipeline deals
      </div>
    );
  }

  return (
    <ResponsiveContainer width="100%" height={240}>
      <BarChart data={stages} margin={{ top: 4, right: 8, bottom: 4, left: 0 }}>
        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#F3F4F6" />
        <XAxis
          dataKey="label"
          tick={{ fontSize: 11, fill: '#9CA3AF' }}
          axisLine={false}
          tickLine={false}
        />
        <YAxis
          tickFormatter={fmt}
          tick={{ fontSize: 11, fill: '#9CA3AF' }}
          axisLine={false}
          tickLine={false}
          width={52}
        />
        <Tooltip content={<CustomTooltip />} cursor={{ fill: '#F9FAFB' }} />
        <Bar dataKey="value" radius={[4, 4, 0, 0]}>
          {stages.map((_, i) => (
            <Cell key={i} fill={STAGE_COLORS[Math.min(i, STAGE_COLORS.length - 1)]} />
          ))}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  );
}
