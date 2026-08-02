/**
 * Extract historical senator names from vote data and add them to parliamentarians.json.
 * Since the Senate API doesn't provide historical data, we build the list from vote records.
 */

import { readFileSync, readdirSync, writeFileSync } from 'fs';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const DATA_DIR = resolve(__dirname, '..', 'public', 'data');

// Load existing parliamentarians
const existing = JSON.parse(readFileSync(resolve(DATA_DIR, 'parliamentarians.json'), 'utf8'));
const existingSenate = new Map();
for (const s of existing.senado || []) existingSenate.set(s.id, s);

// Scan all senate vote files and collect unique names
const senateDir = resolve(DATA_DIR, 'senado');
const names = new Map();

for (const file of readdirSync(senateDir)) {
  if (!file.endsWith('.json')) continue;
  const votes = JSON.parse(readFileSync(resolve(senateDir, file), 'utf8'));
  for (const v of votes) {
    for (const [key, voteOption] of Object.entries(v.votos)) {
      // If key is a name (not a number ID), it's an unmatched historical senator
      if (!/^\d+$/.test(key) && !existingSenate.has(key) && !names.has(key)) {
        names.set(key, key);
      }
    }
  }
}

console.log(`Found ${names.size} historical senator names in vote data`);
console.log('Sample:', [...names.keys()].slice(0, 10).join(', '));

// Generate pseudo-IDs for unmatched senators
let counter = existing.senado.length + 1;
for (const name of names.keys()) {
  // Parse "LastName I., FirstName" format
  const clean = name.trim().replace(/\s+/g, ' ');
  const match = clean.match(/^(.+?)\s+\w\.?,?\s+(.+)$/);
  if (match) {
    const id = `H${String(counter).padStart(4, '0')}`;
    const lastName = match[1];
    const firstName = match[2];
    existing.senado.push({
      id,
      name: firstName,
      lastName,
      secondLastName: '',
      fullName: `${firstName} ${lastName}`,
      chamber: 'senado',
    });
    counter++;
  }
}

writeFileSync(resolve(DATA_DIR, 'parliamentarians.json'), JSON.stringify(existing, null, 2));
console.log(`\nSenado updated: ${existing.senado.length} total (was ${existingSenate.size})`);
