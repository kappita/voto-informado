export interface Parliamentarian {
  id: string;
  name: string;
  lastName: string;
  secondLastName: string;
  fullName: string;
  party?: string;
  region?: string;
  chamber: 'senado' | 'camara';
}

export type Chamber = 'senado' | 'camara';

export type TagId =
  | 'economia' | 'seguridad' | 'salud' | 'educacion'
  | 'medioambiente' | 'trabajo' | 'vivienda' | 'transporte'
  | 'inmigracion' | 'derechos' | 'justicia' | 'defensa'
  | 'energia' | 'agricultura' | 'cultura' | 'tecnologia'
  | 'descentralizacion' | 'pueblos' | 'genero' | 'social'
  | 'tributario' | 'constitucional' | 'transparencia' | 'otro';

export type VoteOption = 'afavor' | 'contra' | 'abstencion' | 'pareo' | 'ausente';

export interface VotingRecord {
  id: string;
  boletin: string;
  fecha: string;
  chamber: Chamber;
  materia: string;
  descripcion: string;
  tags: TagId[];
  votos: Record<string, VoteOption>;
}

export interface VotesData {
  generatedAt: string;
  parliamentarians: { senado: Parliamentarian[]; camara: Parliamentarian[] };
  votes: VotingRecord[];
}

export interface ParlStats {
  total: number;
  afavor: number;
  contra: number;
  abstencion: number;
  pareo: number;
  ausente: number;
}
