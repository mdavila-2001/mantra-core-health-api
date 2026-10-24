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
//   out/actors/eudamed-actors-NNNN.ndjson.gz  actores fabricantes con SRN (no son equipos)
//   out/emdn-scope-review.md             decisión de alcance por tipo EMDN (fuera de W)
//
// Fuentes: caché oficial (fetch.mjs) y réplicas fijadas por commit
// (fetch-mirrors.mjs, lib/mirrors.mjs) cuando el host oficial está bloqueado.
//
//   node tools/terminology-import/diagnostic-devices/eu/build.mjs
// =============================================================================

import { existsSync, readdirSync, readFileSync, writeFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import { basename, join } from 'node:path';
import {
  cacheDir,
  nowIso,
  outDir,
  parseCsv,
  readJson,
  readPageFile,
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
} from './lib/emdn-scope.mjs';
import { classifyEmdn } from './lib/emdn-scope.mjs';
import { mirrorById } from './lib/mirrors.mjs';
import { loadEmdn } from './lib/load-emdn.mjs';
import {
  assertActorsHeader,
  normalizeActorRow,
  selectCurrentVersions,
} from './lib/sources/eudamed-actors.mjs';
import { normalizeFirstbaseDoc } from './lib/sources/eudamed-firstbase.mjs';
import {
  assertDlinrtHeader,
  normalizeDlinrtRow,
} from './lib/sources/dlinrt.mjs';
import {
  buildUrl,
  normalizeDatalakeActor,
  parsePage,
} from './lib/sources/eudamed-datalake.mjs';
import {
  assertColumnMap,
  loadColumnMap,
  normalizeBdrdmRow,
  readBdrdmCsv,
} from './lib/sources/it-bdrdm.mjs';
import { SOURCES, requiredHosts } from './lib/sources.mjs';

const MANIFEST = cacheDir('manifest.json');
const cache = existsSync(MANIFEST)
  ? readJson(MANIFEST)
  : { files: [], gaps: [] };
const fileMeta = new Map(cache.files.map((f) => [f.file, f]));
const gaps = [...(cache.gaps ?? [])];
const MIRROR_MANIFEST = cacheDir('mirrors', 'manifest.json');
const mirrorsCache = existsSync(MIRROR_MANIFEST)
  ? readJson(MIRROR_MANIFEST)
  : { mirrors: [] };
const rejectedFromMirrors = { count: 0, samples: [] };

/** Réplica descargada y sana, con la cita que va en extra.mirror de cada fila. */
function mirror(id) {
  const m = mirrorsCache.mirrors.find((x) => x.id === id && !x.error);
  if (!m) return null;
  const def = mirrorById(id);
  return {
    ...m,
    cite: {
      repo: m.repo,
      commit: m.commit,
      path: m.data,
      sha256: m.sha256,
      upstream: def.upstream,
    },
  };
}

function rejectRow(err) {
  if (!(err instanceof RowError)) throw err;
  rejectedFromMirrors.count++;
  if (rejectedFromMirrors.samples.length < 20)
    rejectedFromMirrors.samples.push(err.message);
}

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
    // Sin URL y fecha del manifiesto no hay procedencia: la carpeta se salta
    // como hueco (fetch.mjs la vuelve a pedir si se borra), nunca se rellena.
    const pages = readJson(join(dir, '_complete.json')).pages;
    if (pages.some((page) => !fileMeta.has(page))) {
      gaps.push({
        source: 'eudamed-udi',
        url: dir,
        reason:
          'páginas sin URL ni fecha en el manifiesto del caché (borrar la carpeta y volver a correr fetch.mjs)',
      });
      continue;
    }
    for (const page of pages) {
      const meta = fileMeta.get(page);
      out.push({
        rows: parsePage(readPageFile(page)).rows,
        sourceUrl: meta.url,
        retrievedAt: meta.retrievedAt,
      });
    }
  }
  return out;
}

async function loadBdrdm() {
  const csv = cache.files.find(
    (f) => f.source === 'IT_BDRDM' && /\.csv$/i.test(f.file),
  );
  if (!csv) return [];
  const map = loadColumnMap();
  const ctx = {
    sourceUrl: csv.url,
    sourceVersion: `${basename(csv.file).replace(/\.csv$/i, '')};sha256:${csv.sha256.slice(0, 12)}`,
    retrievedAt: csv.retrievedAt,
  };
  const rows = [];
  let read = 0;
  let checked = false;
  for await (const { header, records } of readBdrdmCsv(csv.file)) {
    if (!checked) {
      try {
        assertColumnMap(map, header);
      } catch (err) {
        gaps.push({
          source: 'it-salute-bdrdm',
          url: csv.url,
          reason: err.message,
        });
        console.warn(`[it-salute-bdrdm] ${err.message}`);
        return [];
      }
      checked = true;
    }
    for (const row of records) {
      read++;
      // Filtro barato antes de normalizar: el ~85 % de la base no es diagnóstico.
      const cnd = row[map.columns.cndCode]?.trim();
      if (!cnd || !classifyEmdn(cnd).inScope) continue;
      try {
        rows.push(normalizeBdrdmRow(row, map, ctx));
      } catch (err) {
        if (!(err instanceof RowError)) throw err;
      }
    }
  }
  console.log(
    `[it-salute-bdrdm] ${read} filas leídas · ${rows.length} en alcance`,
  );
  return rows;
}

function loadFirstbase(emdnByCode) {
  const m = mirror('zdavatz-eudamed2firstbase');
  if (!m) return [];
  const dir = join(m.dir, m.data);
  const rows = [];
  for (const f of readdirSync(dir)
    .filter((x) => x.endsWith('.json'))
    .sort())
    try {
      rows.push(
        normalizeFirstbaseDoc(JSON.parse(readFileSync(join(dir, f), 'utf8')), {
          uuid: f.replace(/\.json$/, ''),
          emdnByCode,
          mirror: { ...m.cite, path: `${m.data}/${f}` },
          retrievedAt: m.retrievedAt,
        }),
      );
    } catch (err) {
      rejectRow(err);
    }
  return rows;
}

function loadDlinrt() {
  const m = mirror('dlinrt-eudamed-emdn-discovery');
  if (!m) return [];
  const { header, records } = parseCsv(
    readFileSync(join(m.dir, m.data), 'utf8'),
  );
  assertDlinrtHeader(header);
  const rows = [];
  for (const r of records)
    try {
      rows.push(
        normalizeDlinrtRow(r, { mirror: m.cite, retrievedAt: m.retrievedAt }),
      );
    } catch (err) {
      rejectRow(err);
    }
  return rows;
}

function loadActors() {
  const m = mirror('longtran-eudamed-manufacturers');
  if (!m) return [];
  const XLSX = createRequire(import.meta.url)('xlsx');
  const wb = XLSX.readFile(join(m.dir, m.data));
  const rows = XLSX.utils.sheet_to_json(wb.Sheets[wb.SheetNames[0]], {
    raw: false,
    defval: '',
  });
  assertActorsHeader(Object.keys(rows[0] ?? {}));
  const out = [];
  for (const { row, versions } of selectCurrentVersions(rows))
    try {
      const a = normalizeActorRow(row, {
        sourceUrl: mirrorById(m.id).upstream,
        mirror: m.cite,
        retrievedAt: m.retrievedAt,
        versions,
      });
      if (a) out.push(a);
    } catch (err) {
      rejectRow(err);
    }
  return out;
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
    '# EMDN: decisión de alcance por tipo (fuera de W)',
    '',
    `Generado: ${nowIso()}. ✔ = exportado como equipo de diagnóstico (\`INCLUDED_TYPE_PREFIXES\` en lib/emdn-scope.mjs, con su motivo); ✘ = no diagnóstico o mixto. La categoría W entra entera.`,
    '',
  ];
  for (const cat of Object.keys(REVIEW_CATEGORIES)) {
    const list = concepts.filter((c) => c.category === cat && c.level <= 4);
    lines.push(
      `## ${cat} — ${list.find((c) => c.level === 1)?.display ?? ''}`,
      '',
    );
    for (const c of list)
      lines.push(
        `${'  '.repeat(c.level - 1)}- ${classifyEmdn(c.code).inScope ? '✔' : '✘'} \`${c.code}\` ${c.display}`,
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
- Revisadas tipo por tipo: ${Object.keys(REVIEW_CATEGORIES).join(', ')} (ver out/emdn-scope-review.md)
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
  const { concepts: emdnConcepts, origin: emdnOrigin } = await loadEmdn();
  const referenceRows = readPagedDirs(cacheDir('eudamed', 'reference')).flatMap(
    (p) => p.rows,
  );
  const udiPages = readPagedDirs(cacheDir('eudamed', 'udi'));
  const actorPages = readPagedDirs(cacheDir('eudamed', 'actors'));
  const actorRows = actorPages.flatMap((p) => p.rows);
  const bdrdm = await loadBdrdm();
  const emdnByCode = new Map(emdnConcepts.map((c) => [c.code, c]));
  const firstbase = loadFirstbase(emdnByCode);
  const dlinrt = loadDlinrt();
  // Fabricantes: la lista oficial del Data Lake si se descargó; si no, la réplica.
  const officialActors = [
    ...new Map(
      actorPages
        .flatMap((p) =>
          p.rows.map((r) =>
            normalizeDatalakeActor(r, {
              sourceUrl: buildUrl('actors', { ACTOR_ID: r.ACTOR_ID }),
              retrievedAt: p.retrievedAt,
            }),
          ),
        )
        .filter(Boolean)
        .map((a) => [a.sourceRecordId, a]),
    ).values(),
  ];
  const actors = officialActors.length ? officialActors : loadActors();
  const actorsOrigin = officialActors.length ? 'eudamed-datalake' : 'mirror';
  // Certificados de la réplica por UUID de EUDAMED, para completar el Data Lake.
  const certificatesByUuid = new Map(
    firstbase
      .filter((r) => r.authorizationId)
      .map((r) => [
        r.sourceRecordId,
        {
          authorizationId: r.authorizationId,
          authorizationDate: r.authorizationDate,
          certificates: r.extra.certificates ?? null,
          mirror: r.extra.mirror,
        },
      ]),
  );
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
    extraDevices: [...firstbase, ...dlinrt, ...bdrdm],
    certificatesByUuid,
    gaps,
  });
  coverage.generatedAt = nowIso();
  coverage.emdnOrigin = emdnOrigin;
  coverage.rejectedRows += rejectedFromMirrors.count;
  coverage.totalRead += rejectedFromMirrors.count;
  coverage.rejectedSamples.push(...rejectedFromMirrors.samples);
  coverage.actors = actors.length;
  coverage.actorsOrigin = actorsOrigin;
  coverage.mirrors = mirrorsCache.mirrors.map(
    ({ id, repo, commit, files, sha256, error }) => ({
      id,
      repo,
      commit,
      files,
      sha256,
      error,
    }),
  );

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
  const actorParts = writeNdjsonGzParts('eudamed-actors', actors, {
    dir: outDir('actors'),
  });
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
    actors: actorParts.map(({ path, rows, sha256 }) => ({
      path: `actors/${path}`,
      source: 'eudamed-actors',
      rows,
      sha256,
      note: 'Actores fabricantes de EUDAMED (no son filas de equipos): source, sourceRecordId (SRN), sourceUrl, sourceVersion, retrievedAt, manufacturerName, manufacturerCountry, manufacturerRegistryId y extra.',
    })),
    mirrors: mirrorsCache.mirrors.map(
      ({ id, repo, commit, data, files, sha256, error }) => ({
        id,
        repo,
        commit,
        path: data,
        files,
        sha256,
        error,
      }),
    ),
    scope:
      'Recorte por código EMDN (lib/emdn-scope.mjs): categoría W entera y, fuera de W, solo los tipos listados uno por uno contra la EMDN V2 (imagenología, monitorización, exploración funcional, endoscopía diagnóstica, termometría y medición, electrodos diagnósticos, urodinamia). extra.dxScope dice qué regla incluyó cada fila.',
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
        actors: actors.length,
        devicesExported: coverage.devicesExported,
        devicesInScope: coverage.devicesInScope,
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
