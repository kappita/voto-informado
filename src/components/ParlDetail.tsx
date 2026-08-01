import { useState, useMemo } from 'react';
import type { Parliamentarian, VotingRecord, TagId, ParlStats } from '../types';
import VoteSummary from './VoteSummary';
import TagFilter from './TagFilter';
import VoteCard from './VoteCard';

interface Props {
  parliamentarian: Parliamentarian;
  allVotes: VotingRecord[];
  onBack: () => void;
}

export default function ParlDetail({ parliamentarian, allVotes, onBack }: Props) {
  const [filterTags, setFilterTags] = useState<TagId[]>([]);

  const parlVotes = useMemo(() => {
    return allVotes
      .filter((v) => v.votos[parliamentarian.id])
      .map((v) => ({
        vote: v,
        myVote: v.votos[parliamentarian.id],
      }));
  }, [allVotes, parliamentarian.id]);

  const filteredVotes = useMemo(() => {
    if (!filterTags.length) return parlVotes;
    return parlVotes.filter(({ vote }) =>
      filterTags.some((tag) => vote.tags.includes(tag))
    );
  }, [parlVotes, filterTags]);

  const stats = useMemo<ParlStats>(() => {
    const base = { total: 0, afavor: 0, contra: 0, abstencion: 0, pareo: 0, ausente: 0 };
    for (const { myVote } of parlVotes) {
      base.total++;
      if (myVote.voto in base) (base as any)[myVote.voto]++;
    }
    return base;
  }, [parlVotes]);

  const availableTags = useMemo(() => {
    const set = new Set<TagId>();
    for (const { vote } of parlVotes) {
      vote.tags.forEach((t) => set.add(t));
    }
    return [...set];
  }, [parlVotes]);

  const filteredStats = useMemo<ParlStats>(() => {
    const base = { total: 0, afavor: 0, contra: 0, abstencion: 0, pareo: 0, ausente: 0 };
    for (const { myVote } of filteredVotes) {
      base.total++;
      if (myVote.voto in base) (base as any)[myVote.voto]++;
    }
    return base;
  }, [filteredVotes]);

  return (
    <section>
      <button
        onClick={onBack}
        className="mb-4 text-sm text-[#0039a6] hover:underline font-medium inline-flex items-center gap-1"
      >
        ← Volver al listado
      </button>

      <div className="bg-white rounded-lg border border-gray-200 p-4 mb-4">
        <h2 className="text-xl font-bold">{parliamentarian.fullName}</h2>
        <div className="flex flex-wrap gap-2 mt-1.5">
          {parliamentarian.party && <span className="text-sm text-gray-600">{parliamentarian.party}</span>}
          {parliamentarian.region && <span className="text-sm text-gray-500">{parliamentarian.region}</span>}
          <span className="text-sm bg-[#0039a6]/10 text-[#0039a6] px-2 py-0.5 rounded font-medium">
            {parliamentarian.chamber === 'senado' ? 'Senador' : 'Diputado'}
          </span>
        </div>
      </div>

      <VoteSummary stats={filterTags.length ? filteredStats : stats} />

      <TagFilter selected={filterTags} onChange={setFilterTags} availableTags={availableTags} />

      {filteredVotes.length === 0 ? (
        <div className="text-center py-12 text-gray-500">
          {parlVotes.length === 0
            ? 'No se encontraron votaciones para este parlamentario en los datos disponibles.'
            : 'No hay votaciones con los filtros seleccionados.'}
        </div>
      ) : (
        <div className="space-y-2">
          <p className="text-xs text-gray-500 mb-1">
            {filteredVotes.length} de {parlVotes.length} votación{parlVotes.length !== 1 ? 'es' : ''}
            {filterTags.length ? ' (filtrada' + (filterTags.length > 1 ? 's' : '') + ')' : ''}
          </p>
          {filteredVotes.map(({ vote, myVote }) => (
            <VoteCard key={vote.id} vote={vote} parlVote={myVote} />
          ))}
        </div>
      )}
    </section>
  );
}
