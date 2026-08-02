import { useMemo } from 'react';

interface Props {
  minYear: number;
  maxYear: number;
  availableYears: number[];
  onChange: (min: number, max: number) => void;
}

export default function YearFilter({ minYear, maxYear, availableYears, onChange }: Props) {
  const years = useMemo(() => {
    const sorted = [...availableYears].sort((a, b) => a - b);
    return sorted;
  }, [availableYears]);

  if (!years.length) return null;

  return (
    <div className="flex items-center gap-3 text-sm">
      <span className="text-xs text-gray-500 font-medium whitespace-nowrap">Años:</span>
      <select
        value={minYear}
        onChange={(e) => onChange(Number(e.target.value), maxYear)}
        className="py-1.5 px-2 border border-gray-300 rounded text-xs outline-none focus:border-[#0039a6]"
      >
        {years.map((y) => (
          <option key={y} value={y} disabled={y > maxYear}>{y}</option>
        ))}
      </select>
      <span className="text-gray-400">–</span>
      <select
        value={maxYear}
        onChange={(e) => onChange(minYear, Number(e.target.value))}
        className="py-1.5 px-2 border border-gray-300 rounded text-xs outline-none focus:border-[#0039a6]"
      >
        {years.map((y) => (
          <option key={y} value={y} disabled={y < minYear}>{y}</option>
        ))}
      </select>
      <button
        onClick={() => onChange(years[0], years[years.length - 1])}
        className="text-xs text-[#0039a6] hover:underline whitespace-nowrap ml-1"
      >
        Todos
      </button>
    </div>
  );
}
