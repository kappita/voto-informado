/**
 * Data pipeline — fetches voting data from Chilean Congress APIs and saves as JSON.
 *
 * Usage: npm run fetch-data
 * Output: public/data/index.json
 *
 * First run scans boletines 14800–17800 (~10 min).
 * Subsequent runs only scan new boletines.
 */

import { writeFileSync, readFileSync, mkdirSync, existsSync } from 'fs';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';
import { DOMParser } from '@xmldom/xmldom';

const __dirname = dirname(fileURLToPath(import.meta.url));
const OUT_DIR = resolve(__dirname, '..', 'public', 'data');
const OUT_FILE = resolve(OUT_DIR, 'index.json');
const STATE_FILE = resolve(OUT_DIR, '.pipeline-state.json');

const SCAN_START = 14800;
const SCAN_END = 18000;

// ── Helpers ─────────────────────────────────────────────────
function fmtDate(d) {
  return `${String(d.getDate()).padStart(2, '0')}/${String(d.getMonth() + 1).padStart(2, '0')}/${d.getFullYear()}`;
}

function fixEntities(xml) {
  return xml.replace(/&([a-z]+);/gi, (m, e) => {
    const map = {
      aacute:'á', eacute:'é', iacute:'í', oacute:'ó', uacute:'ú',
      Aacute:'Á', Eacute:'É', Iacute:'Í', Oacute:'Ó', Uacute:'Ú',
      ntilde:'ñ', Ntilde:'Ñ', agrave:'à', egrave:'è', igrave:'ì',
      nbsp:' ', amp:'&', lt:'<', gt:'>', quot:'"', apos:"'",
      ouml:'ö', uuml:'ü',
    };
    return map[e.toLowerCase()] ?? m;
  });
}

function parseXML(xml) {
  return new DOMParser().parseFromString(fixEntities(xml), 'text/xml');
}

function tagText(el, tag) {
  const nodes = el.getElementsByTagName(tag);
  return nodes.length ? (nodes[0].textContent || '').normalize('NFC').replace(/\s+/g, ' ').trim() : '';
}

function classifyVote(raw) {
  const v = (raw || '').toLowerCase().trim();
  if (/favor|si|sí|afirmativo/.test(v)) return 'afavor';
  if (/contra|no|negativo/.test(v)) return 'contra';
  if (/absten/.test(v)) return 'abstencion';
  if (/pareo/.test(v)) return 'pareo';
  if (/no vota|ausente|no asiste/.test(v)) return 'ausente';
  return 'ausente';
}

// ── Tag classification ─────────────────────────────────────
const TAG_RULES = [
  { id: 'economia',       kw: ['economía', 'económico', 'presupuesto', 'impuesto', 'tributario', 'fiscal', 'financiero', 'banca', 'comercio', 'inversión', 'pyme', 'emprendimiento'] },
  { id: 'seguridad',      kw: ['seguridad', 'delito', 'penal', 'cárcel', 'policía', 'carabineros', 'pdi', 'delincuencia', 'crimen', 'narcotráfico', 'violencia'] },
  { id: 'salud',          kw: ['salud', 'hospital', 'médico', 'fármaco', 'medicamento', 'enfermedad', 'fonasa', 'isapre', 'vacuna', 'sanitario', 'clínica'] },
  { id: 'educacion',      kw: ['educación', 'escolar', 'universidad', 'liceo', 'colegio', 'docente', 'profesor', 'estudiante', 'académico', 'cae', 'gratuidad'] },
  { id: 'medioambiente',  kw: ['ambiental', 'medio ambiente', 'ecología', 'contaminación', 'residuo', 'reciclaje', 'biodiversidad', 'forestal', 'agua', 'glaciar', 'cambio climático', 'sostenible'] },
  { id: 'trabajo',        kw: ['trabajo', 'laboral', 'trabajador', 'sindical', 'sindicato', 'salario', 'sueldo', 'pensión', 'jubilación', 'afp', 'previsional', 'negociación colectiva'] },
  { id: 'vivienda',       kw: ['vivienda', 'habitacional', 'casa', 'departamento', 'arriendo', 'subsidio habitacional', 'campamento', 'urbanismo'] },
  { id: 'transporte',     kw: ['transporte', 'tránsito', 'ferrocarril', 'tren', 'metro', 'bus', 'carretera', 'autopista', 'aeropuerto'] },
  { id: 'inmigracion',    kw: ['inmigración', 'migración', 'migrante', 'extranjería', 'extranjero', 'frontera', 'refugiado', 'visa'] },
  { id: 'derechos',       kw: ['derecho humano', 'ddhh', 'memoria', 'víctima', 'reparación', 'indh', 'discriminación'] },
  { id: 'justicia',       kw: ['justicia', 'judicial', 'tribunal', 'juez', 'fiscalía', 'defensoría', 'procesal', 'corte'] },
  { id: 'defensa',        kw: ['defensa', 'ffaa', 'militar', 'ejército', 'armada', 'fuerza aérea'] },
  { id: 'energia',        kw: ['energía', 'energético', 'eléctrico', 'electricidad', 'combustible', 'petróleo', 'gas', 'renovable', 'solar', 'litio', 'minería'] },
  { id: 'agricultura',    kw: ['agricultura', 'agrícola', 'campo', 'rural', 'riego', 'indap', 'ganadería', 'pesca', 'acuicultura'] },
  { id: 'cultura',        kw: ['cultura', 'cultural', 'patrimonio', 'arte', 'artista', 'museo', 'biblioteca', 'monumento', 'deporte'] },
  { id: 'tecnologia',     kw: ['tecnología', 'digital', 'internet', 'telecomunicación', 'ciberseguridad', 'inteligencia artificial', 'innovación', 'conectividad'] },
  { id: 'descentralizacion', kw: ['descentralización', 'regional', 'regionalización', 'municipio', 'municipal', 'alcalde', 'gobernador'] },
  { id: 'pueblos',        kw: ['indígena', 'pueblo originario', 'mapuche', 'conadi', 'consulta indígena', 'ancestral'] },
  { id: 'genero',         kw: ['género', 'mujer', 'feminismo', 'igualdad', 'brecha salarial', 'violencia de género', 'femicidio', 'aborto', 'lgbt'] },
  { id: 'social',         kw: ['social', 'pobreza', 'vulnerabilidad', 'subsidio', 'bono', 'protección social', 'niñez', 'infancia', 'adulto mayor', 'discapacidad'] },
  { id: 'tributario',     kw: ['tributario', 'tributo', 'iva', 'impuesto', 'renta', 'aduanas', 'evasión', 'elusión', 'sii'] },
  { id: 'constitucional', kw: ['constitución', 'constitucional', 'reforma constitucional', 'plebiscito', 'constituyente', 'ley orgánica'] },
  { id: 'transparencia',  kw: ['transparencia', 'probidad', 'corrupción', 'lobby', 'fiscalización', 'contraloría'] },
];

function classify(text) {
  const lower = (text || '').toLowerCase();
  const tags = [];
  for (const rule of TAG_RULES) {
    if (rule.kw.some((k) => lower.includes(k))) tags.push(rule.id);
  }
  return tags.length ? tags : ['otro'];
}

// ── HTTP ────────────────────────────────────────────────────
async function fetchText(url, opts = {}) {
  const resp = await fetch(url, { headers: { 'User-Agent': 'VotoInformado/1.0' }, ...opts });
  if (!resp.ok) throw new Error(`HTTP ${resp.status}`);
  return resp.text();
}

// ── Parliamentarians ────────────────────────────────────────
async function fetchSenators() {
  const doc = parseXML(await fetchText('https://tramitacion.senado.cl/wspublico/senadores_vigentes.php'));
  return Array.from(doc.getElementsByTagName('senador')).map((n) => {
    const nombre = tagText(n, 'PARLNOMBRE'), ap = tagText(n, 'PARLAPELLIDOPATERNO'), am = tagText(n, 'PARLAPELLIDOMATERNO');
    return { id: tagText(n, 'PARLID'), name: nombre, lastName: ap, secondLastName: am, fullName: [nombre, ap, am].filter(Boolean).join(' '), party: tagText(n, 'PARTIDO'), region: tagText(n, 'REGION'), chamber: 'senado' };
  });
}

async function fetchDeputies() {
  const doc = parseXML(await fetchText('https://opendata.camara.cl/wscamaradiputados.asmx/getDiputados_Vigentes'));
  return Array.from(doc.getElementsByTagName('Diputado')).map((n) => {
    const nombre = tagText(n, 'Nombre'), ap = tagText(n, 'Apellido_Paterno'), am = tagText(n, 'Apellido_Materno');
    return { id: tagText(n, 'DIPID'), name: nombre, lastName: ap, secondLastName: am, fullName: [nombre, ap, am].filter(Boolean).join(' '), chamber: 'camara' };
  });
}

// ── Name matching ───────────────────────────────────────────
let senatorIds = null;
let deputyIds = null;

function buildSenatorMap(senators) {
  senatorIds = new Map();
  for (const s of senators) {
    const key = (s.lastName + ' ' + s.name).toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
    senatorIds.set(key, s.id);
    if (s.secondLastName) {
      const key2 = (s.lastName + ' ' + s.secondLastName + ' ' + s.name).toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
      senatorIds.set(key2, s.id);
    }
  }
}

function matchSenator(name) {
  if (!senatorIds || !name) return null;
  // Name format: "Araya G., Pedro" → lastName=Araya, firstName=Pedro
  const cleaned = name.trim().replace(/\s+/g, ' ');
  const match = cleaned.match(/^(.+?)\s+\w\.?,?\s+(.+)$/);
  if (!match) return null;
  const lastName = match[1];
  const firstName = match[2];
  const key = (lastName + ' ' + firstName).toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
  if (senatorIds.has(key)) return senatorIds.get(key);
  for (const [k, id] of senatorIds) {
    if (k.startsWith(lastName.toLowerCase()) && k.includes(firstName.toLowerCase())) return id;
  }
  return null;
}

// ── Votes ───────────────────────────────────────────────────
async function fetchSenateVotes(boletin) {
  let xml;
  try {
    xml = await fetchText(`https://tramitacion.senado.cl/wspublico/votaciones.php?boletin=${encodeURIComponent(boletin)}`);
  } catch {
    try {
      xml = await fetchText('https://tramitacion.senado.cl/wspublico/votaciones.php', { method: 'POST', headers: { 'Content-Type': 'application/x-www-form-urlencoded' }, body: `boletin=${encodeURIComponent(boletin)}` });
    } catch { return []; }
  }
  const doc = parseXML(xml);
  return Array.from(doc.getElementsByTagName('votacion')).flatMap((vot) => {
    const fecha = tagText(vot, 'FECHA');
    const tema = tagText(vot, 'TEMA');
    const materia = tema || `Boletín ${boletin}`;
    const votos = {};
    const detalleEls = vot.getElementsByTagName('DETALLE_VOTACION');
    if (!detalleEls.length) return [];
    Array.from(detalleEls[0].getElementsByTagName('VOTO')).forEach((v) => {
      const parlName = tagText(v, 'PARLAMENTARIO');
      const seleccion = tagText(v, 'SELECCION');
      const parlId = matchSenator(parlName);
      if (parlId) {
        votos[parlId] = { parlId, nombre: parlName, voto: classifyVote(seleccion) };
      }
    });
    return Object.keys(votos).length ? [{ id: `senado-${boletin}-${fecha}`, boletin, fecha, chamber: 'senado', materia, descripcion: materia, tags: classify(materia), votos }] : [];
  });
}

async function fetchChamberVotes(boletin) {
  let xml;
  try {
    xml = await fetchText(`https://opendata.camara.cl/wscamaradiputados.asmx/getVotaciones_Boletin?prmBoletin=${encodeURIComponent(boletin)}`);
  } catch { return []; }

  const doc = parseXML(xml);
  const votaciones = Array.from(doc.getElementsByTagName('Votacion'));
  const records = [];

  for (const vot of votaciones) {
    const fecha = tagText(vot, 'Fecha');
    const articulo = tagText(vot, 'Articulo');
    const materia = articulo || `Boletín ${boletin}`;
    const voteId = tagText(vot, 'ID');

    if (!voteId) continue;

    // Fetch individual votes
    let detailXml;
    try {
      detailXml = await fetchText(`https://opendata.camara.cl/wscamaradiputados.asmx/getVotacion_Detalle?prmVotacionID=${voteId}`);
    } catch { continue; }

    const detailDoc = parseXML(detailXml);
    const votos = {};
    const votosEls = detailDoc.getElementsByTagName('Voto');
    Array.from(votosEls).forEach((v) => {
      const dipEls = v.getElementsByTagName('Diputado');
      if (!dipEls.length) return;
      const d = dipEls[0];
      const parlId = tagText(d, 'DIPID');
      const nombre = tagText(d, 'Nombre');
      const ap = tagText(d, 'Apellido_Paterno');
      const am = tagText(d, 'Apellido_Materno') || '';
      const opcion = tagText(v, 'Opcion');
      if (parlId) {
        votos[parlId] = {
          parlId,
          nombre: [nombre, ap, am].filter(Boolean).join(' '),
          voto: classifyVote(opcion),
        };
      }
    });

    if (Object.keys(votos).length) {
      records.push({
        id: `camara-${boletin}-${voteId}`,
        boletin,
        fecha,
        chamber: 'camara',
        materia,
        descripcion: materia,
        tags: classify(materia),
        votos,
      });
    }

    await new Promise((r) => setTimeout(r, 50));
  }

  return records;
}

// ── Main ────────────────────────────────────────────────────
async function main() {
  if (!existsSync(OUT_DIR)) mkdirSync(OUT_DIR, { recursive: true });

  // Load existing state
  let state = { lastBoletin: SCAN_START - 1 };
  if (existsSync(STATE_FILE)) {
    try { state = JSON.parse(readFileSync(STATE_FILE, 'utf8')); } catch {}
  }

  console.log('Voto Informado — Data Pipeline\n');

  // 1. Parliamentarians
  console.log('Fetching parliamentarians...');
  const [senators, deputies] = await Promise.all([fetchSenators(), fetchDeputies()]);
  buildSenatorMap(senators);
  console.log(`  Senators: ${senators.length}  |  Deputies: ${deputies.length}`);

  // 2. Scan boletines for votes
  const startFrom = Math.max(state.lastBoletin + 1, SCAN_START);
  const endAt = SCAN_END;
  console.log(`\nScanning boletines ${startFrom}–${endAt}...`);

  const allVotes = [];
  let lastChecked = startFrom - 1;

  for (let i = startFrom; i <= endAt; i++) {
    if (i % 100 === 0) {
      console.log(`  ${i}/${endAt} (${allVotes.length} records so far)`);
      // Save progress
      writeFileSync(STATE_FILE, JSON.stringify({ lastBoletin: lastChecked }));
    }
    lastChecked = i;

    const [sv, cv] = await Promise.allSettled([
      fetchSenateVotes(String(i)),
      fetchChamberVotes(String(i)),
    ]);
    if (sv.status === 'fulfilled') allVotes.push(...sv.value);
    if (cv.status === 'fulfilled') allVotes.push(...cv.value);

    await new Promise((r) => setTimeout(r, 150));
  }

  // Save final state
  writeFileSync(STATE_FILE, JSON.stringify({ lastBoletin: endAt }));

  // 3. Merge with existing data
  let existingVotes = [];
  if (existsSync(OUT_FILE)) {
    try {
      const existing = JSON.parse(readFileSync(OUT_FILE, 'utf8'));
      existingVotes = existing.votes || [];
    } catch {}
  }

  const seen = new Set(existingVotes.map((v) => v.id));
  const newVotes = allVotes.filter((v) => !seen.has(v.id));
  const merged = [...existingVotes, ...newVotes];

  console.log(`\nNew records: ${newVotes.length}`);
  console.log(`Total records: ${merged.length}`);

  // 4. Write output
  const output = {
    generatedAt: new Date().toISOString(),
    parliamentarians: { senado: senators, camara: deputies },
    votes: merged,
  };

  writeFileSync(OUT_FILE, JSON.stringify(output, null, 2));
  console.log(`Written to ${OUT_FILE}`);
  console.log(`File size: ${(JSON.stringify(output).length / 1024).toFixed(1)} KB`);

  // Stats
  const senateVotes = merged.filter((v) => v.chamber === 'senado').length;
  const chamberVotes = merged.filter((v) => v.chamber === 'camara').length;
  console.log(`  Senate records: ${senateVotes}  |  Chamber records: ${chamberVotes}`);
}

main().catch((e) => { console.error(e); process.exit(1); });
