import type { Parliamentarian, VotingRecord, VotesData } from './types';
import { classifyTags } from './utils/tags';

const isDev = import.meta.env.DEV;

const WORKER_URL = 'https://votoinformado.workers.dev/?url=';

const API_DEV = {
  SENATORS: '/api/senado/senadores_vigentes.php',
  DEPUTIES: '/api/camara/wscamaradiputados.asmx/getDiputados_Vigentes',
  SENATE_VOTES: '/api/senado/votaciones.php',
  CHAMBER_VOTES: '/api/camara/wscamaradiputados.asmx/getVotaciones_Boletin',
} as const;

const API_PROD = {
  SENATORS: 'https://tramitacion.senado.cl/wspublico/senadores_vigentes.php',
  DEPUTIES: 'https://opendata.camara.cl/wscamaradiputados.asmx/getDiputados_Vigentes',
  SENATE_VOTES: 'https://tramitacion.senado.cl/wspublico/votaciones.php',
  CHAMBER_VOTES: 'https://opendata.camara.cl/wscamaradiputados.asmx/getVotaciones_Boletin',
} as const;

const API = isDev ? API_DEV : API_PROD;

function proxyUrl(url: string): string {
  if (isDev) return url;
  return WORKER_URL + encodeURIComponent(url);
}

function xmlToDoc(str: string): Document {
  return new DOMParser().parseFromString(str, 'text/xml');
}

function norm(text: string | null | undefined): string {
  if (!text) return '';
  return text.normalize('NFC').replace(/\s+/g, ' ').trim();
}

async function fetchXML(url: string, method: 'GET' | 'POST' = 'GET', body?: string): Promise<Document> {
  const opts: RequestInit = { method };
  if (body) {
    opts.headers = { 'Content-Type': 'application/x-www-form-urlencoded' };
    opts.body = body;
  }
  const resp = await fetch(proxyUrl(url), opts);
  if (!resp.ok) throw new Error(`HTTP ${resp.status}`);
  return xmlToDoc(await resp.text());
}

export async function loadSenators(): Promise<Parliamentarian[]> {
  const doc = await fetchXML(API.SENATORS);
  return Array.from(doc.querySelectorAll('senador')).map((n) => {
    const nombre = norm(n.querySelector('PARLNOMBRE')?.textContent);
    const ap = norm(n.querySelector('PARLAPELLIDOPATERNO')?.textContent);
    const am = norm(n.querySelector('PARLAPELLIDOMATERNO')?.textContent);
    return {
      id: norm(n.querySelector('PARLID')?.textContent),
      name: nombre,
      lastName: ap,
      secondLastName: am,
      party: norm(n.querySelector('PARTIDO')?.textContent),
      region: norm(n.querySelector('REGION')?.textContent),
      fullName: [nombre, ap, am].filter(Boolean).join(' '),
      chamber: 'senado' as const,
    };
  });
}

export async function loadDeputies(): Promise<Parliamentarian[]> {
  const doc = await fetchXML(API.DEPUTIES);
  return Array.from(doc.querySelectorAll('Diputado')).map((n) => {
    const nombre = norm(n.querySelector('Nombre')?.textContent);
    const ap = norm(n.querySelector('Apellido_Paterno')?.textContent);
    const am = norm(n.querySelector('Apellido_Materno')?.textContent);
    return {
      id: norm(n.querySelector('DIPID')?.textContent),
      name: nombre,
      lastName: ap,
      secondLastName: am,
      fullName: [nombre, ap, am].filter(Boolean).join(' '),
      chamber: 'camara' as const,
    };
  });
}

function classifyVote(raw: string) {
  const v = raw.toLowerCase().trim();
  if (/favor|si|sí|afirmativo/.test(v)) return 'afavor' as const;
  if (/contra|no|negativo/.test(v)) return 'contra' as const;
  if (/absten/.test(v)) return 'abstencion' as const;
  if (/pareo/.test(v)) return 'pareo' as const;
  if (/no vota|ausente|no asiste/.test(v)) return 'ausente' as const;
  return 'ausente' as const;
}

export async function fetchSenateVotes(bill: string): Promise<VotingRecord[]> {
  let doc: Document;
  try {
    doc = await fetchXML(`${API.SENATE_VOTES}?boletin=${encodeURIComponent(bill)}`);
  } catch {
    doc = await fetchXML(API.SENATE_VOTES, 'POST', `boletin=${encodeURIComponent(bill)}`);
  }
  const records: VotingRecord[] = [];
  doc.querySelectorAll('votacion').forEach((vot) => {
    const fecha = norm(vot.querySelector('fecha')?.textContent || vot.querySelector('FECHA')?.textContent);
    const materia = norm(vot.querySelector('materia')?.textContent || vot.querySelector('MATERIA')?.textContent) || `Boletín ${bill}`;
    const votos: VotingRecord['votos'] = {};
    vot.querySelectorAll('senador').forEach((s) => {
      const nombre = norm(s.querySelector('PARLNOMBRE')?.textContent || s.querySelector('NOMBRE')?.textContent);
      const ap = norm(s.querySelector('PARLAPELLIDOPATERNO')?.textContent || s.querySelector('APELLIDO')?.textContent);
      const am = norm(s.querySelector('PARLAPELLIDOMATERNO')?.textContent || '');
      const voto = norm(s.querySelector('VOTO')?.textContent || s.querySelector('voto')?.textContent);
      const parlId = norm(s.querySelector('PARLID')?.textContent || s.querySelector('ID')?.textContent);
      votos[parlId] = {
        parlId,
        nombre: [nombre, ap, am].filter(Boolean).join(' '),
        voto: classifyVote(voto),
      };
    });
    if (Object.keys(votos).length) {
      records.push({
        id: `senado-${bill}-${fecha}`,
        boletin: bill,
        fecha,
        chamber: 'senado',
        materia,
        descripcion: materia,
        tags: classifyTags(materia),
        votos,
      });
    }
  });
  return records;
}

export async function fetchChamberVotes(bill: string): Promise<VotingRecord[]> {
  let doc: Document;
  try {
    doc = await fetchXML(`${API.CHAMBER_VOTES}?txtBoletin=${encodeURIComponent(bill)}`);
  } catch {
    doc = await fetchXML(API.CHAMBER_VOTES, 'POST', `txtBoletin=${encodeURIComponent(bill)}`);
  }
  const records: VotingRecord[] = [];
  doc.querySelectorAll('Votacion').forEach((vot) => {
    const fecha = norm(vot.querySelector('Fecha')?.textContent);
    const materia = norm(vot.querySelector('Materia')?.textContent) || `Boletín ${bill}`;
    const votos: VotingRecord['votos'] = {};
    vot.querySelectorAll('Diputado, Votante, Parlamentario').forEach((d) => {
      const nombre = norm(d.querySelector('Nombre')?.textContent);
      const ap = norm(d.querySelector('Apellido_Paterno')?.textContent);
      const am = norm(d.querySelector('Apellido_Materno')?.textContent || '');
      const votoRaw = norm(d.querySelector('Voto')?.textContent || d.querySelector('Opcion')?.textContent);
      const parlId = norm(d.querySelector('ID')?.textContent || d.querySelector('DIPID')?.textContent);
      votos[parlId] = {
        parlId,
        nombre: [nombre, ap, am].filter(Boolean).join(' '),
        voto: classifyVote(votoRaw),
      };
    });
    if (Object.keys(votos).length) {
      records.push({
        id: `camara-${bill}-${fecha}`,
        boletin: bill,
        fecha,
        chamber: 'camara',
        materia,
        descripcion: materia,
        tags: classifyTags(materia),
        votos,
      });
    }
  });
  return records;
}

export async function loadVotesData(): Promise<VotesData | null> {
  try {
    const resp = await fetch('./data/index.json');
    if (!resp.ok) return null;
    return resp.json();
  } catch {
    return null;
  }
}
