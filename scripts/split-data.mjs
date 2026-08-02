/**
 * Split existing index.json into per-year, per-chamber files.
 * Usage: node scripts/split-data.mjs
 */

import { readFileSync, writeFileSync, mkdirSync, existsSync } from 'fs';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const IN_FILE = resolve(__dirname, '..', 'public', 'data', 'index.json');
const OUT_DIR = resolve(__dirname, '..', 'public', 'data');

function extractYear(fecha) {
  if (!fecha) return 'desconocido';
  const parts = fecha.split(/[\/-]/);
  for (const p of parts) {
    if (p.length === 4 && /^\d{4}$/.test(p)) return p;
    if (p.startsWith('20') && p.length >= 4) return p.substring(0, 4);
  }
  return 'desconocido';
}

const data = JSON.parse(readFileSync(IN_FILE, 'utf8'));
console.log(`Loaded ${data.votes.length} records`);

// Parliamentarians
writeFileSync(resolve(OUT_DIR, 'parliamentarians.json'), JSON.stringify(data.parliamentarians, null, 2));
console.log('Written parliamentarians.json');

// Group by chamber + year
const groups = {};
for (const v of data.votes) {
  const year = extractYear(v.fecha);
  const key = `${v.chamber}-${year}`;
  if (!groups[key]) groups[key] = [];
  groups[key].push(v);
}

// Write per-chamber, per-year files
let totalFiles = 0;
for (const [key, votes] of Object.entries(groups)) {
  const [chamber, year] = key.split('-');
  const chamberDir = resolve(OUT_DIR, chamber);
  if (!existsSync(chamberDir)) mkdirSync(chamberDir, { recursive: true });

  const file = resolve(chamberDir, `${year}.json`);
  writeFileSync(file, JSON.stringify(votes, null, 2));
  totalFiles++;
}

console.log(`Written ${totalFiles} year files:`);
for (const [key, votes] of Object.entries(groups).sort()) {
  console.log(`  ${key}: ${votes.length} records`);
}
