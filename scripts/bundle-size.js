#!/usr/bin/env node
import { readdirSync, statSync } from 'node:fs';

const dist = 'dist/assets';
const files = readdirSync(dist).filter((f) => f.endsWith('.js'));
let total = 0;
for (const file of files) {
  total += statSync(`${dist}/${file}`).size;
}

const limit = 512000;
console.log(`Bundle JS bytes: ${total} (limit ${limit})`);
if (total > limit) {
  console.error('FAIL: bundle > 500 KB gz');
  process.exit(1);
}

console.log('OK');
