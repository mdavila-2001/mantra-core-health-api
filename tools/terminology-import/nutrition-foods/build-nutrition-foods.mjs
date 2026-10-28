#!/usr/bin/env node
// =============================================================================
// Nutrición y alimentos · etapa 1 (sin red): de los archivos fuente (fetch-sources.mjs) al corpus normalizado.
//
// Salida (por defecto `data/`, o la carpeta de `--out DIR` para comprobar reproducibilidad sin tocar lo versionado):
//   nutrition-foods-codesystems.ndjson.gz        un registro por code system (versión, fuente, artefactos con SHA-256 y licencia)
//   nutrition-foods-concepts.part-NN.ndjson.gz   conceptos de todo menos Branded (partes < 45 MB)
//   nutrition-foods-branded.part-NN.ndjson.gz    conceptos de FDC Branded (opcional al cargar: --no-branded)
//   nutrition-foods.meta.json                    conteos, descartes y conflictos (sin fechas: el build es reproducible)
//   SHA256SUMS                                   suma de cada archivo de salida
// El manifiesto de descarga (`nutrition-foods.manifest.json`) lo escribe fetch-sources.mjs y se lee de acá.
//
//   GLOSSARY_BUILD_DIR=… node --max-old-space-size=2500 tools/terminology-import/nutrition-foods/build-nutrition-foods.mjs [--out DIR] [--no-branded]
// =============================================================================
import { createHash } from 'node:crypto';
import { createWriteStream, existsSync, mkdirSync, readFileSync, readdirSync, rmSync, statSync, writeFileSync } from 'node:fs';
import { once } from 'node:events';
import { join, resolve } from 'node:path';
import { createGzip } from 'node:zlib';

import { DATA_DIR } from './lib/paths.mjs';
import { ARTIFACTS, CODE_SYSTEMS, canonicalUrlOf } from './lib/sources.mjs';
import { artifactPath, readManifest } from './fetch-sources.mjs';
import { openZipStream } from './lib/zip.mjs';
import { readBrandedFoods, readFoods } from './lib/fdc.mjs';
import { fdcVocabRecords } from './lib/fdc-vocab.mjs';
import { oboRecords, parseOboClasses } from './lib/foodon.mjs';
import { constituentRecords, foodRecords, groupRecords, readComposition, readConstituents, readGroups, readSources, sourceRecords } from './lib/ciqual.mjs';
import { cnfRecords, linkNdb, readCnf } from './lib/cnf.mjs';

const args = process.argv.slice(2);
const OUT = resolve(args.includes('--out') ? args[args.indexOf('--out') + 1] : DATA_DIR);
const NO_BRANDED = args.includes('--no-branded');
const PART_BYTES = 100 * 1024 * 1024; // sin comprimir; los NDJSON de texto comprimen ≥ 4:1, así que cada parte queda muy por debajo de 45 MB

/** Escribe NDJSON gzip determinista (nivel 9) en partes de tamaño acotado. */
class PartWriter {
  constructor(dir, prefix) {
    this.dir = dir;
    this.prefix = prefix;
    this.n = 0;
    this.bytes = 0;
    this.files = [];
    this.current = null;
  }
  async open() {
    this.n++;
    const name = `${this.prefix}.part-${String(this.n).padStart(2, '0')}.ndjson.gz`;
    this.files.push(name);
    const gz = createGzip({ level: 9 });
    const out = createWriteStream(join(this.dir, name));
    gz.pipe(out);
    this.current = { gz, out };
    this.bytes = 0;
  }
  async write(obj) {
    if (!this.current || this.bytes >= PART_BYTES) {
      await this.close();
      await this.open();
    }
    const line = `${JSON.stringify(obj)}\n`;
    this.bytes += Buffer.byteLength(line);
    if (!this.current.gz.write(line)) await once(this.current.gz, 'drain');
  }
  async close() {
    if (!this.current) return;
    const { gz, out } = this.current;
    this.current = null;
    gz.end();
    await once(out, 'close');
  }
}

async function writeGzipFile(path, lines) {
  const gz = createGzip({ level: 9 });
  const out = createWriteStream(path);
  gz.pipe(out);
  for (const l of lines) gz.write(`${JSON.stringify(l)}\n`);
  gz.end();
  await once(out, 'close');
}

const sha256 = (path) => createHash('sha256').update(readFileSync(path)).digest('hex');

async function main() {
  const manifest = readManifest();
  for (const key of Object.keys(ARTIFACTS)) {
    if (NO_BRANDED && ARTIFACTS[key].heavy) continue;
    if (!manifest.artifacts[key]) throw new Error(`El manifiesto no registra «${key}»: corré fetch-sources.mjs`);
    if (!existsSync(artifactPath(key))) throw new Error(`Falta el archivo de «${key}» (${artifactPath(key)}): corré fetch-sources.mjs`);
  }
  mkdirSync(OUT, { recursive: true });
  for (const f of readdirSync(OUT)) if (/^nutrition-foods-(concepts|branded)\.part-\d+\.ndjson\.gz$/.test(f)) rmSync(join(OUT, f));

  const mainW = new PartWriter(OUT, 'nutrition-foods-concepts');
  const branded = new PartWriter(OUT, 'nutrition-foods-branded');
  const counts = Object.fromEntries(Object.keys(CODE_SYSTEMS).map((k) => [k, 0]));
  const codes = new Map(); // cs → Set(code) (todos menos Branded: Branded se valida con un Set propio)
  const parentRefs = []; // [cs, code, parentCs, parentCode] de cruces entre code systems, para validar al final
  const meta = { notes: {}, conflicts: [], skipped: {} };

  const emit = async (rec, writer = mainW) => {
    if (!CODE_SYSTEMS[rec.cs]) throw new Error(`code system desconocido: ${rec.cs}`);
    if (typeof rec.code !== 'string' || rec.code.trim() === '') throw new Error(`${rec.cs}: código vacío`);
    if (typeof rec.display !== 'string' || rec.display.trim() === '') throw new Error(`${rec.cs} ${rec.code}: display vacío`);
    let set = codes.get(rec.cs);
    if (!set) codes.set(rec.cs, (set = new Set()));
    if (set.has(rec.code)) throw new Error(`${rec.cs}: código repetido ${rec.code}`);
    set.add(rec.code);
    counts[rec.cs]++;
    if (rec.cs !== 'usda-fdc-branded') for (const [pcs, pcode] of rec.parents ?? []) parentRefs.push([rec.cs, rec.code, pcs, pcode]);
    const out = { cs: rec.cs, code: rec.code, display: rec.display };
    if (rec.displayFallback) out.displayFallback = true;
    if (rec.definition) out.definition = rec.definition;
    if (rec.state && rec.state !== 'active') out.state = rec.state;
    out.designations = rec.designations?.length ? rec.designations : [{ lang: 'en', value: rec.display, preferred: true }];
    out.parents = rec.parents ?? [];
    out.properties = rec.properties ?? {};
    out.prov = rec.prov;
    await writer.write(out);
  };
  const emitAll = async (list) => { for (const r of list) await emit(r); };

  // ---- FoodData Central ---------------------------------------------------------------------
  const zipKeys = ['fdc-foundation', 'fdc-survey', 'fdc-sr-legacy', ...(NO_BRANDED ? [] : ['fdc-branded'])];
  const zips = Object.fromEntries(zipKeys.map((k) => [k, openZipStream(artifactPath(k))]));
  console.log('FDC: vocabularios…');
  const vocab = await fdcVocabRecords(zips);
  meta.conflicts.push(...vocab.conflicts);
  for (const [cs, list] of Object.entries(vocab.records)) await emitAll(list);

  const ndbIndex = new Map(); // NDB_number → [[cs, code]] (Foundation y SR Legacy), para el cruce exacto con CNF
  for (const [key, cs] of [['fdc-foundation', 'usda-fdc-foundation'], ['fdc-sr-legacy', 'usda-fdc-sr-legacy'], ['fdc-survey', 'usda-fdc-survey']]) {
    console.log(`FDC: ${cs}…`);
    const recs = await readFoods({ key, zipPath: artifactPath(key), cs });
    for (const r of recs) {
      const n = r.properties.ndb_number;
      if (n && key !== 'fdc-survey') {
        const l = ndbIndex.get(n) ?? [];
        l.push([cs, r.code]);
        ndbIndex.set(n, l);
      }
    }
    await emitAll(recs);
  }

  if (!NO_BRANDED) {
    console.log('FDC: Branded (streaming)…');
    const stats = {};
    const brandedCats = new Map();
    for await (const r of readBrandedFoods({ zipPath: artifactPath('fdc-branded'), cs: 'usda-fdc-branded', stats })) {
      const cat = r.parents[0]?.[1];
      if (cat) brandedCats.set(cat, (brandedCats.get(cat) ?? 0) + 1);
      await emit(r, branded);
      if (counts['usda-fdc-branded'] % 250000 === 0) console.log(`  …${counts['usda-fdc-branded']}`);
    }
    meta.skipped.brandedFoodWithoutBrandedRow = stats.foodWithoutBrandedRow;
    for (const [cat, n] of [...brandedCats.entries()].sort((a, b) => (a[0] < b[0] ? -1 : 1))) {
      await emit({ cs: 'usda-fdc-branded-category', code: cat, display: cat, designations: [{ lang: 'en', value: cat, preferred: true }], parents: [], properties: { branded_food_count: n }, prov: ['fdc-branded', 'branded_food.csv (branded_food_category)'] }, branded);
    }
  }

  // ---- ontologías OBO: FoodOn, CDNO, FOBI, ONS ------------------------------------------------------------
  for (const [cs, key, prefix, file] of [['foodon', 'foodon', 'FOODON', 'foodon.owl'], ['cdno', 'cdno', 'CDNO', 'cdno.owl'], ['fobi', 'fobi', 'FOBI', 'fobi.owl'], ['ons', 'ons', 'ONS', 'ons.owl']]) {
    console.log(`${cs}…`);
    const classes = parseOboClasses(readFileSync(artifactPath(key), 'utf8'), prefix);
    const o = oboRecords(classes, { cs, prov: [key, file] });
    meta.skipped[`${cs}ParentsNotDefinedInFile`] = o.danglingParents;
    await emitAll(o.records);
  }

  // ---- Ciqual ---------------------------------------------------------------------------------
  console.log('Ciqual…');
  const cq = (k) => artifactPath(k);
  const g = readGroups(cq('ciqual-alim-grp'));
  await emitAll(groupRecords({ groups: g.groups, cs: 'ciqual-food-group', prov: ['ciqual-alim-grp', 'alim_grp'] }));
  await emitAll(constituentRecords({ rows: readConstituents(cq('ciqual-const')), cs: 'ciqual-constituent', prov: ['ciqual-const', 'const'] }));
  const src = sourceRecords({ rows: readSources(cq('ciqual-sources')), cs: 'ciqual-source', prov: ['ciqual-sources', 'sources'] });
  meta.skipped.ciqualSourceWithoutCitation = src.skippedWithoutCitation;
  await emitAll(src.records);
  const comp = readComposition(cq('ciqual-compo'));
  meta.notes.ciqualCompositionRows = comp.rowCount;
  const ciqualFoods = foodRecords({ alimPath: cq('ciqual-alim'), composition: comp.byFood, groupCs: 'ciqual-food-group', cs: 'ciqual-food', prov: ['ciqual-alim', 'alim + compo'] });
  const ciqualCodes = new Set(ciqualFoods.map((f) => f.code));
  meta.skipped.ciqualCompositionFoodsNotInAlim = [...comp.byFood.keys()].filter((k) => !ciqualCodes.has(k)).length;
  await emitAll(ciqualFoods);

  // ---- Canadian Nutrient File -------------------------------------------------------------------
  console.log('CNF…');
  const cnf = cnfRecords(await readCnf(artifactPath('cnf')), { prov: ['cnf', 'CSV 2026'] });
  const ndb = linkNdb(cnf['cnf-food'], ndbIndex);
  meta.notes.cnfFoodsWithUsdaNdbCode = ndb.withNdb;
  meta.notes.cnfFoodsNdbExactMatchInFdc = ndb.exact;
  meta.notes.cnfFoodsNdbNotInFdcFoundationOrSrLegacy = ndb.missing;
  for (const k of ['cnf-food-group', 'cnf-food-source', 'cnf-nutrient-source', 'cnf-measure-type', 'cnf-measure', 'cnf-nutrient', 'cnf-food']) await emitAll(cnf[k]);

  await mainW.close();
  await branded.close();

  // ---- validación de cruces (padres que existan, por código exacto) -----------------------------------
  let orphan = 0;
  const orphanSamples = [];
  for (const [cs, code, pcs, pcode] of parentRefs) {
    if (pcs === 'usda-fdc-branded') continue;
    if (!codes.get(pcs)?.has(pcode)) {
      orphan++;
      if (orphanSamples.length < 5) orphanSamples.push([cs, code, pcs, pcode]);
    }
  }
  if (orphan) throw new Error(`${orphan} relaciones apuntan a un padre inexistente, p. ej. ${JSON.stringify(orphanSamples)}`);

  // ---- code systems + meta + SHA256SUMS ----------------------------------------------------------------
  const csLines = [];
  for (const [internalCode, def] of Object.entries(CODE_SYSTEMS)) {
    if (NO_BRANDED && def.heavy) continue;
    csLines.push({
      internalCode,
      name: def.name,
      canonicalUrl: canonicalUrlOf(internalCode),
      sourceCode: def.sourceCode,
      version: def.version,
      hierarchy: def.hierarchy,
      heavy: Boolean(def.heavy),
      concepts: counts[internalCode],
      artifacts: def.artifacts.filter((k) => manifest.artifacts[k]).map((k) => {
        const m = manifest.artifacts[k];
        return { key: k, title: ARTIFACTS[k].title, url: m.url, finalUrl: m.finalUrl, version: m.version, ...(m.commit ? { commit: m.commit } : {}), sha256: m.sha256, bytes: m.bytes, retrievedAt: m.retrievedAt, ...(m.md5 ? { md5: m.md5 } : {}), licenseId: ARTIFACTS[k].licenseId, license: m.license };
      }),
    });
  }
  await writeGzipFile(join(OUT, 'nutrition-foods-codesystems.ndjson.gz'), csLines);
  meta.counts = counts;
  meta.totalConcepts = Object.values(counts).reduce((a, b) => a + b, 0);
  meta.parts = { main: mainW.files, branded: branded.files };
  meta.noBranded = NO_BRANDED;
  writeFileSync(join(OUT, 'nutrition-foods.meta.json'), `${JSON.stringify(meta, null, 2)}\n`);

  const outFiles = readdirSync(OUT).filter((f) => /^nutrition-foods-.*\.ndjson\.gz$/.test(f) || f === 'nutrition-foods.meta.json').sort();
  const sums = outFiles.map((f) => `${sha256(join(OUT, f))}  ${f}`);
  writeFileSync(join(OUT, 'SHA256SUMS'), `${sums.join('\n')}\n`);
  for (const f of outFiles) console.log(`${(statSync(join(OUT, f)).size / 1048576).toFixed(1).padStart(7)} MB  ${f}`);
  console.log(JSON.stringify({ totalConcepts: meta.totalConcepts, counts }, null, 1));
}

main().catch((err) => {
  console.error('ERROR FATAL en build-nutrition-foods:', err);
  process.exitCode = 1;
});
