import { useState } from 'react';
import type { Parliamentarian } from '../types';

interface Props {
  parliamentarians: Parliamentarian[];
  onSelect: (parl: Parliamentarian) => void;
}

export default function ParlList({ parliamentarians, onSelect }: Props) {
  const [query, setQuery] = useState('');
  const [chamberFilter, setChamberFilter] = useState<'all' | 'senado' | 'camara'>('all');

  const filtered = parliamentarians.filter((p) => {
    if (chamberFilter !== 'all' && p.chamber !== chamberFilter) return false;
    if (query) {
      const q = query.toLowerCase();
      return p.fullName.toLowerCase().includes(q) || p.party?.toLowerCase().includes(q) || p.region?.toLowerCase().includes(q);
    }
    return true;
  });

  return (
    <section>
      <div className="flex flex-wrap gap-3 items-end mb-4">
        <div className="flex-1 min-w-[200px]">
          <input
            type="text"
            placeholder="Buscar por nombre, partido o región..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="w-full py-2.5 px-3 border border-gray-300 rounded-lg text-sm outline-none focus:border-[#0039a6] focus:ring-[3px] focus:ring-[#0039a6]/10"
          />
        </div>
        <div className="flex rounded-lg overflow-hidden border-2 border-[#0039a6]">
          {(['all', 'senado', 'camara'] as const).map((ch) => (
            <button
              key={ch}
              className={`px-4 py-2 text-sm font-semibold transition-colors ${chamberFilter === ch ? 'bg-[#0039a6] text-white' : 'bg-white text-[#0039a6] hover:bg-blue-50'}`}
              onClick={() => setChamberFilter(ch)}
            >
              {ch === 'all' ? 'Todos' : ch === 'senado' ? 'Senado' : 'Cámara'}
            </button>
          ))}
        </div>
      </div>

      <p className="text-xs text-gray-500 mb-3">{filtered.length} parlamentario{filtered.length !== 1 ? 's' : ''}</p>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
        {filtered.map((p) => (
          <button
            key={`${p.chamber}-${p.id}`}
            onClick={() => onSelect(p)}
            className="text-left p-3 bg-white rounded-lg border border-gray-200 hover:border-[#0039a6] hover:shadow-sm transition-all"
          >
            <div className="font-semibold text-sm">{p.fullName}</div>
            <div className="flex flex-wrap gap-1.5 mt-1">
              {p.party && <span className="text-xs bg-gray-100 text-gray-600 px-1.5 py-0.5 rounded">{p.party}</span>}
              {p.region && <span className="text-xs bg-gray-100 text-gray-500 px-1.5 py-0.5 rounded truncate max-w-[200px]">{p.region}</span>}
              <span className="text-xs bg-[#0039a6]/10 text-[#0039a6] px-1.5 py-0.5 rounded font-medium">
                {p.chamber === 'senado' ? 'Senador' : 'Diputado'}
              </span>
            </div>
          </button>
        ))}
      </div>
    </section>
  );
}
