#!/usr/bin/env node
// =============================================================================
// ETL etapa 2 (build, sin red): archivos de `dictionaries-sources/` → corpus
// normalizado en `glossary-data-build/dictionaries/ndjson/`:
//   <fuente>.ndjson         un concepto por línea (esquema en README.md)
//   disease-agents.ndjson   aristas enfermedad → organismo (Mondo, DOID)
//   <fuente>.meta.json      archivo leído (URL, SHA-256, fecha), conteos
//   ../coverage.json        reporte de cobertura por dominio y fuente
//
// Se construye TODO (también las fuentes opt-in); qué se carga lo decide
// load-dictionaries.mjs. Determinista: misma entrada → mismos bytes.
//
// Uso: node tools/terminology-import/dictionaries/build-dictionaries.mjs
// =============================================================================

import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { nowIso, writeJson, writeNdjson } from '../lib/glossary-es/common.mjs';
import { parseObo } from './lib/obo.mjs';
import { parseOfn, parseRdfXml } from './lib/owl.mjs';
import { oboSourceRows, humanLineage } from './lib/terms.mjs';
import { doidAgentEdges, mergeTaxa, mondoAgentEdges, parentsMap, selectTaxa, taxaFromObo, taxaFromObographs, taxonRow } from './lib/organisms.mjs';
import { hgncRows } from './lib/hgnc.mjs';
import { abbreviationRows, parseMetainventory } from './lib/abbreviations.mjs';
import { ABBREVIATION_SOURCE, FMA_SOURCE, HGNC_SOURCE, OBO_SOURCES, ORGANISM_SOURCES, PREFIX_CODE_SYSTEM } from './lib/sources.mjs';
import { fmaRows, parseFma } from './lib/fma.mjs';
import { MANIFEST_PATH, NDJSON_DIR, REPORT_PATH, SOURCES_DIR } from './lib/paths.mjs';
import { coverageFor } from './lib/coverage.mjs';

const manifest = JSON.parse(readFileSync(MANIFEST_PATH, 'utf8'));

/** Archivo fuente ya bajado + su entrada de manifiesto (url, sha256, retrievedAt). */
function sourceFile(sourceId, f) {
  const path = join(SOURCES_DIR, sourceId, f.name);
  const m = manifest.files[`${sourceId}/${f.name}`];
  if (!existsSync(path) || !m) return null;
  if (m.url !== f.url) throw new Error(`${sourceId}/${f.name}: el archivo en disco es de ${m.url}, no de ${f.url}; corré fetch-dictionaries.mjs --refresh ${sourceId}`);
  return { path, url: m.url, sha256: m.sha256, retrievedAt: m.retrievedAt, bytes: m.bytes, version: f.version ?? null };
}

async function main() {
  const t0 = Date.now();
  const layers = [];
  const missing = [];

  // --- Organismos primero: dan también el linaje humano para filtrar Uberon/CL.
  const of = Object.fromEntries(Object.entries(ORGANISM_SOURCES.files).map(([k, f]) => [k, sourceFile(ORGANISM_SOURCES.id, f)]));
  if (Object.values(of).some((x) => !x)) throw new Error('Faltan archivos de organismos (mondo-edit.obo, ncbitaxon_import.obo, doid-merged.json): corré fetch-dictionaries.mjs');
  const mondo = parseObo(readFileSync(of.mondoEdit.path, 'utf8'));
  const doid = JSON.parse(readFileSync(of.doidMerged.path, 'utf8'));
  const { taxa, conflicts } = mergeTaxa(taxaFromObographs(doid, 'doidMerged'), taxaFromObo(parseObo(readFileSync(of.mondoTaxa.path, 'utf8')), 'mondoTaxa'));
  const lineage = humanLineage(parentsMap(taxa));
  const edges = [
    ...mondoAgentEdges(mondo).map((e) => ({ ...e, provenance: { file: of.mondoEdit.url, sha256: of.mondoEdit.sha256, retrievedAt: of.mondoEdit.retrievedAt, version: of.mondoEdit.version, license: 'CC BY 4.0', uri: `http://purl.obolibrary.org/obo/${e.diseaseId.replace(':', '_')}` } })),
    ...doidAgentEdges(doid).map((e) => ({ ...e, provenance: { file: of.doidMerged.url, sha256: of.doidMerged.sha256, retrievedAt: of.doidMerged.retrievedAt, version: of.doidMerged.version, license: 'CC0 1.0', uri: `http://purl.obolibrary.org/obo/${e.diseaseId.replace(':', '_')}` } })),
  ];
  const { selected, missingLabels } = selectTaxa(taxa, edges);
  const agentOf = new Map();
  for (const e of edges) {
    if (!agentOf.has(e.target)) agentOf.set(e.target, []);
    agentOf.get(e.target).push({ disease: e.diseaseId, type: e.type, predicate: e.predicate });
  }
  const taxonRows = [...selected].sort().map((id) => taxonRow(taxa.get(id), ORGANISM_SOURCES, of, agentOf.get(id)));
  layers.push({ source: ORGANISM_SOURCES, rows: taxonRows, stats: { taxaAvailable: taxa.size, selected: selected.size, edges: edges.length, edgesMondo: edges.filter((e) => e.diseaseSystem === 'mondo').length, edgesDoid: edges.filter((e) => e.diseaseSystem === 'doid').length, targetsWithoutLabel: missingLabels, labelConflicts: conflicts }, files: Object.values(of) });

  // --- OBO.
  for (const s of OBO_SOURCES) {
    const file = sourceFile(s.id, s.files[0]);
    if (!file) { missing.push(s.id); console.warn(`[build] sin archivo (se omite): ${s.id}`); continue; }
    const parse = { obo: parseObo, ofn: parseOfn, rdfxml: parseRdfXml }[s.format ?? 'obo'];
    const { rows, stats } = oboSourceRows(parse(readFileSync(file.path, 'utf8')), s, file, { lineage });
    layers.push({ source: s, rows, stats, files: [file] });
  }

  // --- FMA (después de Uberon: los xrefs FMA de Uberon marcan su núcleo).
  const ff = sourceFile(FMA_SOURCE.id, FMA_SOURCE.files[0]);
  if (ff) {
    const uberon = layers.find((l) => l.source.id === 'uberon')?.rows ?? [];
    const uberonFmaXrefs = new Set(uberon.flatMap((r) => r.xrefs.map((x) => x.id)).filter((x) => x.startsWith('FMA:')));
    const { rows, stats } = fmaRows(parseFma(readFileSync(ff.path, 'utf8')), FMA_SOURCE, ff, { uberonFmaXrefs });
    layers.push({ source: FMA_SOURCE, rows, stats, files: [ff] });
  } else missing.push(FMA_SOURCE.id);

  // --- HGNC.
  const hf = sourceFile(HGNC_SOURCE.id, HGNC_SOURCE.files[0]);
  if (hf) {
    const { rows, stats } = hgncRows(JSON.parse(readFileSync(hf.path, 'utf8')), HGNC_SOURCE, hf);
    layers.push({ source: HGNC_SOURCE, rows, stats, files: [hf] });
  } else missing.push(HGNC_SOURCE.id);

  // --- Abreviaturas (todo el metainventario; la carga filtra lo clínico).
  const af = sourceFile(ABBREVIATION_SOURCE.id, ABBREVIATION_SOURCE.files[0]);
  if (af) {
    const { rows, stats } = abbreviationRows(parseMetainventory(readFileSync(af.path, 'utf8')), ABBREVIATION_SOURCE, af);
    layers.push({ source: ABBREVIATION_SOURCE, rows, stats, files: [af] });
  } else missing.push(ABBREVIATION_SOURCE.id);

  // --- Unicidad por code system + código, y resolución de aristas internas.
  const byKey = new Map();
  for (const l of layers) {
    for (const r of l.rows) {
      if (byKey.has(r.key)) throw new Error(`Concepto repetido: ${r.key} (${l.source.id} y ${byKey.get(r.key).provenance.sourceId})`);
      byKey.set(r.key, r);
    }
  }
  for (const l of layers) {
    const rel = { resolved: 0, unresolved: 0, unresolvedByPrefix: {} };
    for (const r of l.rows) {
      for (const x of r.relations) {
        const prefix = x.target.split(':')[0];
        const tk = PREFIX_CODE_SYSTEM[prefix] ? `${PREFIX_CODE_SYSTEM[prefix]}|${x.target}` : null;
        x.targetKey = tk && byKey.has(tk) ? tk : null;
        if (x.targetKey) rel.resolved++;
        else { rel.unresolved++; rel.unresolvedByPrefix[prefix] = (rel.unresolvedByPrefix[prefix] ?? 0) + 1; }
      }
    }
    l.stats.relations = rel;
  }

  // --- Escritura.
  for (const l of layers) {
    await writeNdjson(join(NDJSON_DIR, `${l.source.id}.ndjson`), l.rows);
    writeJson(join(NDJSON_DIR, `${l.source.id}.meta.json`), { source: l.source.id, codeSystem: l.source.codeSystem, domain: l.source.domain, load: l.source.load, license: l.source.license, files: l.files.map(({ path, ...f }) => f), generatedAt: nowIso(), stats: l.stats }, true);
    console.log(`[build] ${l.source.id}: ${l.rows.length} conceptos`);
  }
  await writeNdjson(join(NDJSON_DIR, 'disease-agents.ndjson'), edges);
  const coverage = coverageFor(layers, edges, { missing });
  writeJson(REPORT_PATH, { generatedAt: nowIso(), seconds: Math.round((Date.now() - t0) / 1000), ...coverage }, true);
  console.log(JSON.stringify(coverage.totals, null, 2));
  console.log(`Corpus en ${NDJSON_DIR}; cobertura en ${REPORT_PATH}`);
}

main().catch((err) => {
  console.error('ERROR FATAL en build-dictionaries:', err);
  process.exitCode = 1;
});
