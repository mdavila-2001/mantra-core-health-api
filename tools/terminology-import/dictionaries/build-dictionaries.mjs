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

import { createReadStream, createWriteStream, existsSync, readFileSync, renameSync, rmSync } from 'node:fs';
import { createInterface } from 'node:readline';
import { join } from 'node:path';
import { nowIso, writeJson, writeNdjson } from '../lib/glossary-es/common.mjs';
import { parseObo, parseOboFile } from './lib/obo.mjs';
import { parseOfn, parseRdfXml } from './lib/owl.mjs';
import { oboSourceRows, humanLineage } from './lib/terms.mjs';
import { doidAgentEdges, mergeTaxa, mondoAgentEdges, parentsMap, selectTaxa, taxaFromObo, taxaFromObographs, taxonRow } from './lib/organisms.mjs';
import { hgncRows } from './lib/hgnc.mjs';
import { abbreviationRows, parseMetainventory } from './lib/abbreviations.mjs';
import { ABBREVIATION_SOURCE, ABREMES_SOURCE, C7_OBO_SOURCES, EMDN_SOURCE, FMA_SOURCE, HGNC_SOURCE, MESH_SOURCE, OBO_SOURCES, ORGANISM_SOURCES, corpusKey } from './lib/sources.mjs';
import { crossCheckLabels, readDeleted, readMerged, readNames, readNodes, taxaFromTaxdump, taxdumpWanted } from './lib/taxdump.mjs';
import { descriptorRecords, meshRows, parseDescriptor } from './lib/mesh.mjs';
import { emdnRows, readXlsxFirstSheet } from './lib/emdn.mjs';
import { abremesRows, parsePairs } from './lib/abremes.mjs';
import { readZipEntry } from './lib/zip-mini.mjs';
import { fmaRows, parseFma } from './lib/fma.mjs';
import { MANIFEST_PATH, NDJSON_DIR, REPORT_PATH, SOURCES_DIR } from './lib/paths.mjs';
import { combineCoverage, layerCoverage } from './lib/coverage.mjs';

const manifest = JSON.parse(readFileSync(MANIFEST_PATH, 'utf8'));

/** Archivo fuente ya bajado + su entrada de manifiesto (url, sha256, retrievedAt). */
function sourceFile(sourceId, f) {
  const path = join(SOURCES_DIR, sourceId, f.name);
  const m = manifest.files[`${sourceId}/${f.name}`];
  if (!existsSync(path) || !m) return null;
  if (m.url !== f.url) throw new Error(`${sourceId}/${f.name}: el archivo en disco es de ${m.url}, no de ${f.url}; corré fetch-dictionaries.mjs --refresh ${sourceId}`);
  return { path, url: m.url, sha256: m.sha256, retrievedAt: m.retrievedAt, bytes: m.bytes, version: f.version ?? null };
}

/** Tags OBO que ninguna fila usa (y que en archivos de 250 MB pesan cientos de MB en memoria). */
const UNUSED_TAGS = new Set(['comment', 'intersection_of', 'consider', 'replaced_by']);
const args = process.argv.slice(2);
/** `--reuse hgnc`: fuentes cuyo ndjson ya empaquetado se conserva tal cual (su URL no está fijada y volver a bajarla cambiaría la versión). */
const REUSE = new Set(args.includes('--reuse') ? args[args.indexOf('--reuse') + 1].split(',') : []);

/** Escribe filas en streaming (misma serialización que writeNdjson). */
async function writeRowsStream(path, rows) {
  const out = createWriteStream(path, { encoding: 'utf8' });
  for await (const row of rows) if (!out.write(JSON.stringify(row) + '\n')) await new Promise((r) => out.once('drain', r));
  await new Promise((r, j) => out.end((e) => (e ? j(e) : r())));
}

async function* readRowsStream(path) {
  const rl = createInterface({ input: createReadStream(path, { encoding: 'utf8' }), crlfDelay: Infinity });
  for await (const line of rl) if (line.trim() !== '') yield JSON.parse(line);
}

async function main() {
  const t0 = Date.now();
  const missing = [];
  // Para no tener todo el corpus en memoria: cada capa se escribe sin resolver a un temporal en cuanto se arma, se
  // anotan sólo sus claves, y la resolución de aristas internas es una segunda pasada en streaming.
  const done = [];
  const keyOwner = new Map();
  let uberonFmaXrefs = new Set();
  const layers = {
    async push(layer) {
      const tmp = join(NDJSON_DIR, `${layer.source.id}.ndjson.tmp`);
      for (const r of layer.rows) {
        if (keyOwner.has(r.key)) throw new Error(`Concepto repetido: ${r.key} (${layer.source.id} y ${keyOwner.get(r.key)})`);
        // Copia plana: una subcadena de una línea leída retiene el bloque de 64 KB del que salió, y 600 mil claves retendrían todo el archivo.
        keyOwner.set(Buffer.from(r.key, 'utf8').toString('utf8'), layer.source.id);
      }
      if (layer.source.id === 'uberon') uberonFmaXrefs = new Set(layer.rows.flatMap((r) => r.xrefs.map((x) => x.id)).filter((x) => x.startsWith('FMA:')));
      await writeRowsStream(tmp, layer.rows);
      done.push({ source: layer.source, stats: layer.stats, files: layer.files, tmp, count: layer.rows.length });
      layer.rows.length = 0;
    },
    /** Capa que se conserva: sólo se leen sus claves del ndjson existente. */
    async reuse(source) {
      const path = join(NDJSON_DIR, `${source.id}.ndjson`);
      if (!existsSync(path)) throw new Error(`--reuse ${source.id}: no existe ${path} (corré pack-dictionaries-data.mjs --unpack)`);
      let count = 0;
      for await (const r of readRowsStream(path)) {
        if (keyOwner.has(r.key)) throw new Error(`Concepto repetido: ${r.key} (${source.id} y ${keyOwner.get(r.key)})`);
        keyOwner.set(r.key, source.id);
        count++;
      }
      const meta = JSON.parse(readFileSync(join(NDJSON_DIR, `${source.id}.meta.json`), 'utf8'));
      done.push({ source, stats: meta.stats, files: meta.files, reusedPath: path, meta, count });
    },
  };

  // --- Organismos primero: dan también el linaje humano para filtrar Uberon/CL.
  const of = Object.fromEntries(Object.entries(ORGANISM_SOURCES.files).map(([k, f]) => [k, sourceFile(ORGANISM_SOURCES.id, f)]));
  if (Object.values(of).some((x) => !x)) throw new Error('Faltan archivos de organismos (mondo-edit.obo, ncbitaxon_import.obo, doid-merged.json): corré fetch-dictionaries.mjs');
  let mondo = parseObo(readFileSync(of.mondoEdit.path, 'utf8'));
  let doid = JSON.parse(readFileSync(of.doidMerged.path, 'utf8'));
  const oboTaxa = mergeTaxa(taxaFromObographs(doid, 'doidMerged'), taxaFromObo(parseObo(readFileSync(of.mondoTaxa.path, 'utf8')), 'mondoTaxa'));
  const lineage = humanLineage(parentsMap(oboTaxa.taxa));
  const edges = [
    ...mondoAgentEdges(mondo).map((e) => ({ ...e, provenance: { file: of.mondoEdit.url, sha256: of.mondoEdit.sha256, retrievedAt: of.mondoEdit.retrievedAt, version: of.mondoEdit.version, license: 'CC BY 4.0', uri: `http://purl.obolibrary.org/obo/${e.diseaseId.replace(':', '_')}` } })),
    ...doidAgentEdges(doid).map((e) => ({ ...e, provenance: { file: of.doidMerged.url, sha256: of.doidMerged.sha256, retrievedAt: of.doidMerged.retrievedAt, version: of.doidMerged.version, license: 'CC0 1.0', uri: `http://purl.obolibrary.org/obo/${e.diseaseId.replace(':', '_')}` } })),
  ];
  // Etiquetas que los módulos OBO no traen: se completan desde el archivo mensual del NCBI Taxonomy (y se contrastan las que sí traen).
  const stage1 = selectTaxa(oboTaxa.taxa, edges);
  const nodes = await readNodes(of.taxdump.path);
  const wanted = taxdumpWanted(stage1.missingLabels, oboTaxa.taxa, nodes);
  for (const id of oboTaxa.taxa.keys()) wanted.add(Number(id.replace('NCBITaxon:', '')));
  const names = await readNames(of.taxdump.path, wanted);
  const fromNcbi = taxaFromTaxdump(stage1.missingLabels, oboTaxa.taxa, nodes, names, await readMerged(of.taxdump.path), await readDeleted(of.taxdump.path));
  const { taxa, conflicts } = mergeTaxa(oboTaxa.taxa, fromNcbi.taxa);
  const crossCheck = crossCheckLabels(oboTaxa.taxa, names);
  mondo = null; // ya no hacen falta: ~300 MB menos para ChEBI, PRO y NCIt
  doid = null;
  const { selected, missingLabels } = selectTaxa(taxa, edges);
  const agentOf = new Map();
  for (const e of edges) {
    if (!agentOf.has(e.target)) agentOf.set(e.target, []);
    agentOf.get(e.target).push({ disease: e.diseaseId, type: e.type, predicate: e.predicate });
  }
  const taxonRows = [...selected].sort().map((id) => taxonRow(taxa.get(id), ORGANISM_SOURCES, of, agentOf.get(id)));
  await layers.push({ source: ORGANISM_SOURCES, rows: taxonRows, stats: { taxaAvailable: taxa.size, selected: selected.size, edges: edges.length, edgesMondo: edges.filter((e) => e.diseaseSystem === 'mondo').length, edgesDoid: edges.filter((e) => e.diseaseSystem === 'doid').length, targetsWithoutLabel: missingLabels, labelConflicts: conflicts, taxdump: { declaredWithoutLabelInObo: stage1.missingLabels.length, completedFromNcbi: [...fromNcbi.taxa.keys()].filter((id) => selected.has(id)).length, unresolvedInNcbi: fromNcbi.unresolved, crossCheckAgainstObo: crossCheck } }, files: Object.values(of) });

  // --- OBO (las grandes —ChEBI, PRO, NCIt— se leen en streaming).
  for (const s of [...OBO_SOURCES, ...C7_OBO_SOURCES]) {
    const file = sourceFile(s.id, s.files[0]);
    if (!file) { missing.push(s.id); console.warn(`[build] sin archivo (se omite): ${s.id}`); continue; }
    const parsed = s.stream
      ? await parseOboFile(file.path, { keepProperty: s.keepProperty ?? (() => false), keepId: (id) => s.idPrefixes.includes(id.split(':')[0]), skipTags: UNUSED_TAGS })
      : { obo: parseObo, ofn: parseOfn, rdfxml: parseRdfXml }[s.format ?? 'obo'](readFileSync(file.path, 'utf8'));
    const { rows, stats } = oboSourceRows(parsed, s, file, { lineage });
    const n = rows.length;
    await layers.push({ source: s, rows, stats, files: [file] });
    global.gc?.();
    console.log(`[build] ${s.id}: ${n} conceptos (${Math.round((Date.now() - t0) / 1000)} s, heap ${Math.round(process.memoryUsage().heapUsed / 1048576)} MB)`);
  }

  // --- FMA (después de Uberon: los xrefs FMA de Uberon marcan su núcleo).
  const ff = sourceFile(FMA_SOURCE.id, FMA_SOURCE.files[0]);
  if (ff) {
    const { rows, stats } = fmaRows(parseFma(readFileSync(ff.path, 'utf8')), FMA_SOURCE, ff, { uberonFmaXrefs });
    await layers.push({ source: FMA_SOURCE, rows, stats, files: [ff] });
  } else missing.push(FMA_SOURCE.id);

  // --- HGNC.
  const hf = REUSE.has(HGNC_SOURCE.id) ? null : sourceFile(HGNC_SOURCE.id, HGNC_SOURCE.files[0]);
  if (REUSE.has(HGNC_SOURCE.id)) await layers.reuse(HGNC_SOURCE);
  else if (hf) {
    const { rows, stats } = hgncRows(JSON.parse(readFileSync(hf.path, 'utf8')), HGNC_SOURCE, hf);
    await layers.push({ source: HGNC_SOURCE, rows, stats, files: [hf] });
  } else missing.push(HGNC_SOURCE.id);

  // --- Abreviaturas (todo el metainventario; la carga filtra lo clínico).
  const af = sourceFile(ABBREVIATION_SOURCE.id, ABBREVIATION_SOURCE.files[0]);
  if (af) {
    const { rows, stats } = abbreviationRows(parseMetainventory(readFileSync(af.path, 'utf8')), ABBREVIATION_SOURCE, af);
    await layers.push({ source: ABBREVIATION_SOURCE, rows, stats, files: [af] });
  } else missing.push(ABBREVIATION_SOURCE.id);

  // --- MeSH (ramas D27 y E05.318), EMDN y AbreMES-DB.
  const mf = sourceFile(MESH_SOURCE.id, MESH_SOURCE.files[0]);
  if (mf) {
    const descriptors = [];
    for await (const xml of descriptorRecords(mf.path)) descriptors.push(parseDescriptor(xml));
    const { rows, stats } = meshRows(descriptors, MESH_SOURCE, mf);
    await layers.push({ source: MESH_SOURCE, rows, stats, files: [mf] });
  } else missing.push(MESH_SOURCE.id);
  const ef = sourceFile(EMDN_SOURCE.id, EMDN_SOURCE.files[0]);
  if (ef) {
    const { rows, stats } = emdnRows(readXlsxFirstSheet(ef.path), EMDN_SOURCE, ef);
    await layers.push({ source: EMDN_SOURCE, rows, stats, files: [ef] });
  } else missing.push(EMDN_SOURCE.id);
  const bf = sourceFile(ABREMES_SOURCE.id, ABREMES_SOURCE.files[0]);
  if (bf) {
    const { rows, stats } = abremesRows(parsePairs(readZipEntry(bf.path, ABREMES_SOURCE.files[0].inner).toString('utf8')), ABREMES_SOURCE, bf);
    await layers.push({ source: ABREMES_SOURCE, rows, stats, files: [bf] });
  } else missing.push(ABREMES_SOURCE.id);

  // --- Segunda pasada (streaming): resolución de aristas internas, escritura final, meta y cobertura.
  const perSource = [];
  for (const d of done) {
    const rel = { resolved: 0, unresolved: 0, unresolvedByPrefix: {} };
    const cov = layerCoverage(d.source);
    const source = d.reusedPath ?? d.tmp;
    async function* resolved() {
      for await (const r of readRowsStream(source)) {
        if (!d.reusedPath) {
          for (const x of r.relations) {
            const prefix = x.target.split(':')[0];
            // Las fuentes con códigos sin prefijo (MeSH, EMDN) declaran su clave al armar la fila; el resto la deduce del prefijo del id OBO.
            const tk = x.targetKey ?? corpusKey(x.target);
            x.targetKey = tk && keyOwner.has(tk) ? tk : null;
            if (x.targetKey) rel.resolved++;
            else { rel.unresolved++; rel.unresolvedByPrefix[prefix] = (rel.unresolvedByPrefix[prefix] ?? 0) + 1; }
          }
        } else {
          for (const x of r.relations) {
            if (x.targetKey) rel.resolved++;
            else { rel.unresolved++; const prefix = x.target.split(':')[0]; rel.unresolvedByPrefix[prefix] = (rel.unresolvedByPrefix[prefix] ?? 0) + 1; }
          }
        }
        cov.add(r);
        yield r;
      }
    }
    if (d.reusedPath) {
      for await (const _ of resolved()) { /* sólo cobertura */ }
      d.stats.relations = d.stats.relations ?? rel;
      perSource.push(cov.finish(d.stats));
      console.log(`[build] ${d.source.id}: ${d.count} conceptos (conservado de data/)`);
      continue;
    }
    const finalPath = join(NDJSON_DIR, `${d.source.id}.ndjson`);
    await writeRowsStream(`${finalPath}.part`, resolved());
    renameSync(`${finalPath}.part`, finalPath);
    rmSync(d.tmp);
    d.stats.relations = rel;
    writeJson(join(NDJSON_DIR, `${d.source.id}.meta.json`), { source: d.source.id, codeSystem: d.source.codeSystem, domain: d.source.domain, load: d.source.load, license: d.source.license, files: d.files.map(({ path, ...f }) => f), generatedAt: nowIso(), stats: d.stats }, true);
    perSource.push(cov.finish(d.stats));
    console.log(`[build] ${d.source.id}: ${d.count} conceptos`);
  }
  await writeNdjson(join(NDJSON_DIR, 'disease-agents.ndjson'), edges);
  const coverage = combineCoverage(perSource, edges, { missing });
  writeJson(REPORT_PATH, { generatedAt: nowIso(), seconds: Math.round((Date.now() - t0) / 1000), ...coverage }, true);
  console.log(JSON.stringify(coverage.totals, null, 2));
  console.log(`Corpus en ${NDJSON_DIR}; cobertura en ${REPORT_PATH}`);
}

main().catch((err) => {
  console.error('ERROR FATAL en build-dictionaries:', err);
  process.exitCode = 1;
});
