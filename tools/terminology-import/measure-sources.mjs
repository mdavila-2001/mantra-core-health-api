#!/usr/bin/env node
// =============================================================================
// TAREA-41 F3.0 — Medir antes de cargar.
//
// Baja HPO (`phenotype.hpoa`, `hp.obo`, `hp-es.babelon.tsv`), Orphanet
// (product4, product9 edades y prevalencias, product1 en castellano) y MONDO
// (`mondo.obo` + `mondo.sssom.tsv`), y cuenta términos y relaciones por fuente
// DESPUÉS de los filtros de F3.1/F3.2 (los mismos módulos puros que cargarán):
// identidad por equivalencias declaradas, sólo aspecto P, fenotipo HPO vigente,
// ORPHA de HPO fuera (entra directo por Orphanet). Con y sin etiqueta en
// castellano, sólo de fuente oficial (babelon OFFICIAL, Orphanet product1 ES,
// CIE-10-ES del glosario). Sin base de datos: no escribe nada en Postgres.
//
// Uso:
//   GLOSSARY_BUILD_DIR=<carpeta con ndjson/> node tools/terminology-import/measure-sources.mjs
//     [--sources-dir <dir>]   caché de descargas (por defecto <BUILD_DIR>/f3-sources)
//     [--refresh]             vuelve a bajar aunque el archivo exista
//     [--out <volumes.md>]    por defecto docs/progress/evidence/lane-41/F3/volumes.md
// =============================================================================

import { createHash } from 'node:crypto';
import { createReadStream, createWriteStream, existsSync, readFileSync, statSync, writeFileSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { createInterface } from 'node:readline';
import { Readable } from 'node:stream';
import { pipeline } from 'node:stream/promises';

import { API_ROOT, BUILD_DIR, USER_AGENT, ensureDir, nowIso } from './lib/glossary-es/common.mjs';
import { conceptId as glossaryConceptId } from './lib/glossary-es/load-plan.mjs';
import { buildIdentity, duplicateLabelRate, parseMondoSssom } from './lib/glossary-es/identity.mjs';
import { hpoPhenotypeConceptId, hpoaToRelationshipRows, parseBabelonOfficialLabels } from './lib/glossary-es/hpo.mjs';
import { parseHpoa } from './symptoms/lib/annotations.mjs';
import { readObo } from './symptoms/lib/obo.mjs';

const args = process.argv.slice(2);
const opt = (name, fallback) => (args.includes(name) ? args[args.indexOf(name) + 1] : fallback);
const SOURCES_DIR = resolve(opt('--sources-dir', join(BUILD_DIR, 'f3-sources')));
const OUT = resolve(opt('--out', join(API_ROOT, 'docs/progress/evidence/lane-41/F3/volumes.md')));
const REFRESH = args.includes('--refresh');
const TARGET_RELATIONS = 800_000;

const HPO_LICENSE = 'HPO license (uso libre con cita, sin modificar términos) — https://hpo.jax.org/license';
const CC_BY = 'CC BY 4.0';

export const SOURCES = [
  { key: 'hpoa', file: 'phenotype.hpoa', url: 'https://github.com/obophenotype/human-phenotype-ontology/releases/latest/download/phenotype.hpoa', license: HPO_LICENSE },
  { key: 'hpObo', file: 'hp.obo', url: 'https://github.com/obophenotype/human-phenotype-ontology/releases/latest/download/hp.obo', license: HPO_LICENSE },
  { key: 'babelon', file: 'hp-es.babelon.tsv', url: 'https://raw.githubusercontent.com/obophenotype/human-phenotype-ontology/master/src/translations/hp-es.babelon.tsv', license: HPO_LICENSE },
  { key: 'orphaProduct4', file: 'en_product4.xml', url: 'https://www.orphadata.com/data/xml/en_product4.xml', license: CC_BY },
  { key: 'orphaAges', file: 'en_product9_ages.xml', url: 'https://www.orphadata.com/data/xml/en_product9_ages.xml', license: CC_BY },
  { key: 'orphaPrev', file: 'en_product9_prev.xml', url: 'https://www.orphadata.com/data/xml/en_product9_prev.xml', license: CC_BY },
  { key: 'orphaEs', file: 'es_product1.xml', url: 'https://www.orphadata.com/data/xml/es_product1.xml', license: CC_BY },
  { key: 'mondoObo', file: 'mondo.obo', url: 'http://purl.obolibrary.org/obo/mondo.obo', license: CC_BY },
  { key: 'mondoSssom', file: 'mondo.sssom.tsv', url: 'http://purl.obolibrary.org/obo/mondo/mappings/mondo.sssom.tsv', license: CC_BY },
];

/** Archivos del glosario actual (ndjson de los importadores) que aportan fichas. */
const GLOSSARY_FILES = [
  'cie10es-diagnosticos', 'cie10es-procedimientos', 'cima', 'inlasa-aranceles',
  'medlineplus-es', 'medlineplus-es-pruebas', 'wikidata-anatomia', 'wikidata-relaciones',
];

// --- Descarga -----------------------------------------------------------------

async function download(source) {
  const path = join(SOURCES_DIR, source.file);
  if (!REFRESH && existsSync(path) && statSync(path).size > 0) return { ...source, path, cached: true };
  const res = await fetch(source.url, { redirect: 'follow', headers: { 'User-Agent': USER_AGENT } });
  if (!res.ok) throw new Error(`${source.url} → HTTP ${res.status}`);
  await pipeline(Readable.fromWeb(res.body), createWriteStream(path));
  return { ...source, path, cached: false };
}

function sha256(path) {
  return createHash('sha256').update(readFileSync(path)).digest('hex');
}

async function* lines(path) {
  const rl = createInterface({ input: createReadStream(path, { encoding: 'utf8' }), crlfDelay: Infinity });
  for await (const line of rl) yield line;
}

// --- Orphanet (lectura mínima para contar; el importador es F3.3) -------------

const disorderBlocks = (xml) => xml.split('<Disorder id="').slice(1);
const orphaCodeOf = (block) => block.match(/^\d+">\s*<OrphaCode>(\d+)<\/OrphaCode>/)?.[1] ?? null;

function orphanetPhenotypes(xml) {
  const out = [];
  for (const block of disorderBlocks(xml)) {
    const code = orphaCodeOf(block);
    if (!code) continue;
    for (const assoc of block.split('<HPODisorderAssociation ').slice(1)) {
      const hpo = assoc.match(/<HPOId>(HP:\d{7})<\/HPOId>/)?.[1];
      const frequency = assoc.match(/<HPOFrequency id="\d+">\s*<Name lang="en">([^<]*)<\/Name>/)?.[1] ?? null;
      if (hpo) out.push({ curie: `ORPHA:${code}`, hpo, frequency });
    }
  }
  return out;
}

function orphanetSpanishNames(xml) {
  const names = new Map();
  for (const block of disorderBlocks(xml)) {
    const m = block.match(/^\d+">\s*<OrphaCode>(\d+)<\/OrphaCode>\s*<ExpertLink[^>]*>[^<]*<\/ExpertLink>\s*<Name lang="es">([^<]+)<\/Name>/);
    if (m && !names.has(m[1])) names.set(m[1], m[2].trim());
  }
  return names;
}

function orphanetDisordersWith(xml, pattern) {
  let n = 0;
  for (const block of disorderBlocks(xml)) if (orphaCodeOf(block) && pattern.test(block)) n += 1;
  return n;
}

const jdborDate = (path) => readFileSync(path, 'utf8').slice(0, 2000).match(/<JDBOR date="([^"]+)"/)?.[1] ?? null;

// --- Medición -----------------------------------------------------------------

async function main() {
  ensureDir(SOURCES_DIR);
  const files = {};
  for (const s of SOURCES) {
    const d = await download(s);
    files[s.key] = { ...d, bytes: statSync(d.path).size, sha256: sha256(d.path), retrievedAt: d.cached ? statSync(d.path).mtime.toISOString() : nowIso() };
    console.log(`[fuente] ${s.file} ${files[s.key].bytes} B ${d.cached ? '(caché)' : '(bajado)'}`);
  }

  // HPO: términos vigentes y etiquetas oficiales en castellano.
  const hpTerms = new Map();
  const hpHeader = await readObo(files.hpObo.path, (t) => {
    if (t.id.startsWith('HP:')) hpTerms.set(t.id, t);
  });
  const liveHp = new Set([...hpTerms.values()].filter((t) => !t.obsolete).map((t) => t.id));
  const esHp = parseBabelonOfficialLabels(readFileSync(files.babelon.path, 'utf8'));

  // MONDO: equivalencias declaradas (axiomas equivalentTo de mondo.obo + exactMatch del SSSOM).
  const mondoTerms = new Map();
  const mondoHeader = await readObo(files.mondoObo.path, (t) => {
    if (t.id.startsWith('MONDO:')) mondoTerms.set(t.id, t);
  });
  const equivalences = [];
  for (const t of mondoTerms.values()) {
    if (t.obsolete) continue;
    for (const x of t.xrefs) if (x.qualifiers?.includes('MONDO:equivalentTo')) equivalences.push({ mondo: t.id, curie: x.id, via: 'MONDO:equivalentTo' });
  }
  const sssom = parseMondoSssom(readFileSync(files.mondoSssom.path, 'utf8')).filter((e) => !mondoTerms.get(e.mondo)?.obsolete);

  // Glosario actual: códigos CIE-10-ES y fichas (para reuso y duplicados).
  const buildNdjson = join(BUILD_DIR, 'ndjson');
  const glossaryIcd10Codes = new Set();
  const glossaryEntries = [];
  const glossaryFilesRead = [];
  for (const name of GLOSSARY_FILES) {
    const path = join(buildNdjson, `${name}.ndjson`);
    if (!existsSync(path)) continue;
    glossaryFilesRead.push(name);
    for await (const line of lines(path)) {
      if (!line.trim()) continue;
      const row = JSON.parse(line);
      if (!row.slug) continue;
      if (name === 'cie10es-diagnosticos') glossaryIcd10Codes.add(row.code);
      glossaryEntries.push({ conceptId: glossaryConceptId(row.slug), label: row.esName ?? row.display, category: row.categoryKey ?? null });
    }
  }

  const identity = buildIdentity([...equivalences, ...sssom], { glossaryIcd10Codes });

  // HPO → relaciones (mismo módulo que cargará).
  const hpoa = parseHpoa(readFileSync(files.hpoa.path, 'utf8'), { retrievedAt: files.hpoa.retrievedAt, license: HPO_LICENSE });
  const hpoVersion = hpoa.header.version;
  const resolvePhenotype = (hp) => (liveHp.has(hp) ? hpoPhenotypeConceptId(hp) : null);
  const hpo = hpoaToRelationshipRows(hpoa.rows, { resolveDisease: identity.resolve, resolvePhenotype, validFrom: hpoVersion });
  const hpoRelKeys = new Set(hpo.rows.map((r) => `${r.sourceConceptId}|${r.targetConceptId}`));
  const hpoPositive = new Set(hpo.rows.filter((r) => r.frequency !== 'EXCLUDED').map((r) => `${r.sourceConceptId}|${r.targetConceptId}`));
  const hpoPhenotypes = new Set(hpoa.rows.filter((r) => r.aspect === 'P' && liveHp.has(r.phenotype)).map((r) => r.phenotype));
  const hpoPhenotypesLoaded = new Set();
  const hpoById = new Map([...liveHp].map((hp) => [hpoPhenotypeConceptId(hp), hp]));
  for (const r of hpo.rows) hpoPhenotypesLoaded.add(hpoById.get(r.targetConceptId));
  const hpoaByDb = {};
  for (const r of hpoa.rows) if (r.aspect === 'P') hpoaByDb[r.disease.prefix] = (hpoaByDb[r.disease.prefix] ?? 0) + 1;

  // Orphanet.
  const product4 = orphanetPhenotypes(readFileSync(files.orphaProduct4.path, 'utf8'));
  const orphaEs = orphanetSpanishNames(readFileSync(files.orphaEs.path, 'utf8'));
  const orphaRelKeys = new Set();
  let orphaUnresolvedDisease = 0;
  let orphaUnresolvedPhenotype = 0;
  let orphaWithFrequency = 0;
  const orphaDisorders = new Set(product4.map((a) => a.curie));
  const orphaPhenotypes = new Set();
  for (const a of product4) {
    const d = identity.resolve(a.curie);
    if (!d.conceptId) {
      orphaUnresolvedDisease += 1;
      continue;
    }
    if (!liveHp.has(a.hpo)) {
      orphaUnresolvedPhenotype += 1;
      continue;
    }
    if (a.frequency) orphaWithFrequency += 1;
    orphaPhenotypes.add(a.hpo);
    orphaRelKeys.add(`${d.conceptId}|${hpoPhenotypeConceptId(a.hpo)}`);
  }
  const agesXml = readFileSync(files.orphaAges.path, 'utf8');
  const prevXml = readFileSync(files.orphaPrev.path, 'utf8');
  const orphaWithOnset = orphanetDisordersWith(agesXml, /<AverageAgeOfOnset id=/);
  const orphaWithInheritance = orphanetDisordersWith(agesXml, /<TypeOfInheritance id=/);
  const orphaWithPrevalence = orphanetDisordersWith(prevXml, /<Prevalence id=/);

  // MONDO SUBCLASS_OF entre clases vigentes con grupo de identidad.
  let mondoIsA = 0;
  let mondoIsAInGroups = 0;
  const liveMondo = [...mondoTerms.values()].filter((t) => !t.obsolete);
  for (const t of liveMondo) {
    for (const parent of t.isA) {
      if (!parent.startsWith('MONDO:') || mondoTerms.get(parent)?.obsolete) continue;
      mondoIsA += 1;
      if (identity.groups.get(t.id)?.conceptId && identity.groups.get(parent)?.conceptId) mondoIsAInGroups += 1;
    }
  }

  // Etiqueta en castellano de los grupos MONDO: reusado (ficha CIE-10-ES) u Orphanet ES.
  const groupSpanish = (g) => {
    if (g.status === 'reused') return true;
    return g.codes.some((c) => c.startsWith('ORPHA:') && orphaEs.has(c.slice(6)));
  };
  const groups = [...identity.groups.values()];
  const groupsEs = groups.filter((g) => g.conceptId && groupSpanish(g)).length;

  // Duplicados por etiqueta: glosario actual, y glosario + lo que F3 agrega con etiqueta ES.
  const baseline = duplicateLabelRate(glossaryEntries);
  const additions = [];
  for (const g of groups) {
    if (g.status !== 'created') continue;
    const orpha = g.codes.find((c) => c.startsWith('ORPHA:') && orphaEs.has(c.slice(6)));
    if (orpha) additions.push({ conceptId: g.conceptId, label: orphaEs.get(orpha.slice(6)), category: 'disease' });
  }
  for (const hp of hpoPhenotypesLoaded) if (esHp.has(hp)) additions.push({ conceptId: hpoPhenotypeConceptId(hp), label: esHp.get(hp), category: 'signs-symptoms' });
  const projected = duplicateLabelRate([...glossaryEntries, ...additions]);

  const symptomRelations = new Set([...hpoRelKeys, ...orphaRelKeys]);
  const projectedTotal = symptomRelations.size + mondoIsAInGroups;

  const result = {
    measuredAt: nowIso(),
    sources: Object.fromEntries(Object.entries(files).map(([k, f]) => [k, { file: f.file, url: f.url, bytes: f.bytes, sha256: f.sha256, retrievedAt: f.retrievedAt, license: f.license }])),
    versions: {
      hpoa: hpoVersion,
      hpObo: hpHeader.dataVersion,
      mondo: mondoHeader.dataVersion,
      orphanetProduct4: jdborDate(files.orphaProduct4.path),
      orphanetProduct9Ages: jdborDate(files.orphaAges.path),
      orphanetProduct9Prev: jdborDate(files.orphaPrev.path),
      orphanetProduct1Es: jdborDate(files.orphaEs.path),
    },
    glossaryFilesRead,
    hpo: {
      termsLive: liveHp.size,
      termsLiveWithEs: [...liveHp].filter((hp) => esHp.has(hp)).length,
      babelonOfficialLabels: esHp.size,
      hpoaRowsAspectP: Object.values(hpoaByDb).reduce((a, b) => a + b, 0),
      hpoaRowsAspectPByDatabase: hpoaByDb,
      phenotypesUsed: hpoPhenotypes.size,
      phenotypesLoaded: hpoPhenotypesLoaded.size,
      phenotypesLoadedWithEs: [...hpoPhenotypesLoaded].filter((hp) => esHp.has(hp)).length,
      evidenceRows: hpo.rows.length,
      relations: hpoRelKeys.size,
      relationsPositive: hpoPositive.size,
      stats: hpo.stats,
      unresolvedDiseases: hpo.unresolvedDiseases,
    },
    orphanet: {
      associations: product4.length,
      disorders: orphaDisorders.size,
      disordersWithEs: [...orphaDisorders].filter((c) => orphaEs.has(c.slice(6))).length,
      spanishNames: orphaEs.size,
      unresolvedDisease: orphaUnresolvedDisease,
      unresolvedPhenotype: orphaUnresolvedPhenotype,
      associationsWithFrequency: orphaWithFrequency,
      relations: orphaRelKeys.size,
      relationsAlsoInHpo: [...orphaRelKeys].filter((k) => hpoRelKeys.has(k)).length,
      phenotypes: orphaPhenotypes.size,
      phenotypesWithEs: [...orphaPhenotypes].filter((hp) => esHp.has(hp)).length,
      properties: { disordersWithOnset: orphaWithOnset, disordersWithInheritance: orphaWithInheritance, disordersWithPrevalence: orphaWithPrevalence },
    },
    mondo: {
      classesLive: liveMondo.length,
      equivalenceAxioms: equivalences.length,
      sssomExactMatch: sssom.length,
      identity: { ...identity.report, conflicts: identity.report.conflicts.length },
      conflictsByKind: identity.report.conflicts.reduce((acc, c) => ({ ...acc, [c.kind]: (acc[c.kind] ?? 0) + 1 }), {}),
      groupsWithEs: groupsEs,
      isA: mondoIsA,
      isAInGroups: mondoIsAInGroups,
    },
    duplicates: { baseline, projected, additionsWithEs: additions.length },
    projected: { symptomRelations: symptomRelations.size, subclassRelations: mondoIsAInGroups, total: projectedTotal, target: TARGET_RELATIONS, belowTarget: projectedTotal < TARGET_RELATIONS },
  };

  ensureDir(resolve(OUT, '..'));
  writeFileSync(OUT.replace(/\.md$/, '.json'), `${JSON.stringify(result, null, 2)}\n`);
  writeFileSync(OUT.replace(/\.md$/, '.conflicts.json'), `${JSON.stringify(identity.report.conflicts, null, 1)}\n`);
  writeFileSync(OUT, renderMarkdown(result));
  console.log(JSON.stringify(result.projected));
  console.log(`[ok] ${OUT}`);
}

const n = (x) => Number(x).toLocaleString('es-ES').replace(/\./g, ' ');
const pct = (x) => `${(x * 100).toFixed(2).replace('.', ',')} %`;

function renderMarkdown(r) {
  const s = r.sources;
  const src = (k) => `| \`${s[k].file}\` | ${s[k].url} | ${n(s[k].bytes)} | \`${s[k].sha256.slice(0, 16)}…\` | ${s[k].license} |`;
  return `# TAREA-41 F3.0 — Volúmenes medidos (antes de cargar)

Generado por \`tools/terminology-import/measure-sources.mjs\` el ${r.measuredAt}. Sin base de
datos: cuenta lo que entraría **después de los filtros** de F3.1 (identidad) y F3.2 (HPO), con
los mismos módulos puros que usará la carga.

## Veredicto

**Total proyectado: ${n(r.projected.total)} relaciones** (${n(r.projected.symptomRelations)} enfermedad → fenotipo
de HPO ∪ Orphanet + ${n(r.projected.subclassRelations)} \`SUBCLASS_OF\` de MONDO). ${
    r.projected.belowTarget
      ? `**Queda por debajo de las ${n(r.projected.target)} que pide la ficha.** Según F3.0 se informa al propietario antes de seguir, y el hueco no se rellena con fuentes de menor calidad. Falta medir MRCOC (F3.5), Wikidata ampliado (F3.6) y la jerarquía DOID/MeSH/CIE-10 (F3.4); este corte no las incluye.`
      : `Supera las ${n(r.projected.target)} de la ficha.`
  }

## Fuentes y versiones

| Archivo | URL | Bytes | SHA-256 | Licencia |
|---|---|---:|---|---|
${Object.keys(s).map(src).join('\n')}

Versiones: HPOA \`${r.versions.hpoa}\` · hp.obo \`${r.versions.hpObo}\` · MONDO \`${r.versions.mondo}\` ·
Orphanet product4 \`${r.versions.orphanetProduct4}\` · product9 edades \`${r.versions.orphanetProduct9Ages}\` ·
product9 prevalencias \`${r.versions.orphanetProduct9Prev}\` · product1 ES \`${r.versions.orphanetProduct1Es}\`.
\`hp-es.babelon.tsv\` se baja de \`master\` (HPO no lo publica como asset de release); se usan sólo
las filas \`rdfs:label\` con \`translation_status = OFFICIAL\`.

## Conteos por fuente

| Fuente | Términos (después de filtros) | Con etiqueta ES oficial | Relaciones (pares únicos) | Filas de evidencia |
|---|---:|---:|---:|---:|
| HPO \`phenotype.hpoa\` (sin ORPHA) | ${n(r.hpo.phenotypesLoaded)} fenotipos | ${n(r.hpo.phenotypesLoadedWithEs)} | ${n(r.hpo.relations)} (${n(r.hpo.relationsPositive)} positivas) | ${n(r.hpo.evidenceRows)} |
| Orphanet product4 | ${n(r.orphanet.phenotypes)} fenotipos · ${n(r.orphanet.disorders)} trastornos | ${n(r.orphanet.phenotypesWithEs)} fenotipos · ${n(r.orphanet.disordersWithEs)} trastornos | ${n(r.orphanet.relations)} (${n(r.orphanet.relationsAlsoInHpo)} ya en HPO) | ${n(r.orphanet.associations)} asociaciones |
| MONDO (identidad) | ${n(r.mondo.identity.groups)} grupos | ${n(r.mondo.groupsWithEs)} | ${n(r.mondo.isAInGroups)} \`SUBCLASS_OF\` | — |
| **Unión proyectada** | | | **${n(r.projected.total)}** | |

Universo HPO: ${n(r.hpo.termsLive)} términos vigentes, ${n(r.hpo.termsLiveWithEs)} con etiqueta oficial en castellano
(${n(r.hpo.babelonOfficialLabels)} filas OFFICIAL en babelon). Filas HPOA de aspecto P por base:
${Object.entries(r.hpo.hpoaRowsAspectPByDatabase).map(([k, v]) => `${k} ${n(v)}`).join(' · ')}.

Orphanet product9 (irán a \`concept_properties\`, no son relaciones): ${n(r.orphanet.properties.disordersWithOnset)} trastornos con
edad de inicio, ${n(r.orphanet.properties.disordersWithInheritance)} con herencia, ${n(r.orphanet.properties.disordersWithPrevalence)} con prevalencia.

## Filtros aplicados a HPO (F3.2)

\`\`\`json
${JSON.stringify({ stats: r.hpo.stats, unresolvedDiseases: r.hpo.unresolvedDiseases }, null, 2)}
\`\`\`

## Identidad (F3.1)

Equivalencias leídas: ${n(r.mondo.equivalenceAxioms)} axiomas \`MONDO:equivalentTo\` de mondo.obo + ${n(r.mondo.sssomExactMatch)}
\`skos:exactMatch\` del SSSOM, sobre ${n(r.mondo.classesLive)} clases MONDO vigentes.

| Grupos | Creados (pivote MONDO del catálogo #688) | Reusados (ficha CIE-10-ES del glosario) | En revisión | Códigos que resuelven | Conflictos |
|---:|---:|---:|---:|---:|---:|
| ${n(r.mondo.identity.groups)} | ${n(r.mondo.identity.created)} | ${n(r.mondo.identity.reused)} | ${n(r.mondo.identity.inReview)} | ${n(r.mondo.identity.codesMapped)} | ${n(r.mondo.identity.conflicts)} |

Conflictos por tipo: ${Object.entries(r.mondo.conflictsByKind).map(([k, v]) => `\`${k}\` ${n(v)}`).join(' · ') || 'ninguno'}. Lista completa
en \`volumes.conflicts.json\`; **no se resolvieron a mano**.

### Duplicados por etiqueta igual

| Conjunto | Conceptos | Duplicados | Tasa | Entre categorías distintas | Tasa |
|---|---:|---:|---:|---:|---:|
| Glosario actual (${r.glossaryFilesRead.join(', ')}) | ${n(r.duplicates.baseline.totalConcepts)} | ${n(r.duplicates.baseline.duplicateConcepts)} | ${pct(r.duplicates.baseline.duplicateRate)} | ${n(r.duplicates.baseline.acrossCategoryDuplicates)} | ${pct(r.duplicates.baseline.acrossCategoryRate)} |
| + lo que F3 agrega con etiqueta ES (${n(r.duplicates.additionsWithEs)}) | ${n(r.duplicates.projected.totalConcepts)} | ${n(r.duplicates.projected.duplicateConcepts)} | ${pct(r.duplicates.projected.duplicateRate)} | ${n(r.duplicates.projected.acrossCategoryDuplicates)} | ${pct(r.duplicates.projected.acrossCategoryRate)} |

Ejemplos (glosario + F3): ${r.duplicates.projected.examples.map((e) => `«${e.label}» ×${e.concepts} (${e.categories.join('/')})`).join(' · ')}.
`;
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
