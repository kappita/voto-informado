/**
 * Data pipeline — fetches voting data from Chilean Congress APIs.
 * Uses concurrent requests for speed.
 *
 * Usage: npm run fetch-data
 */

import { writeFileSync, readFileSync, readdirSync, mkdirSync, existsSync } from 'fs';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';
import { DOMParser } from '@xmldom/xmldom';

const __dirname = dirname(fileURLToPath(import.meta.url));
const OUT_DIR = resolve(__dirname, '..', 'public', 'data');
const OUT_FILE = resolve(OUT_DIR, 'index.json');
const STATE_FILE = resolve(OUT_DIR, '.pipeline-state.json');

const SCAN_START = 0;
const SCAN_AHEAD = 18000;
const BOLETIN_BATCH = 30;
const CHAMBER_BATCH = 15;

// ── Helpers ─────────────────────────────────────────────────
function fixEntities(xml) {
  const map = { aacute:'\u00E1',eacute:'\u00E9',iacute:'\u00ED',oacute:'\u00F3',uacute:'\u00FA',Aacute:'\u00C1',Eacute:'\u00C9',Iacute:'\u00CD',Oacute:'\u00D3',Uacute:'\u00DA',ntilde:'\u00F1',Ntilde:'\u00D1',agrave:'\u00E0',nbsp:' ',amp:'&',lt:'<',gt:'>',quot:'"',apos:"'",ouml:'\u00F6',uuml:'\u00FC' };
  return xml.replace(/&([a-z]+);/gi, (m, e) => map[e.toLowerCase()] ?? m);
}
function parseXML(xml) { return new DOMParser().parseFromString(fixEntities(xml), 'text/xml'); }
function tagText(el, tag) { const n = el.getElementsByTagName(tag); return n.length ? (n[0].textContent||'').normalize('NFC').replace(/\s+/g,' ').trim() : ''; }
function classifyVote(raw) {
  const v = (raw||'').toLowerCase().trim();
  if (/favor|si|s[ií]|afirmativo/.test(v)) return 'afavor';
  if (/contra|no|negativo/.test(v)) return 'contra';
  if (/absten/.test(v)) return 'abstencion';
  if (/pareo/.test(v)) return 'pareo';
  if (/no vota|ausente|no asiste/.test(v)) return 'ausente';
  return 'ausente';
}

// ── Tag classification ─────────────────────────────────────
const TAG_RULES = [
  ['economia',       'economía,económico,presupuesto,impuesto,tributario,fiscal,financiero,banca,comercio,inversión,pyme,emprendimiento'],
  ['seguridad',      'seguridad,delito,penal,cárcel,policía,carabineros,pdi,delincuencia,crimen,narcotráfico,violencia'],
  ['salud',          'salud,hospital,médico,fármaco,medicamento,enfermedad,fonasa,isapre,vacuna,sanitario,clínica'],
  ['educacion',      'educación,escolar,universidad,liceo,colegio,docente,profesor,estudiante,académico,cae,gratuidad'],
  ['medioambiente',  'ambiental,medio ambiente,ecología,contaminación,residuo,reciclaje,biodiversidad,forestal,agua,glaciar,cambio climático,sostenible'],
  ['trabajo',        'trabajo,laboral,trabajador,sindical,sindicato,salario,sueldo,pensión,jubilación,afp,previsional,negociación colectiva'],
  ['vivienda',       'vivienda,habitacional,casa,departamento,arriendo,subsidio habitacional,campamento,urbanismo'],
  ['transporte',     'transporte,tránsito,ferrocarril,tren,metro,bus,carretera,autopista,aeropuerto'],
  ['inmigracion',    'inmigración,migración,migrante,extranjería,extranjero,frontera,refugiado,visa'],
  ['derechos',       'derecho humano,ddhh,memoria,víctima,reparación,indh,discriminación'],
  ['justicia',       'justicia,judicial,tribunal,juez,fiscalía,defensoría,procesal,corte'],
  ['defensa',        'defensa,ffaa,militar,ejército,armada,fuerza aérea'],
  ['energia',        'energía,energético,eléctrico,electricidad,combustible,petróleo,gas,renovable,solar,litio,minería'],
  ['agricultura',    'agricultura,agrícola,campo,rural,riego,indap,ganadería,pesca,acuicultura'],
  ['cultura',        'cultura,cultural,patrimonio,arte,artista,museo,biblioteca,monumento,deporte'],
  ['tecnologia',     'tecnología,digital,internet,telecomunicación,ciberseguridad,inteligencia artificial,innovación,conectividad'],
  ['descentralizacion','descentralización,regional,regionalización,municipio,municipal,alcalde,gobernador'],
  ['pueblos',        'indígena,pueblo originario,mapuche,conadi,consulta indígena,ancestral'],
  ['genero',         'género,mujer,feminismo,igualdad,brecha salarial,violencia de género,femicidio,aborto,lgbt'],
  ['social',         'social,pobreza,vulnerabilidad,subsidio,bono,protección social,niñez,infancia,adulto mayor,discapacidad'],
  ['tributario',     'tributario,tributo,iva,impuesto,renta,aduanas,evasión,elusión,sii'],
  ['constitucional', 'constitución,constitucional,reforma constitucional,plebiscito,constituyente,ley orgánica'],
  ['transparencia',  'transparencia,probidad,corrupción,lobby,fiscalización,contraloría'],
].map(([id, kw]) => ({ id, kw: kw.split(',') }));

function classify(text) {
  const lower = (text||'').toLowerCase();
  const tags = [];
  for (const { id, kw } of TAG_RULES) {
    if (kw.some(k => lower.includes(k))) tags.push(id);
  }
  return tags.length ? tags : ['otro'];
}

// ── HTTP ────────────────────────────────────────────────────
async function fetchText(url, opts = {}) {
  const resp = await fetch(url, { headers: { 'User-Agent': 'VotoInformado/1.0' }, ...opts });
  if (!resp.ok) throw new Error(`HTTP ${resp.status}`);
  return resp.text();
}

// ── Concurrency limiter ─────────────────────────────────────
function limit(concurrency) {
  let running = 0;
  const queue = [];
  function next() { running--; if (queue.length) { const [fn, res] = queue.shift(); running++; fn().then(res).catch(res); } }
  return (fn) => new Promise((resolve) => {
    if (running < concurrency) { running++; fn().then(resolve).catch(resolve); }
    else queue.push([fn, resolve]);
  }).then((r) => { next(); return r; });
}

// ── Parliamentarians ────────────────────────────────────────
async function fetchSenators() {
  const doc = parseXML(await fetchText('https://tramitacion.senado.cl/wspublico/senadores_vigentes.php'));
  return Array.from(doc.getElementsByTagName('senador')).map(n => {
    const nombre=tagText(n,'PARLNOMBRE'), ap=tagText(n,'PARLAPELLIDOPATERNO'), am=tagText(n,'PARLAPELLIDOMATERNO');
    return { id:tagText(n,'PARLID'), name:nombre, lastName:ap, secondLastName:am, fullName:[nombre,ap,am].filter(Boolean).join(' '), party:tagText(n,'PARTIDO'), region:tagText(n,'REGION'), chamber:'senado' };
  });
}
async function fetchDeputies() {
  const doc = parseXML(await fetchText('https://opendata.camara.cl/wscamaradiputados.asmx/getDiputados_Vigentes'));
  return Array.from(doc.getElementsByTagName('Diputado')).map(n => {
    const nombre=tagText(n,'Nombre'), ap=tagText(n,'Apellido_Paterno'), am=tagText(n,'Apellido_Materno');
    return { id:tagText(n,'DIPID'), name:nombre, lastName:ap, secondLastName:am, fullName:[nombre,ap,am].filter(Boolean).join(' '), chamber:'camara' };
  });
}

// ── Name matching for Senate ────────────────────────────────
let senatorIds = null;
function buildSenatorMap(senators) {
  senatorIds = new Map();
  for (const s of senators) {
    const key = (s.lastName+' '+s.name).toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g,'');
    senatorIds.set(key, s.id);
    if (s.secondLastName) senatorIds.set((s.lastName+' '+s.secondLastName+' '+s.name).toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g,''), s.id);
  }
}
function matchSenator(name) {
  if (!senatorIds||!name) return null;
  const c = name.trim().replace(/\s+/g,' ').match(/^(.+?)\s+\w\.?,?\s+(.+)$/);
  if (!c) return null;
  const key = (c[1]+' '+c[2]).toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g,'');
  if (senatorIds.has(key)) return senatorIds.get(key);
  for (const [k,id] of senatorIds) if (k.startsWith(c[1].toLowerCase())&&k.includes(c[2].toLowerCase())) return id;
  return null;
}

// ── Vote fetching ───────────────────────────────────────────
async function fetchSenateVotes(boletin) {
  let xml;
  try { xml = await fetchText(`https://tramitacion.senado.cl/wspublico/votaciones.php?boletin=${encodeURIComponent(boletin)}`); }
  catch { return []; }
  const doc = parseXML(xml);
  return Array.from(doc.getElementsByTagName('votacion')).flatMap(vot => {
    const fecha = tagText(vot,'FECHA'), materia = tagText(vot,'TEMA')||`Boletín ${boletin}`;
    const det = vot.getElementsByTagName('DETALLE_VOTACION');
    if (!det.length) return [];
    const votos = {};
    Array.from(det[0].getElementsByTagName('VOTO')).forEach(v => {
      const parlName = tagText(v, 'PARLAMENTARIO');
      const seleccion = tagText(v, 'SELECCION');
      const pid = matchSenator(parlName);
      const key = pid || parlName || `unknown-${Math.random()}`;
      votos[key] = classifyVote(seleccion);
    });
    return Object.keys(votos).length ? [{ id:`senado-${boletin}-${fecha}`, boletin, fecha, chamber:'senado', materia, descripcion:materia, tags:classify(materia), votos }] : [];
  });
}

async function fetchChamberBoletinVoteIds(boletin) {
  try {
    const xml = await fetchText(`https://opendata.camara.cl/wscamaradiputados.asmx/getVotaciones_Boletin?prmBoletin=${encodeURIComponent(boletin)}`);
    return Array.from(parseXML(xml).getElementsByTagName('Votacion')).map(v => ({ id: tagText(v,'ID'), fecha: tagText(v,'Fecha'), articulo: tagText(v,'Articulo') })).filter(v => v.id);
  } catch { return []; }
}

async function fetchChamberVoteDetail(voteId, boletin, articulo) {
  try {
    const xml = await fetchText(`https://opendata.camara.cl/wscamaradiputados.asmx/getVotacion_Detalle?prmVotacionID=${voteId}`);
    const doc = parseXML(xml), votos = {};
    Array.from(doc.getElementsByTagName('Voto')).forEach(v => {
      const d = v.getElementsByTagName('Diputado');
      if (!d.length) return;
      const pid = tagText(d[0],'DIPID');
      if (pid) votos[pid] = classifyVote(tagText(v,'Opcion'));
    });
    return Object.keys(votos).length
      ? [{ id:`camara-${boletin}-${voteId}`, boletin, fecha: tagText(doc,'Fecha'), chamber:'camara', materia: articulo||`Boletín ${boletin}`, descripcion: articulo||'', tags:classify(articulo||''), votos }]
      : [];
  } catch { return []; }
}

// ── Main ────────────────────────────────────────────────────
// ── Year extraction ─────────────────────────────────────────
function extractYear(fecha) {
  if (!fecha) return 'desconocido';
  const parts = fecha.split(/[\/-]/);
  for (const p of parts) {
    if (p.length === 4 && /^\d{4}$/.test(p)) return p;
    if (p.startsWith('20') && p.length >= 4) return p.substring(0, 4);
  }
  return 'desconocido';
}

// ── Main ────────────────────────────────────────────────────
async function main() {
  if (!existsSync(OUT_DIR)) mkdirSync(OUT_DIR, { recursive: true });

  let state = { lastBoletin: SCAN_START - 1 };
  if (existsSync(STATE_FILE)) { try { state = JSON.parse(readFileSync(STATE_FILE,'utf8')); } catch {} }

  console.log('Voto Informado — Data Pipeline (concurrent)\n');

  console.log('Fetching parliamentarians...');
  const [senators, deputies] = await Promise.all([fetchSenators(), fetchDeputies()]);
  buildSenatorMap(senators);
  console.log(`  Senators: ${senators.length}  |  Deputies: ${deputies.length}`);
  writeFileSync(resolve(OUT_DIR, 'parliamentarians.json'), JSON.stringify({ senado: senators, camara: deputies }));

  const startFrom = Math.max(state.lastBoletin + 1, SCAN_START);
  const endAt = Math.max(startFrom + SCAN_AHEAD - 1, startFrom);
  console.log(`\nScanning boletines ${startFrom}–${endAt} in batches of ${BOLETIN_BATCH}...`);

  // Load existing data from split files
  const seen = new Set();
  const groups = {};
  for (const ch of ['senado', 'camara']) {
    const dir = resolve(OUT_DIR, ch);
    if (existsSync(dir)) {
      for (const f of readdirSync(dir)) {
        if (!f.endsWith('.json')) continue;
        const votes = JSON.parse(readFileSync(resolve(dir, f), 'utf8'));
        const year = f.replace('.json', '');
        const key = `${ch}-${year}`;
        if (!groups[key]) groups[key] = [];
        for (const v of votes) {
          if (!seen.has(v.id)) { seen.add(v.id); groups[key].push(v); }
        }
      }
    }
  }
  const existingCount = seen.size;
  console.log(`  Loaded ${existingCount} existing records`);

  function saveAll() {
    const index = {};
    for (const [key, votes] of Object.entries(groups)) {
      const [chamber, year] = key.split('-');
      const dir = resolve(OUT_DIR, chamber);
      if (!existsSync(dir)) mkdirSync(dir, { recursive: true });
      writeFileSync(resolve(dir, `${year}.json`), JSON.stringify(votes, null, 2));
      if (!index[year]) index[year] = {};
      index[year][chamber] = votes.length;
    }
    writeFileSync(resolve(OUT_DIR, 'index.json'), JSON.stringify({ generatedAt: new Date().toISOString(), years: index }, null, 2));
    writeFileSync(STATE_FILE, JSON.stringify({ lastBoletin }));
  }

  let lastBoletin = startFrom - 1;

  for (let batchStart = startFrom; batchStart <= endAt; batchStart += BOLETIN_BATCH) {
    const batch = [];
    for (let i = batchStart; i < batchStart + BOLETIN_BATCH && i <= endAt; i++) batch.push(i);
    lastBoletin = batch[batch.length - 1];

    const senateResults = await Promise.allSettled(batch.map(b => fetchSenateVotes(String(b))));

    const chamberLimiter = limit(CHAMBER_BATCH);
    const chamberPromises = batch.map(b => (async () => {
      const vots = await fetchChamberBoletinVoteIds(String(b));
      if (!vots.length) return [];
      const detailPromises = vots.map(v => chamberLimiter(() => fetchChamberVoteDetail(v.id, String(b), v.articulo)));
      const results = await Promise.allSettled(detailPromises);
      return results.flatMap(r => r.status === 'fulfilled' ? r.value : []);
    })());
    const chamberResults = await Promise.allSettled(chamberPromises);

    for (const r of senateResults) {
      if (r.status === 'fulfilled') for (const v of r.value) {
        if (!seen.has(v.id)) {
          seen.add(v.id);
          const year = extractYear(v.fecha);
          const key = `senado-${year}`;
          if (!groups[key]) groups[key] = [];
          groups[key].push(v);
        }
      }
    }
    for (const r of chamberResults) {
      if (r.status === 'fulfilled') for (const v of r.value) {
        if (!seen.has(v.id)) {
          seen.add(v.id);
          const year = extractYear(v.fecha);
          const key = `camara-${year}`;
          if (!groups[key]) groups[key] = [];
          groups[key].push(v);
        }
      }
    }

    saveAll();
    const total = Object.values(groups).reduce((s, a) => s + a.length, 0);
    console.log(`  ${lastBoletin}/${endAt} (${total} records)`);
  }

  const total = Object.values(groups).reduce((s, a) => s + a.length, 0);
  console.log(`\nTotal: ${total} records`);
  const sc = Object.entries(groups).reduce((a, [k, v]) => { const [ch] = k.split('-'); a[ch] = (a[ch]||0) + v.length; return a; }, {});
  console.log(`  Senate: ${sc.senado||0}  |  Chamber: ${sc.camara||0}`);
}

main().catch(e => { console.error(e); process.exit(1); });
