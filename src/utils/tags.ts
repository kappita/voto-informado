import type { Tag } from '../types';

export const TAGS: Tag[] = [
  { id: 'economia',       label: 'Economía',          color: 'bg-blue-100 text-blue-800',      keywords: ['economía', 'económico', 'presupuesto', 'impuesto', 'tributario', 'fiscal', 'financiero', 'banca', 'comercio', 'inversión', 'PYME', 'emprendimiento'] },
  { id: 'seguridad',      label: 'Seguridad',         color: 'bg-red-100 text-red-800',        keywords: ['seguridad', 'delito', 'penal', 'cárcel', 'policía', 'carabineros', 'PDI', 'delincuencia', 'crimen', 'narcotráfico', 'violencia'] },
  { id: 'salud',          label: 'Salud',             color: 'bg-emerald-100 text-emerald-800', keywords: ['salud', 'hospital', 'médico', 'fármaco', 'medicamento', 'enfermedad', 'FONASA', 'isapre', 'vacuna', 'sanitario', 'clínica', 'farmacia'] },
  { id: 'educacion',      label: 'Educación',         color: 'bg-violet-100 text-violet-800',  keywords: ['educación', 'escolar', 'universidad', 'liceo', 'colegio', 'docente', 'profesor', 'estudiante', 'académico', 'jardín infantil', 'CAE', 'gratuidad'] },
  { id: 'medioambiente',  label: 'Medio Ambiente',    color: 'bg-green-100 text-green-800',    keywords: ['ambiental', 'medio ambiente', 'ecología', 'contaminación', 'residuo', 'reciclaje', 'biodiversidad', 'forestal', 'agua', 'glaciar', 'cambio climático', 'sostenible', 'área protegida', 'parque nacional'] },
  { id: 'trabajo',        label: 'Trabajo',           color: 'bg-orange-100 text-orange-800',  keywords: ['trabajo', 'laboral', 'trabajador', 'sindical', 'sindicato', 'salario', 'sueldo', 'pensión', 'jubilación', 'AFP', 'previsional', 'negociación colectiva', 'huelga', 'desempleo'] },
  { id: 'vivienda',       label: 'Vivienda',          color: 'bg-amber-100 text-amber-800',    keywords: ['vivienda', 'habitacional', 'casa', 'departamento', 'arriendo', 'subsidio habitacional', 'campamento', 'urbanismo', 'ciudad', 'territorial'] },
  { id: 'transporte',     label: 'Transporte',        color: 'bg-cyan-100 text-cyan-800',      keywords: ['transporte', 'tránsito', 'ferrocarril', 'tren', 'metro', 'bus', 'carretera', 'autopista', 'aeropuerto', 'portuario', 'marítimo', 'concesión'] },
  { id: 'inmigracion',    label: 'Inmigración',       color: 'bg-pink-100 text-pink-800',      keywords: ['inmigración', 'migración', 'migrante', 'extranjería', 'extranjero', 'frontera', 'refugiado', 'visa', 'residencia'] },
  { id: 'derechos',       label: 'DD.HH.',            color: 'bg-purple-100 text-purple-800',  keywords: ['derecho humano', 'DDHH', 'memoria', 'víctima', 'reparación', 'tortura', 'desaparecido', 'INDH', 'discriminación'] },
  { id: 'justicia',       label: 'Justicia',          color: 'bg-indigo-100 text-indigo-800',  keywords: ['justicia', 'judicial', 'tribunal', 'juez', 'fiscalía', 'defensoría', 'procesal', 'civil', 'corte', 'notarial', 'registro civil', 'condena'] },
  { id: 'defensa',        label: 'Defensa',           color: 'bg-slate-200 text-slate-800',    keywords: ['defensa', 'FFAA', 'militar', 'ejército', 'armada', 'fuerza aérea', 'conscripción', 'reserva', 'inteligencia'] },
  { id: 'energia',        label: 'Energía',           color: 'bg-yellow-100 text-yellow-800',  keywords: ['energía', 'energético', 'eléctrico', 'electricidad', 'combustible', 'petróleo', 'gas', 'renovable', 'solar', 'eólica', 'hidrógeno', 'litio', 'minería', 'cobre'] },
  { id: 'agricultura',    label: 'Agricultura',       color: 'bg-lime-100 text-lime-800',      keywords: ['agricultura', 'agrícola', 'campo', 'rural', 'riego', 'INDAP', 'semilla', 'ganadería', 'pesca', 'acuicultura', 'silvoagropecuario'] },
  { id: 'cultura',        label: 'Cultura',           color: 'bg-rose-100 text-rose-800',      keywords: ['cultura', 'cultural', 'patrimonio', 'arte', 'artista', 'museo', 'biblioteca', 'monumento', 'archivo', 'cine', 'música', 'deporte', 'deportivo'] },
  { id: 'tecnologia',     label: 'Tecnología',        color: 'bg-sky-100 text-sky-800',        keywords: ['tecnología', 'digital', 'internet', 'telecomunicación', 'datos', 'ciberseguridad', 'IA', 'inteligencia artificial', 'innovación', 'conectividad', 'fibra óptica', '5G'] },
  { id: 'descentralizacion', label: 'Descentralización', color: 'bg-teal-100 text-teal-800',   keywords: ['descentralización', 'regional', 'regionalización', 'municipio', 'municipal', 'alcalde', 'gobernador', 'CORES', 'comuna'] },
  { id: 'pueblos',        label: 'Pueblos Originarios', color: 'bg-stone-200 text-stone-800',  keywords: ['indígena', 'pueblo originario', 'mapuche', 'CONADI', 'consulta indígena', 'territorio indígena', 'ancestral', 'convenio 169'] },
  { id: 'genero',         label: 'Género',            color: 'bg-fuchsia-100 text-fuchsia-800', keywords: ['género', 'mujer', 'feminismo', 'igualdad', 'brecha salarial', 'violencia de género', 'femicidio', 'aborto', 'reproductivo', 'diversidad', 'LGBT', 'identidad de género'] },
  { id: 'social',         label: 'Desarrollo Social', color: 'bg-teal-100 text-teal-800',      keywords: ['social', 'pobreza', 'vulnerabilidad', 'subsidio', 'bono', 'asignación', 'protección social', 'familia', 'niñez', 'infancia', 'adulto mayor', 'discapacidad', 'cuidador'] },
  { id: 'tributario',     label: 'Tributario',        color: 'bg-gray-200 text-gray-800',      keywords: ['tributario', 'tributo', 'IVA', 'impuesto', 'renta', 'aduanas', 'evasión', 'elusión', 'SII', 'aduanero'] },
  { id: 'constitucional', label: 'Constitucional',     color: 'bg-gray-200 text-gray-800',      keywords: ['constitución', 'constitucional', 'reforma constitucional', 'plebiscito', 'constituyente', 'reglamento', 'ley orgánica', 'quorum'] },
  { id: 'transparencia',  label: 'Transparencia',     color: 'bg-gray-200 text-gray-800',      keywords: ['transparencia', 'probidad', 'corrupción', 'lobby', 'acceso a la información', 'fiscalización', 'contraloría'] },
];

const tagMap = new Map<Tag['id'], Tag>();
TAGS.forEach((t) => tagMap.set(t.id, t));

export function getTag(id: Tag['id']): Tag {
  return tagMap.get(id) ?? TAGS[TAGS.length - 1];
}

export function classifyTags(text: string): Tag['id'][] {
  const lower = text.toLowerCase();
  const tags: Tag['id'][] = [];
  for (const tag of TAGS) {
    if (tag.keywords.some((kw) => lower.includes(kw))) {
      tags.push(tag.id);
    }
  }
  return tags.length ? tags : ['otro' as Tag['id']];
}

export function getTagColor(id: Tag['id']): string {
  return getTag(id).color;
}

export function getTagLabel(id: Tag['id']): string {
  return getTag(id).label;
}
