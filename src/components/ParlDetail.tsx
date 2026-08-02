import { useState, useMemo } from 'react';
import type { Parliamentarian, VotingRecord, TagId, ParlStats, VoteOption } from '../types';
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
  const [onlyRelevant, setOnlyRelevant] = useState(false);

  const parlVotes = useMemo(() => {
    const parseDate = (fecha: string) => {
      const m = fecha.match(/^(\d{2})\/(\d{2})\/(\d{4})$/);
      if (m) return new Date(`${m[3]}-${m[2]}-${m[1]}`).getTime();
      return new Date(fecha).getTime();
    };
    return allVotes
      .filter((v) => parliamentarian.id in v.votos)
      .map((v) => ({
        vote: v,
        myVote: v.votos[parliamentarian.id] as VoteOption,
      }))
      .sort((a, b) => parseDate(b.vote.fecha) - parseDate(a.vote.fecha));
  }, [allVotes, parliamentarian.id]);

  const filteredVotes = useMemo(() => {
    let result = parlVotes;
    if (onlyRelevant) {
      result = result.filter(({ vote }) => vote.relevante);
    }
    if (filterTags.length) {
      result = result.filter(({ vote }) =>
        filterTags.some((tag) => vote.tags.includes(tag))
      );
    }
    return result;
  }, [parlVotes, filterTags, onlyRelevant]);

  const stats = useMemo<ParlStats>(() => {
    const base: ParlStats = { total: 0, afavor: 0, contra: 0, abstencion: 0, pareo: 0, ausente: 0 };
    for (const { myVote } of parlVotes) {
      base.total++;
      if (myVote in base) base[myVote]++;
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
    const base: ParlStats = { total: 0, afavor: 0, contra: 0, abstencion: 0, pareo: 0, ausente: 0 };
    for (const { myVote } of filteredVotes) {
      base.total++;
      if (myVote in base) base[myVote]++;
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
          {parliamentarian.district && <span className="text-sm text-gray-500">{parliamentarian.district}</span>}
          {parliamentarian.region && !parliamentarian.district && <span className="text-sm text-gray-500">{parliamentarian.region}</span>}
          <span className="text-sm bg-[#0039a6]/10 text-[#0039a6] px-2 py-0.5 rounded font-medium">
            {parliamentarian.chamber === 'senado' ? 'Senador' : 'Diputado'}
          </span>
        </div>
      </div>

      <VoteSummary stats={filterTags.length || onlyRelevant ? filteredStats : stats} />

      <TagFilter selected={filterTags} onChange={setFilterTags} availableTags={availableTags} />

      <div className="flex items-center gap-3 mb-1 flex-wrap">
        <label className="inline-flex items-center gap-2 text-sm cursor-pointer select-none">
          <input
            type="checkbox"
            checked={onlyRelevant}
            onChange={(e) => setOnlyRelevant(e.target.checked)}
            className="w-4 h-4 text-[#0039a6] border-gray-300 rounded focus:ring-[#0039a6]"
          />
          <span className="text-gray-700">Solo destacados</span>
        </label>
        {onlyRelevant && (
          <span className="text-xs text-amber-700 bg-amber-50 px-2 py-0.5 rounded">
            {filteredVotes.length} de {parlVotes.length} votaciones relevantes
          </span>
        )}
      </div>

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
            {onlyRelevant ? ' (solo destacadas)' : ''}
          </p>
          {filteredVotes.map(({ vote, myVote }) => (
            <VoteCard key={vote.id} vote={vote} parlVote={myVote} />
          ))}
        </div>
      )}
    </section>
  );
}
