import type { VotingRecord } from '../types';
import { getTagColor, getTagLabel } from '../utils/tags';

interface Props {
  vote: VotingRecord;
  parlVote: { voto: string; partido?: string } | undefined;
}

const VOTE_LABELS: Record<string, string> = {
  afavor: 'A favor',
  contra: 'En contra',
  abstencion: 'Abstención',
  pareo: 'Pareo',
  ausente: 'No votó',
};

const VOTE_COLORS: Record<string, string> = {
  afavor: 'bg-green-100 text-green-800',
  contra: 'bg-red-100 text-red-800',
  abstencion: 'bg-amber-100 text-amber-800',
  pareo: 'bg-indigo-100 text-indigo-800',
  ausente: 'bg-gray-200 text-gray-600',
};

export default function VoteCard({ vote, parlVote }: Props) {
  const votoLabel = parlVote ? VOTE_LABELS[parlVote.voto] || parlVote.voto : '—';
  const votoColor = parlVote ? VOTE_COLORS[parlVote.voto] || 'bg-gray-200 text-gray-700' : 'bg-gray-200 text-gray-700';

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-3 hover:shadow-sm transition-shadow">
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
          </div>
          <h3 className="text-sm font-semibold text-gray-900 mb-1 leading-snug">{vote.materia}</h3>
          {vote.tags.length > 0 && (
            <div className="flex flex-wrap gap-1 mb-2">
              {vote.tags.map((tag) => (
                <span key={tag} className={`text-xs px-1.5 py-0.5 rounded-full ${getTagColor(tag)}`}>
                  {getTagLabel(tag)}
                </span>
              ))}
            </div>
          )}
        </div>
        {parlVote && (
          <span className={`shrink-0 text-xs px-2.5 py-1 rounded-full font-bold ${votoColor}`}>
            {votoLabel}
          </span>
        )}
      </div>
    </div>
  );
}
