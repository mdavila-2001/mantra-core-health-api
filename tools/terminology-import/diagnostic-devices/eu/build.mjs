#!/usr/bin/env node
// =============================================================================
// Etapa 2 (sin red): crudos del caché → formato común de
// `../README.md` (lo define la sesión `master`):
//
//   out/manifest.json                    región, archivos (filas, sha256) y huecos
//   out/<source>-NNNN.ndjson.gz          una fila por registro de un modelo
//                                        (eudamed-udi, it-salute-bdrdm, …)
//   out/emdn/ec-emdn-NNNN.ndjson.gz      EMDN completa con jerarquía y alcance
//                                        (clasificación, no filas de equipos)
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
  RowError,
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
const cache = existsSync(MANIFEST)
  ? readJson(MANIFEST)
  : { files: [], gaps: [] };
const fileMeta = new Map(cache.files.map((f) => [f.file, f]));
const gaps = [...(cache.gaps ?? [])];

function latestProbe() {
  const dir = outDir('probe');
  if (!existsSync(dir)) return null;
  const last = readdirSync(dir)
    .filter((f) => f.endsWith('.json'))
    .sort()
    .at(-1);
  return last ? readJson(join(dir, last)) : null;
}

/** Páginas completas de una carpeta del Data Lake (las incompletas se reportan y se ignoran). */
function readPagedDirs(root) {
  if (!existsSync(root)) return [];
  const out = [];
  for (const sub of readdirSync(root)) {
    const dir = join(root, sub);
    if (!existsSync(join(dir, '_complete.json'))) {
      gaps.push({
        source: 'eudamed-udi',
        url: dir,
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
  const xlsx = cache.files.find(
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
  const csv = cache.files.find(
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
    gaps.push({ source: 'it-salute-bdrdm', url: csv.url, reason: err.message });
    console.warn(`[it-salute-bdrdm] ${err.message}`);
    return [];
  }
  const rows = [];
  for (const row of records)
    try {
      rows.push(
        normalizeBdrdmRow(row, map, {
          sourceUrl: csv.url,
          sourceVersion: `sha256:${csv.sha256.slice(0, 12)}`,
          retrievedAt: csv.retrievedAt,
        }),
      );
    } catch (err) {
      if (!(err instanceof RowError)) throw err;
    }
  return rows;
}

/**
 * Huecos con la clave de fuente del formato común: uno por fuente sin filas,
 * con el bloqueo del último sondeo si lo hubo y el motivo propio (términos,
 * sin descarga masiva, mapeo pendiente) si existe.
 */
function manifestGaps(rawGaps, probe) {
  const blocked = new Map(
    (probe?.results ?? []).map((r) => [r.source, r.blockedByEnvironment]),
  );
  const keyOf = new Map(
    Object.entries(SOURCES).flatMap(([k, s]) => [
      [k, s.exchangeSource],
      [s.exchangeSource, s.exchangeSource],
    ]),
  );
  const out = new Map();
  for (const [key, s] of Object.entries(SOURCES)) {
    const reasons = [];
    if (blocked.get(key))
      reasons.push(
        `403 del proxy (política de red del entorno, sondeo ${probe.startedAt})`,
      );
    if (!s.autoFetch) reasons.push(`sin descarga automática: ${s.terms.text}`);
    if (reasons.length)
      out.set(s.exchangeSource, {
        source: s.exchangeSource,
        reason: reasons.join(' · '),
        url: s.officialUrl,
      });
  }
  for (const g of rawGaps) {
    const source = keyOf.get(g.source) ?? g.source;
    if (out.has(source) || /^bloqueado/.test(g.reason)) continue;
    out.set(source, { source, reason: g.reason, url: g.url });
  }
  return [...out.values()];
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
| Filas exportadas (tras deduplicar) | ${cov.devicesExported} |
| · en alcance diagnóstico | ${cov.devicesInScope} |
| · en categorías pendientes de revisión | ${cov.devicesPendingReview} |
| Duplicados descartados | ${cov.duplicatesDropped} |
| Filas rechazadas por formato | ${cov.rejectedRows} |
| Fabricantes distintos | ${cov.distinctManufacturers} |
| Marcas distintas (fabricante + marca) | ${cov.distinctBrands} |
| Conceptos EMDN cargados | ${cov.emdn.concepts} |
| Conceptos EMDN en alcance | ${cov.emdn.inScopeConcepts} |
| Tipos terminales en alcance sin ningún equipo | ${cov.emdn.inScopeTerminalWithoutDevices} |

## Filas por fuente
| Fuente | Filas |
|---|---|
${t(cov.devicesBySource)}

## Filas por regla de alcance
| Regla | Filas |
|---|---|
${t(cov.devicesByScope)}

## Filas por categoría EMDN
| Categoría | Filas |
|---|---|
${t(cov.devicesByEmdnCategory)}

## Filas por grupo EMDN
| Grupo | Filas |
|---|---|
${t(cov.devicesByEmdnGroup)}

## Filas no exportadas por regla de alcance
| Regla | Filas |
|---|---|
${t(cov.excludedByRule)}

## Alcance EMDN
- Incluidas enteras: ${Object.keys(INCLUDED_CATEGORIES).join(', ')}
- Tipos incluidos fuera de W: ${INCLUDED_TYPE_PREFIXES.length || 'ninguno todavía'}
- Exportadas como pendientes de revisión: ${Object.keys(REVIEW_CATEGORIES).join(', ')}
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
  const actorRows = readPagedDirs(cacheDir('eudamed', 'actors')).flatMap(
    (p) => p.rows,
  );
  const bdrdm = loadBdrdm();
  if (!emdnConcepts.length)
    gaps.push({
      source: 'ec-emdn',
      url: SOURCES.EMDN.officialUrl,
      reason: 'EMDN no disponible en caché',
    });

  const { devices, coverage } = buildCorpus({
    emdnConcepts,
    referenceRows,
    udiPages,
    actorRows,
    extraDevices: bdrdm,
    gaps,
  });
  coverage.generatedAt = nowIso();

  // Un juego de partes por fuente; las fuentes sin filas no dejan archivos.
  const bySource = new Map();
  for (const d of devices)
    (bySource.get(d.source) ?? bySource.set(d.source, []).get(d.source)).push(
      d,
    );
  const knownSources = [
    'eudamed-udi',
    'it-salute-bdrdm',
    'swissmedic-swissdamed',
    'mhra-pard',
  ];
  const files = [];
  for (const source of new Set([...knownSources, ...bySource.keys()])) {
    const rows = bySource.get(source) ?? [];
    const version = [
      ...new Set(rows.map((r) => r.sourceVersion.split(';')[0])),
    ].join(',');
    for (const part of writeNdjsonGzParts(source, rows))
      files.push({ ...part, source, sourceVersion: version });
  }
  const emdnParts = writeNdjsonGzParts('ec-emdn', emdnConcepts, {
    dir: outDir('emdn'),
    sortKey: (c) => c.code,
  });

  writeJson(outDir('manifest.json'), {
    region: 'eu',
    generatedAt: nowIso().replace(/\.\d+Z$/, 'Z'),
    formatVersion: 1,
    files: files.map(({ path, source, sourceVersion, rows, sha256 }) => ({
      path,
      source,
      sourceVersion,
      rows,
      sha256,
    })),
    classifications: emdnParts.map(({ path, rows, sha256 }) => ({
      path: `emdn/${path}`,
      system: 'emdn',
      sourceVersion: emdnConcepts[0]?.sourceVersion ?? null,
      rows,
      sha256,
    })),
    scope:
      'Exporta filas con EMDN/CND en alcance (categoría W entera y tipos listados) y, marcadas en extra.dxScope = "pendiente-revision:<letra>", las de categorías C, G, N, Q, R, U, V y Z para que master las clasifique. No exporta categorías excluidas (ver lib/emdn-scope.mjs).',
    gaps: manifestGaps(gaps, latestProbe()),
  });
  coverage.files = files;
  writeJson(outDir('coverage.json'), coverage);
  writeFileSync(outDir('coverage.md'), coverageMd(coverage, latestProbe()));
  if (emdnConcepts.length)
    writeFileSync(outDir('emdn-scope-review.md'), scopeReviewMd(emdnConcepts));

  console.log(
    JSON.stringify(
      {
        devicesExported: coverage.devicesExported,
        devicesInScope: coverage.devicesInScope,
        devicesPendingReview: coverage.devicesPendingReview,
        distinctManufacturers: coverage.distinctManufacturers,
        distinctBrands: coverage.distinctBrands,
        rejectedRows: coverage.rejectedRows,
        emdnConcepts: emdnConcepts.length,
        gaps: coverage.gaps.length,
        files: files.length,
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
