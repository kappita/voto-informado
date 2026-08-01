interface Props {
  value: string;
  onChange: (value: string) => void;
  onSearch: () => void;
}

export default function BillInput({ value, onChange, onSearch }: Props) {
  return (
    <div className="flex flex-col gap-1 min-w-[150px]">
      <label htmlFor="bill-input" className="text-xs font-semibold text-gray-600">N° de Boletín</label>
      <input
        id="bill-input"
        type="text"
        placeholder="Ej: 17077"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onKeyDown={(e) => e.key === 'Enter' && onSearch()}
        className="py-2.5 px-3 border border-gray-300 rounded-lg text-sm outline-none focus:border-[#0039a6] focus:ring-[3px] focus:ring-[#0039a6]/10 transition-colors"
      />
    </div>
  );
}
