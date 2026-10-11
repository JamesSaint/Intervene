// Validate built JSON-LD against an official Schema.org vocabulary snapshot.
// Downloads stay outside this script: it never sends site data to a validator.
import { readFileSync, readdirSync } from 'node:fs';
import { join } from 'node:path';

const vocabularyPath = process.argv[2];
if (!vocabularyPath) {
  console.error('Usage: node scripts/check-structured-data.mjs <schemaorg-jsonld-path>');
  process.exit(1);
}
const vocabulary = JSON.parse(readFileSync(vocabularyPath, 'utf8'));
const definitions = new Map(vocabulary['@graph'].map((node) => [node['@id'], node]));
const list = (value) => value == null ? [] : Array.isArray(value) ? value : [value];
const term = (value) => value.startsWith('https://schema.org/')
  ? `schema:${value.slice('https://schema.org/'.length)}`
  : value.includes(':') ? value : `schema:${value}`;
function ancestors(type, seen = new Set()) {
  type = term(type);
  if (seen.has(type)) return seen;
  seen.add(type);
  for (const parent of list(definitions.get(type)?.['rdfs:subClassOf'])) ancestors(parent['@id'], seen);
  return seen;
}
function files(dir) {
  return readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
    const path = join(dir, entry.name);
    return entry.isDirectory() ? files(path) : entry.name.endsWith('.html') ? [path] : [];
  });
}
const errors = new Set();
let checked = 0;
for (const file of files('dist')) {
  const html = readFileSync(file, 'utf8');
  for (const match of html.matchAll(/<script\b[^>]*type="application\/ld\+json"[^>]*>(.*?)<\/script>/gs)) {
    const data = JSON.parse(match[1]);
    const graph = data['@graph'] ?? [data];
    const entities = new Map(graph.filter((node) => node['@id']).map((node) => [node['@id'], node]));
    function check(node) {
      if (!node || typeof node !== 'object') return;
      if (Array.isArray(node)) { node.forEach(check); return; }
      if (node['@type']) {
        const types = list(node['@type']);
        const parents = new Set(types.flatMap((type) => [...ancestors(type)]));
        for (const type of types) {
          if (!definitions.has(term(type))) errors.add(`${file}: unknown type ${type}`);
        }
        for (const [property, value] of Object.entries(node)) {
          if (property.startsWith('@')) continue;
          const definition = definitions.get(term(property));
          const domains = list(definition?.['schema:domainIncludes']).map((domain) => term(domain['@id']));
          if (!definition || (domains.length && !domains.some((domain) => parents.has(domain)))) {
            errors.add(`${file}: ${types.join('/')} does not support ${property}`);
          }
          const ranges = list(definition?.['schema:rangeIncludes']).map((range) => term(range['@id']));
          for (const item of list(value)) {
            // Resolve typed local references; open-world external references remain unchecked.
            const referenced = item && typeof item === 'object' ? item['@type'] ? item : entities.get(item['@id']) : undefined;
            if (!referenced?.['@type'] || !ranges.length) continue;
            const targetParents = new Set(list(referenced['@type']).flatMap((type) => [...ancestors(type)]));
            if (!ranges.some((range) => targetParents.has(range))) {
              errors.add(`${file}: ${types.join('/')}.${property} has unsupported object type ${list(referenced['@type']).join('/')}`);
            }
          }
        }
      }
      Object.values(node).forEach(check);
    }
    graph.forEach(check);
    checked++;
  }
}
if (errors.size) {
  console.error([...errors].join('\n'));
  process.exit(1);
}
if (!checked) throw new Error('No built JSON-LD found. Run npm run build first.');
console.log(`Structured data: ${checked} documents checked; no unknown types, unsupported properties or typed-reference range mismatches.`);
