// Pasada 3 (medición, no carga): pares nuevos que aportaría
// dhimmel/drugcentral rephetio/indications.tsv (DOID + DrugBank) frente al NDJSON.
import { readFileSync } from 'node:fs';
import { ndjsonPath, readNdjson } from '/home/user/mantra-core-health-api/tools/terminology-import/lib/glossary-es/common.mjs';
import { code, curie } from '/home/user/mantra-core-health-api/tools/terminology-import/drug-treatments/lib/common.mjs';
import { drugCentralIndex, mondoIndex, resolveCondition, resolveDrug } from '/home/user/mantra-core-health-api/tools/terminology-import/drug-treatments/lib/crosswalk.mjs';
import { drugCentralIdentifiers } from '/home/user/mantra-core-health-api/tools/terminology-import/drug-treatments/lib/parsers.mjs';

const C = '/home/user/glossary-data-build/cache/drug-treatments';
const mondo = mondoIndex(readFileSync(`${C}/monarch-initiative__mondo@a645ab571f5b/src/ontology/mappings/mondo.sssom.tsv`, 'utf8'));
const dc = drugCentralIndex(drugCentralIdentifiers(readFileSync(`${C}/olegursu__drugtarget@64630f7c2bc0/identifiers.tsv`, 'utf8')));
const have = new Set(readNdjson(ndjsonPath('drug-treatments')).filter((a) => a.relation.polarity === 'positive').map((a) => a.pairKey));
const [file] = process.argv.slice(2);
const rows = readFileSync(file, 'utf8').trim().split('\n').slice(1).map((l) => l.split('\t'));
let n = 0;
let fresh = 0;
const categories = {};
for (const [doid, db, , , category] of rows) {
  n++;
  categories[category] = (categories[category] ?? 0) + 1;
  if (category === 'NOT') continue;
  const d = resolveDrug([code('DRUGBANK', db)], dc);
  const c = resolveCondition([curie(doid)], mondo);
  if (!have.has(`${d.canonical}|${c.canonical}`)) { fresh++; (categories["new:" + category] = (categories["new:" + category] ?? 0) + 1); }
}
console.log(JSON.stringify({ file, rows: n, categories, newPositivePairs: fresh }));
