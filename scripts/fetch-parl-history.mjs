/**
 * Fetch historical parliamentarians from the Chamber API.
 * The Senate API only provides current senators, so we need another source for Senate.
 * Usage: node scripts/fetch-parl-history.mjs
 */

import { writeFileSync, readFileSync, existsSync, mkdirSync } from 'fs';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';
import { DOMParser } from '@xmldom/xmldom';

const __dirname = dirname(fileURLToPath(import.meta.url));
const OUT_DIR = resolve(__dirname, '..', 'public', 'data');

function fixEntities(xml) {
  const map = { aacute:'\u00E1',eacute:'\u00E9',iacute:'\u00ED',oacute:'\u00F3',uacute:'\u00FA',Aacute:'\u00C1',Eacute:'\u00C9',Iacute:'\u00CD',Oacute:'\u00D3',Uacute:'\u00DA',ntilde:'\u00F1',Ntilde:'\u00D1',agrave:'\u00E0',nbsp:' ',amp:'&',lt:'<',gt:'>',quot:'"',apos:"'" };
  return xml.replace(/&([a-z]+);/gi, (m, e) => map[e.toLowerCase()] ?? m);
}
function parseXML(xml) { return new DOMParser().parseFromString(fixEntities(xml), 'text/xml'); }
function tagText(el, tag) { const n = el.getElementsByTagName(tag); return n.length ? (n[0].textContent||'').normalize('NFC').replace(/\s+/g,' ').trim() : ''; }
async function fetchText(url) {
  const resp = await fetch(url, { headers: { 'User-Agent': 'VotoInformado/1.0' } });
  if (!resp.ok) throw new Error(`HTTP ${resp.status}`);
  return resp.text();
}

async function fetchPeriods() {
  const doc = parseXML(await fetchText('https://opendata.camara.cl/wscamaradiputados.asmx/getPeriodosLegislativos'));
  return Array.from(doc.getElementsByTagName('PeriodoLegislativo')).map(p => ({
    id: tagText(p, 'ID'),
    name: tagText(p, 'Nombre'),
    start: tagText(p, 'Fecha_Inicio'),
    end: tagText(p, 'Fecha_Termino'),
  }));
}

async function fetchDeputiesForPeriod(periodId) {
  const doc = parseXML(await fetchText(`https://opendata.camara.cl/wscamaradiputados.asmx/getDiputados_Periodo?prmPeriodoID=${periodId}`));
  return Array.from(doc.getElementsByTagName('Diputado')).map(d => {
    const nombre = tagText(d, 'Nombre');
    const ap = tagText(d, 'Apellido_Paterno');
    const am = tagText(d, 'Apellido_Materno');
    return {
      id: tagText(d, 'DIPID'),
      name: nombre,
      lastName: ap,
      secondLastName: am,
      fullName: [nombre, ap, am].filter(Boolean).join(' '),
      chamber: 'camara',
      periodId,
    };
  });
}

async function main() {
  console.log('Fetching deputies for all legislative periods...');

  const allDeputies = new Map();
  // Scan period IDs 1-11 (some may be empty)
  for (let periodId = 1; periodId <= 11; periodId++) {
    console.log(`  Period ${periodId}...`);
    try {
      const deps = await fetchDeputiesForPeriod(periodId);
      if (deps.length) {
        for (const d of deps) {
          if (!allDeputies.has(d.id)) {
            allDeputies.set(d.id, { id: d.id, name: d.name, lastName: d.lastName, secondLastName: d.secondLastName, fullName: d.fullName, chamber: 'camara' });
          }
        }
        console.log(`    ${deps.length} deputies`);
      } else {
        console.log('    empty');
      }
    } catch (e) {
      console.log(`    error: ${e.message}`);
    }
    await new Promise(r => setTimeout(r, 200));
  }

  console.log(`\nTotal unique deputies: ${allDeputies.size}`);

  // Merge with current parliamentarians
  const existing = JSON.parse(readFileSync(resolve(OUT_DIR, 'parliamentarians.json'), 'utf8'));
  const currentCamara = existing.camara || [];
  const mergedCamara = new Map();
  for (const d of currentCamara) mergedCamara.set(d.id, d);
  for (const d of allDeputies.values()) {
    if (!mergedCamara.has(d.id)) mergedCamara.set(d.id, d);
  }
  existing.camara = [...mergedCamara.values()];

  writeFileSync(resolve(OUT_DIR, 'parliamentarians.json'), JSON.stringify(existing, null, 2));
  console.log(`  Camara: ${existing.camara.length} total (was ${currentCamara.length})`);
  console.log(`  Senado: ${(existing.senado||[]).length} (unchanged)`);
}

main().catch(e => { console.error(e); process.exit(1); });
