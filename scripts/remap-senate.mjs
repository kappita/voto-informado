/**
 * Build historical senator list from vote data and remap vote keys to IDs.
 * Matches saved name-keys to the parliamentarian list.
 */

import { readFileSync, readdirSync, writeFileSync } from 'fs';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const DATA_DIR = resolve(__dirname, '..', 'public', 'data');

const parlFile = JSON.parse(readFileSync(resolve(DATA_DIR, 'parliamentarians.json'), 'utf8'));

// Build search index for current senators
const senatorIndex = new Map();
for (const s of parlFile.senado) {
  const key = (s.lastName + ' ' + s.name).toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
  senatorIndex.set(key, s.id);
}

const seenIds = new Set(parlFile.senado.map(s => s.id));
const newSenators = [];

// Scan all senate vote files
const senateDir = resolve(DATA_DIR, 'senado');
for (const file of readdirSync(senateDir)) {
  if (!file.endsWith('.json')) continue;
  const votes = JSON.parse(readFileSync(resolve(senateDir, file), 'utf8'));
  let changed = false;

  for (const v of votes) {
    const newVotos = {};
    for (const [key, voteOption] of Object.entries(v.votos)) {
      if (/^\d+$/.test(key)) {
        newVotos[key] = voteOption;
        continue;
      }

      // Try matching name to existing senator
      const clean = key.trim().replace(/\s+/g, ' ');
      const match = clean.match(/^(.+?)\s+\w\.?,?\s+(.+)$/);
      if (!match) { newVotos[key] = voteOption; continue; }

      const lastName = match[1];
      const firstName = match[2];
      const searchKey = (lastName + ' ' + firstName).toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');

      const existingId = senatorIndex.get(searchKey);
      if (existingId) {
        newVotos[existingId] = voteOption;
        changed = true;
        continue;
      }

      // Add as new historical senator (use name as ID for dedup)
      const id = lastName.toLowerCase().replace(/\s+/g, '') + '-' + firstName.toLowerCase().replace(/\s+/g, '');
      if (!seenIds.has(id)) {
        seenIds.add(id);
        newSenators.push({
          id,
          name: firstName,
          lastName,
          secondLastName: '',
          fullName: `${firstName} ${lastName}`,
          chamber: 'senado',
        });
        senatorIndex.set(searchKey, id);
      }
      newVotos[id] = voteOption;
      changed = true;
    }
    if (changed) v.votos = newVotos;
  }

  if (changed) {
    writeFileSync(resolve(senateDir, file), JSON.stringify(votes, null, 2));
  }
}

// Update parliamentarians
parlFile.senado = [...parlFile.senado, ...newSenators];
writeFileSync(resolve(DATA_DIR, 'parliamentarians.json'), JSON.stringify(parlFile, null, 2));

console.log(`Added ${newSenators.length} historical senators`);
console.log(`Total: ${parlFile.senado.length} senate, ${parlFile.camara.length} chamber`);
console.log('Sample:', newSenators.slice(0, 5).map(s => s.fullName).join(', '));
