import type { Chamber } from '../types';

interface Props {
  chamber: Chamber;
  onChange: (chamber: Chamber) => void;
}

export default function ChamberToggle({ chamber, onChange }: Props) {
  const base = 'flex-1 py-2.5 px-4 border-none cursor-pointer text-sm font-semibold transition-colors';
  const active = 'bg-[#0039a6] text-white';
  const inactive = 'bg-white text-[#0039a6] hover:bg-blue-50';

  return (
    <div className="flex rounded-lg overflow-hidden border-2 border-[#0039a6] mb-5" role="group">
      <button className={`${base} ${chamber === 'senado' ? active : inactive}`} onClick={() => onChange('senado')}>
        Senado
      </button>
      <button className={`${base} ${chamber === 'camara' ? active : inactive}`} onClick={() => onChange('camara')}>
        Cámara de Diputados
      </button>
    </div>
  );
}
