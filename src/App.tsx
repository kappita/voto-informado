import { useState, useEffect, useRef, useCallback } from 'react';
import Header from './components/Header';
import Footer from './components/Footer';
import LoadingOverlay from './components/LoadingOverlay';
import ErrorBanner from './components/ErrorBanner';
import ParlList from './components/ParlList';
import ParlDetail from './components/ParlDetail';
import YearFilter from './components/YearFilter';
import type { Parliamentarian, VotingRecord } from './types';

type View = 'list' | 'detail';

export default function App() {
  const [view, setView] = useState<View>('list');
  const [parliamentarians, setParliamentarians] = useState<Parliamentarian[]>([]);
  const [votes, setVotes] = useState<VotingRecord[]>([]);
  const [selectedParl, setSelectedParl] = useState<Parliamentarian | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const [availableYears, setAvailableYears] = useState<number[]>([]);
  const [yearMin, setYearMin] = useState(0);
  const [yearMax, setYearMax] = useState(0);

  const voteCache = useRef<Map<string, VotingRecord[]>>(new Map());

  useEffect(() => {
    (async () => {
      setLoading(true);
      try {
        const [parlResp, indexResp] = await Promise.all([
          fetch('./data/parliamentarians.json'),
          fetch('./data/index.json'),
        ]);

        if (!parlResp.ok || !indexResp.ok) {
          setError('No se encontraron los datos. Ejecutá npm run fetch-data primero.');
          setLoading(false);
          return;
        }

        const parlData = await parlResp.json();
        const parls: Parliamentarian[] = [
          ...(parlData.senado || []).map((p: any) => ({ ...p, chamber: 'senado' as const })),
          ...(parlData.camara || []).map((p: any) => ({ ...p, chamber: 'camara' as const })),
        ];
        setParliamentarians(parls);

        const indexData = await indexResp.json();
        const years = Object.keys(indexData.years).map(Number).sort((a: number, b: number) => a - b);
        setAvailableYears(years);

        const last4 = years.slice(-4);
        const min = last4[0] || years[0];
        const max = last4[last4.length - 1] || years[years.length - 1];
        setYearMin(min);
        setYearMax(max);

        await loadYears(min, max, indexData.years);
      } catch (e) {
        console.error(e);
        setError('Error al cargar los datos.');
      } finally {
        setLoading(false);
      }
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const loadYears = useCallback(async (min: number, max: number, years: Record<string, Record<string, number>>) => {
    const fetches: Promise<void>[] = [];
    for (let y = min; y <= max; y++) {
      const year = String(y);
      if (!years[year]) continue;
      for (const ch of ['senado', 'camara'] as const) {
        if (!years[year][ch]) continue;
        const key = `${ch}-${year}`;
        if (voteCache.current.has(key)) continue;
        fetches.push((async () => {
          const resp = await fetch(`./data/${ch}/${year}.json`);
          if (resp.ok) {
            const data = await resp.json();
            voteCache.current.set(key, data);
          }
        })());
      }
    }
    if (fetches.length) {
      setLoading(true);
      await Promise.all(fetches);
      const all: VotingRecord[] = [];
      voteCache.current.forEach((v) => all.push(...v));
      setVotes(all);
      setLoading(false);
    }
  }, []);

  function handleYearChange(min: number, max: number) {
    setYearMin(min);
    setYearMax(max);
    fetch('./data/index.json')
      .then(r => r.json())
      .then(idx => loadYears(min, max, idx.years));
  }

  function handleSelectParl(parl: Parliamentarian) {
    setSelectedParl(parl);
    setView('detail');
  }

  function handleBack() {
    setView('list');
    setSelectedParl(null);
  }

  const hasData = parliamentarians.length > 0;

  return (
    <div className="min-h-screen flex flex-col bg-gray-50 text-gray-900">
      <Header />
      <main className="max-w-[1100px] mx-auto w-full px-6 py-6 flex-1">
        <ErrorBanner message={error} />

        {availableYears.length > 0 && (
          <div className="mb-4 flex items-center justify-between flex-wrap gap-3">
            <YearFilter
              minYear={yearMin}
              maxYear={yearMax}
              availableYears={availableYears}
              onChange={handleYearChange}
            />
            <span className="text-xs text-gray-500">
              {votes.length.toLocaleString()} votaciones cargadas
            </span>
          </div>
        )}

        {view === 'detail' && selectedParl ? (
          <ParlDetail
            parliamentarian={selectedParl}
            allVotes={votes}
            onBack={handleBack}
          />
        ) : (
          <>
            <div className="mb-4">
              <h2 className="text-lg font-bold text-gray-900">Parlamentarios</h2>
              <p className="text-sm text-gray-500">Seleccioná un senador o diputado para ver su historial de votaciones</p>
            </div>
            {hasData ? (
              <ParlList parliamentarians={parliamentarians} onSelect={handleSelectParl} />
            ) : !error ? (
              <div className="text-center py-12 text-gray-500">Cargando datos...</div>
            ) : null}
          </>
        )}
      </main>
      <Footer />
      <LoadingOverlay show={loading} />
    </div>
  );
}
