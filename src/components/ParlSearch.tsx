import { useState, useRef, useEffect, useCallback } from 'react';
import type { Parliamentarian, Chamber } from '../types';

interface Props {
  value: string;
  onChange: (value: string) => void;
  onSelect: (parl: Parliamentarian | null) => void;
  onSearch: () => void;
  parliamentarians: Parliamentarian[];
  chamber: Chamber;
}

export default function ParlSearch({ value, onChange, onSelect, parliamentarians, chamber, onSearch }: Props) {
  const [suggestions, setSuggestions] = useState<Parliamentarian[]>([]);
  const [show, setShow] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const selectingRef = useRef(false);

  const list = parliamentarians.filter((p) => p.chamber === chamber);
  const count = list.length;

  useEffect(() => {
    function handleMouseDown(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setShow(false);
      }
    }
    document.addEventListener('mousedown', handleMouseDown);
    return () => document.removeEventListener('mousedown', handleMouseDown);
  }, []);

  const filter = useCallback((q: string) => {
    if (!q || selectingRef.current) {
      selectingRef.current = false;
      return;
    }
    const query = q.toLowerCase().trim();
    if (!query) {
      setSuggestions([]);
      setShow(false);
      return;
    }
    const matches = list.filter((p) =>
      p.fullName.toLowerCase().includes(query) || p.lastName.toLowerCase().includes(query)
    ).slice(0, 15);
    setSuggestions(matches);
    setShow(matches.length > 0);
  }, [list]);

  function handleInputChange(e: React.ChangeEvent<HTMLInputElement>) {
    const val = e.target.value;
    onChange(val);
    if (!val) onSelect(null);
    filter(val);
  }

  function handleSelect(p: Parliamentarian) {
    selectingRef.current = true;
    onSelect(p);
    onChange(p.fullName);
    setSuggestions([]);
    setShow(false);
  }

  return (
    <div className="flex flex-col gap-1 flex-1 min-w-[220px] relative" ref={ref}>
      <label htmlFor="parl-search" className="text-xs font-semibold text-gray-600">
        Filtrar por parlamentario (opcional)
      </label>
      <input
        id="parl-search"
        type="text"
        placeholder={parliamentarians.length ? `Escribí un nombre (${count} parlamentarios)` : 'Cargando...'}
        value={value}
        disabled={!parliamentarians.length}
        onChange={handleInputChange}
        onFocus={() => { if (value) filter(value); }}
        onKeyDown={(e) => { if (e.key === 'Enter') { setShow(false); onSearch(); } }}
        className="py-2.5 px-3 border border-gray-300 rounded-lg text-sm outline-none focus:border-[#0039a6] focus:ring-[3px] focus:ring-[#0039a6]/10 transition-colors disabled:bg-gray-100"
      />
      {show && suggestions.length > 0 && (
        <div className="absolute top-full left-0 right-0 bg-white border border-gray-200 rounded-lg max-h-56 overflow-y-auto z-10 shadow-md mt-0.5">
          {suggestions.map((p) => (
            <button
              key={p.chamber + '-' + p.id}
              type="button"
              className="w-full text-left py-2 px-3 cursor-pointer text-sm border-b border-gray-100 last:border-b-0 hover:bg-blue-50 transition-colors"
              onClick={() => handleSelect(p)}
            >
              <strong>{p.fullName}</strong>
              {p.party && <span className="text-xs text-gray-500 ml-1.5">({p.party})</span>}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
