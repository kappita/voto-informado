import { useState, useMemo } from 'react';
import type { VotingRecord, VoteOption } from '../types';
import { getTagColor, getTagLabel } from '../utils/tags';

interface Props {
  vote: VotingRecord;
  parlVote: VoteOption | undefined;
}

const VOTE_LABELS: Record<VoteOption, string> = {
  afavor: 'A favor',
  contra: 'En contra',
  abstencion: 'Abstención',
  pareo: 'Pareo',
  ausente: 'No votó',
};

const VOTE_COLORS: Record<VoteOption, string> = {
  afavor: 'bg-green-100 text-green-800',
  contra: 'bg-red-100 text-red-800',
  abstencion: 'bg-amber-100 text-amber-800',
  pareo: 'bg-indigo-100 text-indigo-800',
  ausente: 'bg-gray-200 text-gray-600',
};

const BAR_COLORS: Record<VoteOption, string> = {
  afavor: 'bg-green-500',
  contra: 'bg-red-500',
  abstencion: 'bg-amber-500',
  pareo: 'bg-indigo-500',
  ausente: 'bg-gray-400',
};

export default function VoteCard({ vote, parlVote }: Props) {
  const [expanded, setExpanded] = useState(false);
  const votoLabel = parlVote ? VOTE_LABELS[parlVote] : '—';
  const votoColor = parlVote ? VOTE_COLORS[parlVote] : 'bg-gray-200 text-gray-700';

  const dist = useMemo(() => {
    const counts: Record<VoteOption, number> = { afavor: 0, contra: 0, abstencion: 0, pareo: 0, ausente: 0 };
    for (const v of Object.values(vote.votos)) {
      if (v in counts) counts[v]++;
    }
    const total = Object.values(counts).reduce((a, b) => a + b, 0);
    return { ...counts, total };
  }, [vote.votos]);

  const barOrder: VoteOption[] = ['afavor', 'contra', 'abstencion', 'pareo', 'ausente'];

  return (
    <div
      className={`bg-white rounded-lg border border-gray-200 transition-all cursor-pointer ${
        expanded ? 'shadow-md border-blue-200' : 'hover:shadow-sm'
      }`}
      onClick={() => setExpanded(!expanded)}
    >
      <div className="p-3">
        <div className="flex items-start justify-between gap-3">
          <div className="flex-1 min-w-0">
            <div className="flex flex-wrap gap-1.5 items-center mb-1">
              <span className="text-xs bg-gray-100 text-gray-500 px-1.5 py-0.5 rounded font-mono">
                {vote.fecha}
              </span>
              <span className="text-xs bg-blue-50 text-blue-700 px-1.5 py-0.5 rounded font-medium">
                {vote.chamber === 'senado' ? 'Senado' : 'Cámara'}
              </span>
              <span className="text-xs text-gray-400 font-mono">
                Boletín {vote.boletin}
              </span>
              {vote.relevante && (
                <span className="text-xs bg-amber-100 text-amber-700 px-1.5 py-0.5 rounded font-medium">
                  Destacado
                </span>
              )}
            </div>
            <h3 className="text-sm font-semibold text-gray-900 mb-1 leading-snug">{vote.title}</h3>
            {vote.tags.length > 0 && (
              <div className="flex flex-wrap gap-1 mb-1">
                {vote.tags.map((tag) => (
                  <span key={tag} className={`text-xs px-1.5 py-0.5 rounded-full ${getTagColor(tag)}`}>
                    {getTagLabel(tag)}
                  </span>
                ))}
              </div>
            )}
            {!expanded && vote.descripcion && vote.descripcion.length > 20 && (
              <p className="text-xs text-gray-500 mt-1 line-clamp-2">{vote.descripcion}</p>
            )}
          </div>
          <div className="shrink-0 flex flex-col items-end gap-1">
            {parlVote && (
              <span className={`text-xs px-2.5 py-1 rounded-full font-bold ${votoColor}`}>
                {votoLabel}
              </span>
            )}
            <span className="text-[10px] text-gray-400">
              {expanded ? '▲' : '▼'}
            </span>
          </div>
        </div>
      </div>

      {expanded && (
        <div className="border-t border-gray-100 px-3 pb-3 pt-2" onClick={(e) => e.stopPropagation()}>
          {vote.descripcion && vote.descripcion.length > 20 && (
            <p className="text-sm text-gray-700 mb-3 leading-relaxed">{vote.descripcion}</p>
          )}

          <div className="mb-1 flex items-baseline gap-2">
            <span className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Distribución de votos</span>
            <span className="text-[10px] text-gray-400">{dist.total} parlamentarios</span>
          </div>

          <div className="space-y-1">
            {barOrder.map((key) => (
              <div key={key} className="flex items-center gap-2 text-[11px]">
                <span className="w-16 text-gray-500">{VOTE_LABELS[key]}</span>
                <div className="flex-1 h-4 bg-gray-100 rounded overflow-hidden">
                  <div
                    className={`h-full ${BAR_COLORS[key]} rounded transition-all duration-300`}
                    style={{ width: dist.total ? `${(dist[key] / dist.total) * 100}%` : '0%', minWidth: dist[key] > 0 ? '3px' : 0 }}
                  />
                </div>
                <span className="w-6 text-right font-semibold text-gray-700">{dist[key]}</span>
                <span className="w-8 text-right text-gray-400">
                  {dist.total ? ((dist[key] / dist.total) * 100).toFixed(1) + '%' : '0%'}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
