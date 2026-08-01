import { useState, useEffect } from 'react';
import Header from './components/Header';
import Footer from './components/Footer';
import LoadingOverlay from './components/LoadingOverlay';
import ErrorBanner from './components/ErrorBanner';
import ParlList from './components/ParlList';
import ParlDetail from './components/ParlDetail';
import { loadSenators, loadDeputies, loadVotesData } from './api';
import type { Parliamentarian, VotingRecord } from './types';

type View = 'list' | 'detail';

export default function App() {
  const [view, setView] = useState<View>('list');
  const [parliamentarians, setParliamentarians] = useState<Parliamentarian[]>([]);
  const [votes, setVotes] = useState<VotingRecord[]>([]);
  const [selectedParl, setSelectedParl] = useState<Parliamentarian | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    (async () => {
      setLoading(true);
      try {
        const [data, senators, deputies] = await Promise.all([
          loadVotesData(),
          loadSenators(),
          loadDeputies(),
        ]);

        const parls = [...senators, ...deputies];

        if (data) {
          setVotes(data.votes);
          if (data.parliamentarians) {
            const apiParls = new Map(parls.map((p) => [`${p.chamber}-${p.id}`, p]));
            for (const ch of ['senado', 'camara'] as const) {
              const list = data.parliamentarians[ch];
              if (list) {
                for (const p of list) {
                  if (!apiParls.has(`${p.chamber}-${p.id}`)) {
                    parls.push(p as Parliamentarian);
                  }
                }
              }
            }
          }
        } else {
          setError('No se encontraron datos de votaciones. Ejecutá `node scripts/fetch-votes.mjs` para generarlos.');
        }

        setParliamentarians(parls);
      } catch (e) {
        console.error(e);
        setError('Error al cargar datos. Si estás en local, ejecutá `node scripts/fetch-votes.mjs`. Si estás en producción, verificá el proxy CORS.');
      } finally {
        setLoading(false);
      }
    })();
  }, []);

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
              <div className="text-center py-12 text-gray-500">Cargando parlamentarios...</div>
            ) : null}
          </>
        )}
      </main>
      <Footer />
      <LoadingOverlay show={loading} />
    </div>
  );
}
