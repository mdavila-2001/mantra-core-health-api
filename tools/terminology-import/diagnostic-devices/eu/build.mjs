#!/usr/bin/env node
// =============================================================================
// Etapa 2 (sin red): crudos del caché → NDJSON del formato común.
//
//   out/emdn-NNN.ndjson.gz               EMDN completa con jerarquía y alcance
//   out/devices-eu-NNN.ndjson.gz         equipos de diagnóstico (formato común)
//   out/manufacturers-eu-NNN.ndjson.gz   fabricantes legales de esos equipos
//   out/coverage.json / coverage.md      cobertura y huecos
//   out/emdn-scope-review.md             tipos EMDN pendientes de decidir
//
//   node tools/terminology-import/diagnostic-devices/eu/build.mjs
// =============================================================================

import { existsSync, readdirSync, readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import {
  cacheDir,
  nowIso,
  outDir,
  parseCsv,
  readJson,
  writeJson,
  writeNdjsonGzParts,
} from './lib/common.mjs';
import { buildCorpus } from './lib/build-corpus.mjs';
import {
  EXCLUDED_CATEGORIES,
  INCLUDED_CATEGORIES,
  INCLUDED_TYPE_PREFIXES,
  REVIEW_CATEGORIES,
  assertTypePrefixesExist,
} from './lib/emdn-scope.mjs';
import { parseEmdnRows, readFirstSheet } from './lib/sources/emdn.mjs';
import { parsePage } from './lib/sources/eudamed-datalake.mjs';
import {
  assertColumnMap,
  loadColumnMap,
  normalizeBdrdmRow,
} from './lib/sources/it-bdrdm.mjs';
import { SOURCES, requiredHosts } from './lib/sources.mjs';

const MANIFEST = cacheDir('manifest.json');
const manifest = existsSync(MANIFEST)
  ? readJson(MANIFEST)
  : { files: [], gaps: [] };
const fileMeta = new Map(manifest.files.map((f) => [f.file, f]));
const gaps = [...(manifest.gaps ?? [])];

function latestProbe() {
  const dir = outDir('probe');
  if (!existsSync(dir)) return null;
  const last = readdirSync(dir)
    .filter((f) => f.endsWith('.json'))
    .sort()
    .at(-1);
  return last ? readJson(join(dir, last)) : null;
}

/** Páginas completas de una carpeta del Data Lake (las incompletas se ignoran y se reportan). */
function readPagedDirs(root) {
  if (!existsSync(root)) return [];
  const out = [];
  for (const sub of readdirSync(root)) {
    const dir = join(root, sub);
    if (!existsSync(join(dir, '_complete.json'))) {
      gaps.push({
        source: 'EUDAMED_DATALAKE',
        url: dir,
        at: nowIso(),
        reason: 'paginación incompleta en caché (se volverá a pedir)',
      });
      continue;
    }
    for (const page of readJson(join(dir, '_complete.json')).pages) {
      const meta = fileMeta.get(page);
      out.push({
        rows: parsePage(JSON.parse(readFileSync(page, 'utf8'))).rows,
        sourceUrl: meta?.url ?? page,
        retrievedAt: meta?.retrievedAt ?? nowIso(),
      });
    }
  }
  return out;
}

async function loadEmdn() {
  const xlsx = manifest.files.find(
    (f) => f.source === 'EMDN' && /\.xlsx?$/i.test(f.file),
  );
  if (!xlsx) return [];
  const { header, records } = await readFirstSheet(xlsx.file);
  const concepts = parseEmdnRows(header, records, {
    sourceUrl: xlsx.url,
    sourceVersion: `sha256:${xlsx.sha256.slice(0, 12)}`,
    retrievedAt: xlsx.retrievedAt,
  });
  assertTypePrefixesExist(new Set(concepts.map((c) => c.code)));
  return concepts;
}

function loadBdrdm() {
  const csv = manifest.files.find(
    (f) => f.source === 'IT_BDRDM' && /\.csv$/i.test(f.file),
  );
  if (!csv) return [];
  const text = readFileSync(csv.file, 'utf8');
  const firstLine = text.slice(0, text.indexOf('\n'));
  const delimiter =
    firstLine.split(';').length > firstLine.split(',').length ? ';' : ',';
  const { header, records } = parseCsv(text, { delimiter });
  const map = loadColumnMap();
  try {
    assertColumnMap(map, header);
  } catch (err) {
    gaps.push({
      source: 'IT_BDRDM',
      url: csv.url,
      at: nowIso(),
      reason: err.message,
    });
    console.warn(`[IT_BDRDM] ${err.message}`);
    return [];
  }
  return records.map((row) =>
    normalizeBdrdmRow(row, map, {
      sourceUrl: csv.url,
      sourceVersion: `sha256:${csv.sha256.slice(0, 12)}`,
      retrievedAt: csv.retrievedAt,
    }),
  );
}

function scopeReviewMd(concepts) {
  const lines = [
    '# EMDN: tipos pendientes de decidir (fuera de W)',
    '',
    `Generado: ${nowIso()}. Solo entran tipos listados en \`INCLUDED_TYPE_PREFIXES\` (lib/emdn-scope.mjs), uno por uno y con motivo.`,
    '',
  ];
  for (const cat of Object.keys(REVIEW_CATEGORIES)) {
    const list = concepts.filter((c) => c.category === cat);
    lines.push(
      `## ${cat} — ${list.find((c) => c.level === 1)?.display ?? ''}`,
      '',
    );
    for (const c of list)
      lines.push(
        `${'  '.repeat(c.level - 1)}- \`${c.code}\` ${c.display}${c.terminal ? ' *(terminal)*' : ''}`,
      );
    lines.push('');
  }
  return lines.join('\n');
}

function coverageMd(cov, probe) {
  const t = (obj) =>
    Object.entries(obj)
      .sort((a, b) => b[1] - a[1])
      .map(([k, v]) => `| ${k} | ${v} |`)
      .join('\n') || '| — | 0 |';
  const blocked = probe?.results.filter((r) => r.blockedByEnvironment) ?? [];
  return `# Cobertura — equipos de diagnóstico, registros de Europa

Generado: ${cov.generatedAt}

| Métrica | Valor |
|---|---|
| Filas leídas de las fuentes | ${cov.totalRead} |
| Equipos en alcance (tras deduplicar) | ${cov.devicesInScope} |
| Duplicados descartados | ${cov.duplicatesDropped} |
| Fabricantes distintos | ${cov.distinctManufacturers} |
| Marcas distintas (fabricante + marca) | ${cov.distinctBrands} |
| Conceptos EMDN cargados | ${cov.emdn.concepts} |
| Conceptos EMDN en alcance | ${cov.emdn.inScopeConcepts} |
| Tipos terminales en alcance sin ningún equipo | ${cov.emdn.inScopeTerminalWithoutDevices} |

## Equipos por fuente
| Fuente | Equipos |
|---|---|
${t(cov.devicesBySource)}

## Equipos por categoría EMDN
| Categoría | Equipos |
|---|---|
${t(cov.devicesByEmdnCategory)}

## Equipos por grupo EMDN
| Grupo | Equipos |
|---|---|
${t(cov.devicesByEmdnGroup)}

## Filas excluidas por regla de alcance
| Regla | Filas |
|---|---|
${t(cov.excludedByRule)}

## Alcance EMDN
- Incluidas enteras: ${Object.keys(INCLUDED_CATEGORIES).join(', ')}
- Tipos incluidos fuera de W: ${INCLUDED_TYPE_PREFIXES.length || 'ninguno todavía'}
- En revisión tipo por tipo: ${Object.keys(REVIEW_CATEGORIES).join(', ')}
- Excluidas enteras: ${Object.keys(EXCLUDED_CATEGORIES).join(', ')}

## Huecos
${
  blocked.length
    ? `**Bloqueadas por la política de red del entorno** (sondeo ${probe.startedAt}): ${blocked.map((b) => `\`${b.host}\``).join(', ')}.\n\nHosts a habilitar: ${requiredHosts()
        .map((h) => `\`${h}\``)
        .join(', ')}.\n`
    : ''
}
| Fuente | Motivo | Nota |
|---|---|---|
${cov.gaps.map((g) => `| ${g.source} | ${g.reason} | ${(g.note ?? '').replace(/\|/g, '/')} |`).join('\n') || '| — | — | — |'}
`;
}

async function main() {
  const emdnConcepts = await loadEmdn();
  const referenceRows = readPagedDirs(cacheDir('eudamed', 'reference')).flatMap(
    (p) => p.rows,
  );
  const udiPages = readPagedDirs(cacheDir('eudamed', 'udi'));
  const actorPages = readPagedDirs(cacheDir('eudamed', 'actors'));
  const bdrdm = loadBdrdm();
  if (!emdnConcepts.length)
    gaps.push({
      source: 'EMDN',
      url: SOURCES.EMDN.officialUrl,
      at: nowIso(),
      reason: 'EMDN no disponible en caché',
    });

  const { devices, manufacturers, coverage } = buildCorpus({
    emdnConcepts,
    referenceRows,
    udiPages,
    actorPages,
    extraDevices: bdrdm,
    gaps,
  });
  coverage.generatedAt = nowIso();

  const parts = {
    emdn: emdnConcepts.length ? writeNdjsonGzParts('emdn', emdnConcepts) : [],
    devices: writeNdjsonGzParts('devices-eu', devices),
    manufacturers: writeNdjsonGzParts('manufacturers-eu', manufacturers),
  };
  coverage.parts = parts;
  writeJson(outDir('coverage.json'), coverage);
  writeFileSync(outDir('coverage.md'), coverageMd(coverage, latestProbe()));
  if (emdnConcepts.length)
    writeFileSync(outDir('emdn-scope-review.md'), scopeReviewMd(emdnConcepts));

  console.log(
    JSON.stringify(
      {
        devicesInScope: coverage.devicesInScope,
        manufacturers: manufacturers.length,
        distinctBrands: coverage.distinctBrands,
        emdnConcepts: emdnConcepts.length,
        gaps: coverage.gaps.length,
        parts,
      },
      null,
      2,
    ),
  );
}

main().catch((err) => {
  console.error('ERROR FATAL en diagnostic-devices/eu/build:', err);
  process.exitCode = 1;
});
