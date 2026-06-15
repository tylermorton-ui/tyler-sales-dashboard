type Props = {
  label: string;
  value: string;
  sub?: string;
  accent?: 'blue' | 'green' | 'purple' | 'amber';
};

const valueColor = {
  blue: 'text-blue-600',
  green: 'text-emerald-600',
  purple: 'text-purple-600',
  amber: 'text-amber-600',
};

export default function MetricCard({ label, value, sub, accent = 'blue' }: Props) {
  return (
    <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-6 flex flex-col gap-1">
      <span className="text-xs font-semibold uppercase tracking-wider text-gray-400">{label}</span>
      <span className={`text-3xl font-bold mt-1 ${valueColor[accent]}`}>{value}</span>
      {sub && <span className="text-sm text-gray-400 mt-0.5">{sub}</span>}
    </div>
  );
}
