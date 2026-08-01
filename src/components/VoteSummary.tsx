import type { ParlStats } from '../types';

interface Props {
  stats: ParlStats;
}

export default function VoteSummary({ stats }: Props) {
  const bars = [
    { label: 'A favor',    value: stats.afavor,    color: 'bg-green-500' },
    { label: 'En contra',  value: stats.contra,    color: 'bg-red-500' },
    { label: 'Abstención', value: stats.abstencion, color: 'bg-amber-500' },
    { label: 'Pareo',      value: stats.pareo,     color: 'bg-indigo-500' },
    { label: 'Ausente',    value: stats.ausente,   color: 'bg-gray-400' },
  ];

  const max = Math.max(...bars.map((b) => b.value), 1);

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-4 mb-4">
      <div className="flex items-baseline gap-2 mb-3">
        <span className="text-2xl font-bold">{stats.total}</span>
        <span className="text-sm text-gray-500">votaciones totales</span>
      </div>
      <div className="space-y-1.5">
        {bars.map((b) => (
          <div key={b.label} className="flex items-center gap-2 text-xs">
            <span className="w-20 text-gray-600">{b.label}</span>
            <div className="flex-1 h-5 bg-gray-100 rounded overflow-hidden">
              <div
                className={`h-full ${b.color} rounded transition-all duration-500`}
                style={{ width: `${(b.value / max) * 100}%`, minWidth: b.value > 0 ? '4px' : 0 }}
              />
            </div>
            <span className="w-8 text-right font-semibold">{b.value}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
