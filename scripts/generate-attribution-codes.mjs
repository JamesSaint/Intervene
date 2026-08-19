/**
 * Phase 0 attribution codes.
 *
 * Prints opaque codes and the links they belong to. Run it, take what
 * you need, close the terminal. Nothing is stored and nothing is
 * registered: with six participants the record is a spreadsheet, and
 * `/readiness-snapshot/` accepts any well-formed code without checking
 * it against a list.
 *
 * OPAQUE MEANS OPAQUE. No name, no initials, no firm. The recipient of
 * a forwarded link reads the URL, and a code reading `jsmith-kpmg`
 * discloses the referral to the client before the participant has
 * chosen to.
 *
 * The alphabet carries no vowels, so a code cannot come out spelling
 * something, and drops `0`, `1`, `l`, `o` and `i`, so a code read aloud
 * or retyped does not turn into a different one.
 *
 *   node scripts/generate-attribution-codes.mjs [count]
 */

import { randomInt } from 'node:crypto';

const ALPHABET = '23456789bcdfghjkmnpqrstvwxz';
const LENGTH = 8;
const BASE = 'https://intervene.uk/readiness-snapshot/';

/** The shape `src/lib/snapshot/attribution.ts` accepts. Kept in step by hand. */
const SHAPE = /^[a-z0-9]{8}$/;

function code() {
  let out = '';
  for (let i = 0; i < LENGTH; i += 1) out += ALPHABET[randomInt(ALPHABET.length)];
  return out;
}

const count = Number.parseInt(process.argv[2] ?? '6', 10);
if (!Number.isInteger(count) || count < 1 || count > 100) {
  console.error('Usage: node scripts/generate-attribution-codes.mjs [1-100]');
  process.exit(1);
}

const issued = new Set();
while (issued.size < count) issued.add(code());

console.log('');
for (const value of issued) {
  if (!SHAPE.test(value)) throw new Error(`generated code fails the site rule: ${value}`);
  console.log(`  ${value}   ${BASE}?p=${value}`);
}
console.log(`\n  ${count} code(s). Issue individually. Record each against one name.\n`);
