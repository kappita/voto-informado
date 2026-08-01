import type { TagId } from '../types';
import { TAGS } from '../utils/tags';

interface Props {
  selected: TagId[];
  onChange: (tags: TagId[]) => void;
  availableTags: TagId[];
}

export default function TagFilter({ selected, onChange, availableTags }: Props) {
  const tags = TAGS.filter((t) => availableTags.includes(t.id));

  if (!tags.length) return null;

  function toggle(tag: TagId) {
    if (selected.includes(tag)) {
      onChange(selected.filter((t) => t !== tag));
    } else {
      onChange([...selected, tag]);
    }
  }

  return (
    <div className="flex flex-wrap gap-1.5 mb-3">
      <span className="text-xs text-gray-500 self-center mr-1">Filtrar:</span>
      {tags.map((tag) => {
        const active = selected.includes(tag.id);
        return (
          <button
            key={tag.id}
            onClick={() => toggle(tag.id)}
            className={`text-xs px-2.5 py-1 rounded-full font-medium transition-all ${
              active ? tag.color + ' ring-2 ring-offset-1 ring-current' : 'bg-gray-100 text-gray-500 hover:bg-gray-200'
            }`}
          >
            {tag.label}
          </button>
        );
      })}
      {selected.length > 0 && (
        <button
          onClick={() => onChange([])}
          className="text-xs px-2 py-1 text-red-600 hover:underline"
        >
          Limpiar filtros
        </button>
      )}
    </div>
  );
}
