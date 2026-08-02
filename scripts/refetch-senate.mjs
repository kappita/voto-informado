/**
 * Re-fetch Senate votes for boletines with few matched senators.
 * Old pipeline dropped unmatched names — this fills them back.
 */

import { readFileSync, readdirSync, writeFileSync } from 'fs';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';
import { DOMParser } from '@xmldom/xmldom';

const __dirname = dirname(fileURLToPath(import.meta.url));
const DATA_DIR = resolve(__dirname, '..', 'public', 'data');

function fixEntities(xml) {
  const map = { aacute:'\u00E1',eacute:'\u00E9',iacute:'\u00ED',oacute:'\u00F3',uacute:'\u00FA',Aacute:'\u00C1',Eacute:'\u00C9',Iacute:'\u00CD',Oacute:'\u00D3',Uacute:'\u00DA',ntilde:'\u00F1',Ntilde:'\u00D1',agrave:'\u00E0',nbsp:' ',amp:'&',lt:'<',gt:'>',quot:'"',apos:"'" };
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
  return 'ausente';
}

// Load parliamentarians for matching
const parlFile = JSON.parse(readFileSync(resolve(DATA_DIR, 'parliamentarians.json'), 'utf8'));
const senatorMap = new Map();
for (const s of parlFile.senado) {
  const key = (s.lastName + ' ' + s.name).toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
  senatorMap.set(key, s.id);
}

function matchName(name) {
  if (!name) return null;
  const clean = name.trim().replace(/\s+/g, ' ');
  const m = clean.match(/^(.+?)\s+\w\.?,?\s+(.+)$/);
  if (!m) return null;
  const key = (m[1] + ' ' + m[2]).toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
  return senatorMap.get(key) || null;
}

async function fetchText(url) {
  const resp = await fetch(url, { headers: { 'User-Agent': 'VotoInformado/1.0' } });
  if (!resp.ok) throw new Error(`HTTP ${resp.status}`);
  return resp.text();
}

async function refetchBoletin(boletin) {
  try {
    const xml = await fetchText(`https://tramitacion.senado.cl/wspublico/votaciones.php?boletin=${boletin}`);
    const doc = parseXML(xml);
    return Array.from(doc.getElementsByTagName('votacion')).flatMap(vot => {
      const fecha = tagText(vot,'FECHA'), materia = tagText(vot,'TEMA')||`Boletín ${boletin}`;
      const det = vot.getElementsByTagName('DETALLE_VOTACION');
      if (!det.length) return [];
      const votos = {};
      Array.from(det[0].getElementsByTagName('VOTO')).forEach(v => {
        const name = tagText(v,'PARLAMENTARIO');
        const sel = tagText(v,'SELECCION');
        const pid = matchName(name);
        votos[pid || name] = classifyVote(sel);
      });
      return [{ id:`senado-${boletin}-${fecha}`, boletin, fecha, chamber:'senado', materia, descripcion:materia, tags:[], votos }];
    });
  } catch { return []; }
}

async function main() {
  const senateDir = resolve(DATA_DIR, 'senado');
  const files = readdirSync(senateDir).filter(f => f.endsWith('.json'));
  let totalFixed = 0;

  for (const file of files) {
    const filePath = resolve(senateDir, file);
    const votes = JSON.parse(readFileSync(filePath, 'utf8'));
    let changed = false;

    for (let i = 0; i < votes.length; i++) {
      const v = votes[i];
      const count = Object.keys(v.votos).length;
      if (count >= 20) continue; // Already good

      console.log(`  Re-fetching boletín ${v.boletin} (had ${count} votes)...`);
      const fresh = await refetchBoletin(v.boletin);
      const freshVote = fresh.find(f => f.id === v.id);
      if (freshVote && Object.keys(freshVote.votos).length > count) {
        votes[i].votos = freshVote.votos;
        votes[i].tags = freshVote.tags;
        votes[i].materia = freshVote.materia;
        changed = true;
        totalFixed++;
      }
      await new Promise(r => setTimeout(r, 100));
    }

    if (changed) {
      writeFileSync(filePath, JSON.stringify(votes, null, 2));
      console.log(`  Updated ${file}`);
    }
  }

  console.log(`\nFixed ${totalFixed} records`);
}

main().catch(e => { console.error(e); process.exit(1); });
