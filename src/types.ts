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

export interface Tag {
  id: TagId;
  label: string;
  color: string;
  keywords: string[];
}

export type VoteOption = 'afavor' | 'contra' | 'abstencion' | 'pareo' | 'ausente';

export interface ParlVote {
  parlId: string;
  nombre: string;
  voto: VoteOption;
  partido?: string;
}

export interface VotingRecord {
  id: string;
  boletin: string;
  fecha: string;
  chamber: Chamber;
  materia: string;
  descripcion: string;
  tags: TagId[];
  votos: Record<string, ParlVote>;
}

export interface VotesData {
  generatedAt: string;
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
