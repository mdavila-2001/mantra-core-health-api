#!/usr/bin/env node
// =============================================================================
// ETL de genética, etapa 1 (build): crudos de `fetch-genetics-sources.mjs` →
// corpus normalizado NDJSON en `<OUT_DIR>/ndjson/<code system>.ndjson`
// (una fila de `lib/rows.mjs` por línea) + `coverage.json` con los conteos.
// Reproducible: mismas fuentes (mismo manifest) → mismos bytes.
//
// Uso:
//   GLOSSARY_BUILD_DIR=… node --max-old-space-size=2500 tools/terminology-import/genetics/build-genetics-corpus.mjs
//   … --only hgnc,so         # reconstruye sólo esos sistemas (los demás quedan como estaban)
//   … --delete-raw           # borra cada crudo en cuanto se normalizó (disco justo)
// =============================================================================

import { createWriteStream, existsSync, readFileSync, rmSync } from 'node:fs';
import { once } from 'node:events';
import { join } from 'node:path';
import { ensureDir, writeJson } from '../lib/glossary-es/common.mjs';
import { OUT_DIR, SOURCES_DIR, sourceByKey, sourcePath } from './lib/sources.mjs';
import { provenance } from './lib/rows.mjs';
import { groupRows, hgncRows, readFamilies, readWithdrawn } from './lib/hgnc.mjs';
import { ncbiGeneRows } from './lib/ncbi-gene.mjs';
import { medgenRows } from './lib/medgen.mjs';
import { soRows } from './lib/so.mjs';
import { clinvarCategoryRows, clinvarFunctionalRows, clinvarTermRows } from './lib/clinvar-vocab.mjs';
import { readDiseaseNameCategories, readGeneConditions } from './lib/clinvar-conditions.mjs';
import { readDelimited } from './lib/delimited.mjs';
import { clingenTermRows } from './lib/clingen.mjs';
import { hgvsRows } from './lib/hgvs.mjs';
import { vrsRows } from './lib/vrs.mjs';

const args = process.argv.slice(2);
const ONLY = args.includes('--only') ? new Set(args[args.indexOf('--only') + 1].split(',')) : null;
const DELETE_RAW = args.includes('--delete-raw');
const p = (key) => sourcePath(sourceByKey(key).file);
const ND_DIR = join(OUT_DIR, 'ndjson');

async function writeNdjson(name, rows) {
  ensureDir(ND_DIR);
  const out = createWriteStream(join(ND_DIR, `${name}.ndjson`));
  for (const r of rows) if (!out.write(JSON.stringify(r) + '\n')) await once(out, 'drain');
  out.end();
  await once(out, 'finish');
}

const dropRaw = (...keys) => {
  if (!DELETE_RAW) return;
  for (const k of keys) rmSync(p(k), { force: true });
};

/** Duplicados por (sistema, código): el corpus no puede traerlos. */
function assertUnique(name, rows) {
  const seen = new Set();
  for (const r of rows) {
    if (seen.has(r.code)) throw new Error(`${name}: código repetido ${r.code}`);
    seen.add(r.code);
  }
}

const BUILDERS = {
  async hgnc() {
    const prov = provenance(['hgnc-complete', 'hgnc-withdrawn']);
    const w = await readWithdrawn(p('hgnc-withdrawn'));
    const { rows, header } = await hgncRows(p('hgnc-complete'), prov, w.byTarget);
    return { rows, extra: { columns: header.length, withdrawn: w.stats, genesWithRetiredIds: rows.filter((r) => r.properties.some((x) => x[0] === 'retired_ids')).length } };
  },
  async 'hgnc-gene-group'() {
    const fam = await readFamilies(join(SOURCES_DIR, 'hgnc'));
    const prov = provenance(['hgnc-family', 'hgnc-hierarchy', 'hgnc-gene-has-family'], { versionKey: 'hgnc-family' });
    const rows = groupRows(fam, prov);
    return { rows, extra: { hierarchyEdges: fam.hierarchy.length, geneMemberships: fam.geneHasFamily.length } };
  },
  async 'ncbi-gene-hs'() {
    const cond = await readGeneConditions(p('clinvar-gene-condition'));
    const { rows } = await ncbiGeneRows(p('ncbi-gene-info-hs'), provenance(['ncbi-gene-info-hs', 'clinvar-gene-condition']), cond.byGene);
    const mim = await readDelimited(p('ncbi-mim2gene-medgen'), () => {}, { quote: null, stripHash: true });
    const linked = rows.filter((r) => r.properties.some((x) => x[0] === 'medgen_condition_links')).length;
    const unmatched = [...cond.byGene.keys()].filter((g) => !rows.some((r) => r.code === g));
    const byType = {};
    for (const r of rows) {
      const t = r.properties.find((x) => x[0] === 'type_of_gene')?.[2];
      byType[t] = (byType[t] ?? 0) + 1;
    }
    return { rows, extra: { byTypeOfGene: byType, mim2geneMedgenRowsNotLoaded: mim.rows, geneConditionRows: cond.rows, genesWithConditionLinks: linked, geneConditionGeneIdsNotInGeneInfo: unmatched.length } };
  },
  async medgen() {
    const dn = await readDiseaseNameCategories(p('clinvar-disease-names'));
    const prov = provenance(['medgen-mgconso', 'medgen-mgdef', 'medgen-mgsty', 'medgen-idmappings', 'medgen-mgrel', 'medgen-merged', 'medgen-cui-history', 'clinvar-concept-history'], { versionKey: 'medgen-mgconso' });
    const { rows, dropped, stats } = await medgenRows({ mgconso: p('medgen-mgconso'), mgsty: p('medgen-mgsty'), mgdef: p('medgen-mgdef'), idmappings: p('medgen-idmappings'), mgrel: p('medgen-mgrel'), merged: p('medgen-merged'), cuiHistory: p('medgen-cui-history'), clinvarHistory: p('clinvar-concept-history'), clinvarCategories: dn.byConcept }, prov);
    const withCat = rows.filter((r) => r.properties.some((x) => x[0] === 'clinvar_condition_categories')).length;
    return { rows, extra: { ...stats, cuisDropped: dropped.length, cuisWithClinvarCategory: withCat, clinvarConceptIdsInDiseaseNames: dn.byConcept.size } };
  },
  async 'sequence-ontology'() {
    const { rows, stats } = await soRows(p('so-obo'), provenance(['so-obo']));
    return { rows, extra: stats };
  },
  async 'clinvar-terms'() {
    const templates = [['SubmissionTemplate', 'clinvar-template'], ['SubmissionTemplateLite', 'clinvar-template-lite'], ['SubmissionTemplateSomatic', 'clinvar-template-somatic'], ['SubmissionTemplateFunctionalData', 'clinvar-template-functional']].map(([name, key]) => ({ name, path: p(key), prov: provenance([key]) }));
    const rows = clinvarTermRows({ templates, xsdPath: p('clinvar-xsd') }, provenance(['clinvar-xsd']));
    const dn = await readDiseaseNameCategories(p('clinvar-disease-names'));
    rows.push(...clinvarCategoryRows(dn.categories, provenance(['clinvar-disease-names'])));
    return { rows, extra: { diseaseNamesRows: dn.rows, diseaseNameCategories: Object.fromEntries(dn.categories) } };
  },
  async 'clinvar-functional'() {
    const { rows, stats } = clinvarFunctionalRows({ consequencesPath: p('clinvar-functional-consequences'), assaysPath: p('clinvar-functional-assay-types') }, provenance(['clinvar-functional-consequences']), provenance(['clinvar-functional-assay-types']));
    return { rows, extra: stats };
  },
  async 'clingen-terms'() {
    const { rows, stats } = await clingenTermRows({ validityPath: p('clingen-gene-validity'), dosagePath: p('clingen-dosage'), actionabilityPaths: [p('clingen-actionability-adult'), p('clingen-actionability-pediatric')] }, provenance(['clingen-gene-validity']), provenance(['clingen-dosage']), [provenance(['clingen-actionability-adult']), provenance(['clingen-actionability-pediatric'])]);
    return { rows, extra: stats };
  },
  async 'hgvs-syntax'() {
    return { rows: hgvsRows(p('hgvs-syntax'), provenance(['hgvs-syntax'])).rows, extra: {} };
  },
  async 'ga4gh-vrs'() {
    return { rows: vrsRows(p('vrs-schema'), provenance(['vrs-schema'])).rows, extra: {} };
  },
};

/** Fuentes crudas que se pueden borrar una vez normalizado cada sistema (los grupos de HGNC comparten carpeta con hgnc). */
const RAW_OF = {
  hgnc: ['hgnc-complete', 'hgnc-withdrawn'],
  'hgnc-gene-group': ['hgnc-family', 'hgnc-hierarchy', 'hgnc-gene-has-family'],
  'ncbi-gene-hs': ['ncbi-gene-info-hs'],
  medgen: ['medgen-mgconso', 'medgen-mgdef', 'medgen-mgsty', 'medgen-idmappings', 'medgen-mgrel', 'medgen-merged', 'medgen-cui-history', 'clinvar-concept-history'],
};

async function main() {
  const coveragePath = join(OUT_DIR, 'coverage.json');
  // --only conserva los conteos de los sistemas que no se reconstruyen.
  const coverage = ONLY && existsSync(coveragePath) ? JSON.parse(readFileSync(coveragePath, 'utf8')) : { systems: {} };
  for (const [name, build] of Object.entries(BUILDERS)) {
    if (ONLY && !ONLY.has(name)) continue;
    const t0 = Date.now();
    const { rows, extra } = await build();
    assertUnique(name, rows);
    await writeNdjson(name, rows);
    coverage.systems[name] = { rows: rows.length, version: rows[0]?.version ?? null, ...extra };
    console.log(`[build] ${name}: ${rows.length} filas (${Math.round((Date.now() - t0) / 1000)} s)`);
    dropRaw(...(RAW_OF[name] ?? []));
  }
  writeJson(coveragePath, coverage, true);
  console.log(`[build] coverage.json → ${coveragePath}`);
}

main().catch((err) => {
  console.error('ERROR FATAL en build-genetics-corpus:', err);
  process.exitCode = 1;
});
