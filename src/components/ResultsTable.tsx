import type { VoteRow } from '../types';

function VoteBadge({ cls, label }: { cls: VoteRow['cls']; label: string }) {
  const colors: Record<VoteRow['cls'], string> = {
    afavor: 'bg-green-100 text-green-800',
    contra: 'bg-red-100 text-red-800',
    abstencion: 'bg-amber-100 text-amber-800',
    pareo: 'bg-indigo-100 text-indigo-800',
    other: 'bg-gray-200 text-gray-700',
  };
  return (
    <span className={`inline-block px-2.5 py-1 rounded-full text-xs font-bold ${colors[cls]}`}>
      {label}
    </span>
  );
}

interface Props {
  rows: VoteRow[];
  title: string;
}

export default function ResultsTable({ rows, title }: Props) {
  if (!rows.length) {
    return (
      <section className="mt-6">
        <div className="text-center py-8 text-gray-500"><p>No se encontraron votaciones para este boletín.</p></div>
      </section>
    );
  }

  return (
    <section className="mt-6">
      <div className="flex items-center gap-3 mb-3">
        <h2 className="text-xl font-semibold">{title || 'Votaciones'}</h2>
        <span className="bg-[#0039a6] text-white px-2.5 py-0.5 rounded-full text-xs font-semibold">
          {rows.length} registro{rows.length !== 1 ? 's' : ''}
        </span>
      </div>
      <div className="overflow-x-auto bg-white rounded-lg shadow-sm">
        <table className="w-full border-collapse text-sm">
          <thead className="bg-gray-100">
            <tr>
              <th className="py-3 px-3.5 text-left font-bold text-xs text-gray-600 uppercase tracking-wide whitespace-nowrap">Fecha</th>
              <th className="py-3 px-3.5 text-left font-bold text-xs text-gray-600 uppercase tracking-wide whitespace-nowrap">Boletín</th>
              <th className="py-3 px-3.5 text-left font-bold text-xs text-gray-600 uppercase tracking-wide whitespace-nowrap">Materia / Descripción</th>
              <th className="py-3 px-3.5 text-left font-bold text-xs text-gray-600 uppercase tracking-wide whitespace-nowrap">Parlamentario</th>
              <th className="py-3 px-3.5 text-left font-bold text-xs text-gray-600 uppercase tracking-wide whitespace-nowrap">Voto</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r, i) => (
              <tr key={i} className="border-t border-gray-200 hover:bg-gray-50">
                <td className="py-2.5 px-3.5 align-top">{r.fecha || '\u2014'}</td>
                <td className="py-2.5 px-3.5 align-top font-semibold">{r.boletin || '\u2014'}</td>
                <td className="py-2.5 px-3.5 align-top">{r.materia || '\u2014'}</td>
                <td className="py-2.5 px-3.5 align-top">{r.parlName || '\u2014'}</td>
                <td className="py-2.5 px-3.5 align-top"><VoteBadge cls={r.cls} label={r.label} /></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}
