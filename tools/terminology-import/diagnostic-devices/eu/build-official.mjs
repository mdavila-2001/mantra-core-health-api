#!/usr/bin/env node
// =============================================================================
// EU · build desde los archivos OFICIALES → `out/` (formato común de ../README.md).
// Entradas (en `<BUILD>/`): el recorrido de EUDAMED `/udi` (`fetch-eudamed.mjs`,
// ya recortado a alcance de diagnóstico), `/reference` y `/actors`, el Excel
// oficial de la EMDN y la BD/RDM italiana (`fetch-official.mjs`).
//
// Salidas: out/eudamed-udi-NNNN, out/it-salute-bdrdm-NNNN, out/emdn/ec-emdn-NNNN,
// out/actors/eudamed-actors-NNNN, out/manifest.json, out/coverage.{json,md}.
// Reemplaza lo que antes salía de réplicas en git (`build.mjs` queda para
// reproducir esa vía; la oficial tiene prioridad, como en `us/`).
//
//   node --max-old-space-size=2500 build-official.mjs
// =============================================================================

import { spawn } from 'node:child_process';
import { existsSync, readdirSync, readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { gunzipSync } from 'node:zlib';
import {
  cacheDir,
  nowIso,
  outDir,
  readJson,
  rowKey,
  RowError,
  writeJson,
  writeNdjsonGzParts,
} from './lib/common.mjs';
import { csvRows } from './lib/csv-stream.mjs';
import { INCLUDED_TYPE_PREFIXES, classifyEmdn } from './lib/emdn-scope.mjs';
import { parseEmdnRows, readFirstSheet } from './lib/sources/emdn.mjs';
import {
  currentDatalakeActors,
  normalizeDatalakeActor,
} from './lib/sources/eudamed-actors.mjs';
import {
  buildReferenceIndex,
  indexActors,
  normalizeUdiRow,
} from './lib/sources/eudamed-datalake.mjs';
import {
  assertColumnMap,
  loadColumnMap,
  normalizeBdrdmRow,
} from './lib/sources/it-bdrdm.mjs';
import { typeCodes } from './lib/build-corpus.mjs';

const OFFICIAL_DIR = cacheDir('..', 'official');
const registry = readJson(join(OFFICIAL_DIR, 'official.json'));
const SCAN_DIR = cacheDir('eudamed', 'udi-scan');
const inc = (o, k, n = 1) => ((o[k] = (o[k] ?? 0) + n), o);
const udiDetailUrl = (uuid) =>
  `https://ec.europa.eu/tools/eudamed/api/devices/udiDiData/${encodeURIComponent(uuid)}?languageIso2Code=en`;

const gaps = [];
const retiredPrefixes = [];

// --- EMDN oficial ------------------------------------------------------------
async function loadEmdn() {
  const r = registry.emdn;
  if (!r?.file) throw new Error('falta la EMDN oficial: correr fetch-official.mjs --only=emdn');
  const { header, records } = await readFirstSheet(join(OFFICIAL_DIR, r.file));
  const concepts = parseEmdnRows(header, records, {
    sourceUrl: r.url,
    sourceVersion: `EMDN v2026 (Excel oficial; sha256:${r.sha256.slice(0, 12)})`,
    retrievedAt: r.retrievedAt,
  });
  // La EMDN v2026 retiró códigos que la V2 tenía (p. ej. Z120306): un prefijo
  // incluido que ya no existe no es un error, es un código retirado que
  // EUDAMED puede seguir mostrando en equipos antiguos; se informa.
  const have = [...concepts.map((c) => c.code)];
  retiredPrefixes.push(
    ...INCLUDED_TYPE_PREFIXES.filter((p) => !have.some((c) => c.startsWith(p.prefix))).map((p) => p.prefix),
  );
  return concepts;
}

// --- EUDAMED /udi --------------------------------------------------------------
function loadUdi({ reference, emdnByCode, actorsBySrn }) {
  const stateFiles = readdirSync(SCAN_DIR).filter((f) => /^state(-.+)?\.json$/.test(f)).sort();
  if (!stateFiles.length) throw new Error('falta el recorrido de /udi: correr fetch-eudamed.mjs');
  const states = stateFiles.map((f) => readJson(join(SCAN_DIR, f)));
  const full = states.find((s) => !s.name);
  const state = full ?? states[0];
  const stats = readJson(join(SCAN_DIR, full ? 'stats.json' : stateFiles[0].replace('state', 'stats')));
  const chunks = readdirSync(SCAN_DIR).filter((f) => /^chunk(-.+)?-\d+\.json\.gz$/.test(f)).sort();
  const best = new Map(); // PRIMARY_DI → fila cruda elegida
  const rejected = { count: 0, samples: [] };
  let kept = 0;
  const pick = (a, b) => {
    // Versión vigente: LATEST_VERSION=1; si empatan, número de versión mayor.
    const la = a.LATEST_VERSION === 1 ? 1 : 0;
    const lb = b.LATEST_VERSION === 1 ? 1 : 0;
    if (la !== lb) return la > lb ? a : b;
    return (Number(a.VERSION_NUMBER) || 0) >= (Number(b.VERSION_NUMBER) || 0) ? a : b;
  };
  const meta = new Map();
  for (const c of chunks) {
    const pages = JSON.parse(gunzipSync(readFileSync(join(SCAN_DIR, c))));
    for (const p of pages)
      for (const row of p.rows) {
        kept += 1;
        const k = row.PRIMARY_DI ?? `uuid:${row.UUID}`;
        const prev = best.get(k);
        const chosen = prev ? pick(prev, row) : row;
        best.set(k, chosen);
        if (chosen === row) meta.set(k, p.retrievedAt);
      }
  }
  const devices = [];
  let versionsCollapsed = kept - best.size;
  for (const [k, row] of best) {
    try {
      const rec = normalizeUdiRow(row, {
        reference,
        emdnByCode,
        actorsBySrn,
        sourceUrl: udiDetailUrl(row.UUID),
        retrievedAt: meta.get(k),
      });
      devices.push(rec);
    } catch (err) {
      if (!(err instanceof RowError)) throw err;
      rejected.count += 1;
      if (rejected.samples.length < 20) rejected.samples.push(err.message);
    }
  }
  return { devices, state, states, stats, rejected, keptRaw: kept, versionsCollapsed };
}

// --- BD/RDM (Italia), solo CND categoría W -----------------------------------
async function loadBdrdm() {
  const zip = registry['it-bdrdm'];
  if (!zip?.file) {
    gaps.push({ source: 'it-salute-bdrdm', reason: 'no descargada (correr fetch-official.mjs --only=it)', url: 'https://www.dati.salute.gov.it/it/dataset/dispositivi-medici/' });
    return { rows: [], stats: null };
  }
  const zipPath = join(OFFICIAL_DIR, zip.file);
  const inner = zip.file.split('/').pop().replace(/_csv\.zip$/, '.csv');
  const map = loadColumnMap();
  const child = spawn('unzip', ['-p', zipPath, inner], { stdio: ['ignore', 'pipe', 'inherit'] });
  const version = /DISPO_RDM_1_(\d{4})(\d{2})(\d{2})/.exec(zip.file);
  const sourceVersion = `DISPO_RDM_1_${version[1]}${version[2]}${version[3]} (Last-Modified del archivo oficial; sha256:${zip.sha256.slice(0, 12)})`;
  const ctx = { sourceUrl: zip.url, sourceVersion, retrievedAt: zip.retrievedAt };
  let header = null;
  const rows = [];
  const stats = { read: 0, byCategory: {}, wExported: 0, rejected: 0, personalFiscalCodesDropped: 0 };
  for await (const cells of csvRows(child.stdout, { delimiter: ';' })) {
    if (!header) {
      header = cells.map((h) => h.trim()).filter((h) => h !== '');
      assertColumnMap(map, header);
      continue;
    }
    stats.read += 1;
    const obj = Object.fromEntries(header.map((h, i) => [h, cells[i] ?? '']));
    const cnd = (obj[map.columns.cndCode] ?? '').trim();
    inc(stats.byCategory, cnd ? cnd[0] : '—');
    // Criterio publicado: la CND titula la categoría W «DISPOSITIVI
    // MEDICO-DIAGNOSTICI IN VITRO (D. Lgs. 332/2000)». Las demás categorías
    // (Z11/Z12 mezclan diagnóstico y terapia, igual que en la EMDN) no se exportan.
    if (!cnd.startsWith('W')) continue;
    const fc = (obj[map.columns.fiscalCode] ?? '').trim();
    if (fc && !/^\d{11}$/.test(fc) && !(obj[map.columns.vatNumber] ?? '').trim()) stats.personalFiscalCodesDropped += 1;
    try {
      rows.push({ ...normalizeBdrdmRow(obj, map, ctx), });
      stats.wExported += 1;
    } catch (err) {
      if (!(err instanceof RowError)) throw err;
      stats.rejected += 1;
    }
  }
  await new Promise((res) => child.on('close', res));
  return { rows, stats };
}

// --- principal -----------------------------------------------------------------
async function main() {
  const t0 = Date.now();
  const emdnConcepts = await loadEmdn();
  const emdnByCode = new Map(emdnConcepts.map((c) => [c.code, c]));
  const refRec = registry['eudamed-reference'];
  const actRec = registry['eudamed-actors'];
  if (!refRec?.file || !actRec?.file) throw new Error('faltan /reference o /actors: correr fetch-official.mjs');
  const reference = buildReferenceIndex(readJson(join(OFFICIAL_DIR, refRec.file)).value);
  const actorRows = currentDatalakeActors(readJson(join(OFFICIAL_DIR, actRec.file)).value);
  const actorsBySrn = indexActors(actorRows);
  const actors = actorRows
    .map((r) => normalizeDatalakeActor(r, { retrievedAt: actRec.retrievedAt, official: { url: actRec.url, sha256: actRec.sha256 } }))
    .filter(Boolean);

  const udi = loadUdi({ reference, emdnByCode, actorsBySrn });
  const bdrdm = await loadBdrdm();

  // Alcance y deduplicación exacta: una fila por UDI-DI (no se funden UDI-DI
  // distintos aunque compartan modelo y marca: son niveles de embalaje o variantes).
  const byScope = {};
  const exported = [];
  const seen = new Set();
  for (const d of udi.devices) {
    const codes = typeCodes(d);
    const verdicts = codes.map((t) => classifyEmdn(t.code));
    const s = verdicts.find((v) => v.inScope) ?? verdicts[0] ?? { inScope: false, rule: 'sin-codigo-emdn' };
    if (!s.inScope) { inc(byScope, `fuera:${s.rule}`); continue; }
    if (seen.has(rowKey(d))) continue;
    seen.add(rowKey(d));
    inc(byScope, s.rule);
    exported.push({ ...d, extra: { ...d.extra, dxScope: s.rule } });
  }
  const mfKeys = new Set();
  const brandKeys = new Set();
  for (const d of [...exported, ...bdrdm.rows]) {
    const mf = d.manufacturerRegistryId ?? d.manufacturerName?.toUpperCase();
    if (mf) mfKeys.add(mf);
    if (mf && d.brandName) brandKeys.add(`${mf}|${d.brandName.toUpperCase()}`);
  }

  const files = [];
  const udiParts = writeNdjsonGzParts('eudamed-udi', exported);
  for (const p of udiParts) files.push({ ...p, source: 'eudamed-udi', sourceVersion: 'eudamed-public-api-v1.0' });
  const bdrdmParts = writeNdjsonGzParts('it-salute-bdrdm', bdrdm.rows);
  for (const p of bdrdmParts) files.push({ ...p, source: 'it-salute-bdrdm', sourceVersion: bdrdm.rows[0]?.sourceVersion ?? null });
  const actorParts = writeNdjsonGzParts('eudamed-actors', actors, { dir: outDir('actors') });
  const emdnParts = writeNdjsonGzParts('ec-emdn', emdnConcepts, { dir: outDir('emdn'), sortKey: (c) => c.code });

  const scanComplete = Boolean(udi.state.completedAt);
  if (!scanComplete)
    gaps.push({
      source: 'eudamed-udi',
      reason: `recorrido de /udi INCOMPLETO: ${udi.state.pages} páginas de ~5 650 (reanudable con fetch-eudamed.mjs); las filas exportadas son un subconjunto`,
      url: 'https://api.datalake.sante.service.ec.europa.eu/eudamed/udi',
    });
  gaps.push(
    {
      source: 'mhra-pard',
      reason: 'licencia: PARD clasifica por términos GMDN y su aviso (FAQ «What is GMDN?», leído 2026-10-27) exige licencia de la GMDN Agency para extraer ese contenido con fines de categorización alternativa, mapeo o entrenamiento de IA; no hay descarga masiva',
      url: 'https://pard.mhra.gov.uk/',
    },
    {
      source: 'swissmedic-swissdamed',
      reason: 'términos: las condiciones de Swissmedic prohíben la extracción automatizada sin autorización expresa (leídas el 2026-10-24; hoy el host responde 200 pero swissdamed no publica archivo abierto ni condiciones de reutilización verificables); sin autorización escrita no se descarga',
      url: 'https://swissdamed.ch/',
    },
    {
      source: 'eudamed-certificates',
      reason: 'la API interna del portal (basicUdiData) no tiene términos de reutilización leídos; el Data Lake oficial no expone certificados ni organismo notificado',
      url: 'https://ec.europa.eu/tools/eudamed/',
    },
    {
      source: 'it-salute-bdrdm-fuera-de-W',
      reason: 'curaduría: la BD/RDM trae 2,4 millones de registros; solo la categoría CND W está titulada como diagnóstico in vitro. Los tipos de diagnóstico dentro de Z11/Z12/C/G/Q… exigen decisión tipo por tipo contra la CND (propietario)',
      url: 'https://www.dati.salute.gov.it/it/dataset/dispositivi-medici/',
    },
    { source: 'ec-nando', reason: 'no es un registro de equipos (organismos notificados); sin descarga masiva', url: 'https://webgate.ec.europa.eu/single-market-compliance-space/notified-bodies' },
    { source: 'de-bfarm', reason: 'sin descarga pública de registros de equipos (remite a EUDAMED); re-sondeado 2026-10-27: el host responde, sin archivo', url: 'https://www.bfarm.de/EN/Medical-devices/_node.html' },
    { source: 'es-aemps-ccps', reason: 'consulta pública sin descarga masiva; re-sondeado 2026-10-27: el host responde, sin archivo', url: 'https://www.aemps.gob.es/' },
    { source: 'fr-ansm', reason: 'sin registro nacional descargable (remite a EUDAMED); re-sondeado 2026-10-27', url: 'https://ansm.sante.fr/' },
  );

  const generatedAt = nowIso();
  const manifest = {
    region: 'eu',
    generatedAt: generatedAt.replace(/\.\d+Z$/, 'Z'),
    formatVersion: 1,
    files: files.map(({ path, source, sourceVersion, rows, sha256 }) => ({ path, source, sourceVersion, rows, sha256 })),
    classifications: emdnParts.map(({ path, rows, sha256 }) => ({
      path: `emdn/${path}`, system: 'emdn', sourceVersion: emdnConcepts[0]?.sourceVersion ?? null, rows, sha256,
    })),
    actors: actorParts.map(({ path, rows, sha256 }) => ({
      path: `actors/${path}`, source: 'eudamed-actors', rows, sha256,
      note: 'Actores de EUDAMED (no son filas de equipos). Sin e-mail, teléfono ni personas responsables (PRRC).',
    })),
    provenance: {
      emdn: registry.emdn,
      'eudamed-reference': registry['eudamed-reference'],
      'eudamed-actors': registry['eudamed-actors'],
      'it-bdrdm': registry['it-bdrdm'],
      'eudamed-udi-scan': { firstUrl: udi.state.firstUrl, startedAt: udi.state.startedAt, completedAt: udi.state.completedAt, pages: udi.state.pages },
    },
    scope: 'EUDAMED: código EMDN en alcance (lib/emdn-scope.mjs: categoría W entera y 79 tipos revisados); BD/RDM: CND categoría W entera. extra.dxScope dice qué regla incluyó cada fila.',
    gaps,
  };
  writeJson(outDir('manifest.json'), manifest);
  const coverage = {
    generatedAt,
    eudamed: {
      scanComplete,
      pages: udi.state.pages,
      rowsSeen: udi.state.rowsSeen,
      rowsKeptInScope: udi.keptRaw,
      versionsCollapsed: udi.versionsCollapsed,
      rejected: udi.rejected,
      byEmdnCategoryAll: udi.stats.byCategory,
      byRuleAll: udi.stats.byRule,
      exported: exported.length,
      byScopeExported: byScope,
      idMin: udi.stats.idMin,
      idMax: udi.stats.idMax,
    },
    bdrdm: bdrdm.stats,
    actors: actors.length,
    emdnConcepts: emdnConcepts.length,
    emdnInScope: emdnConcepts.filter((c) => c.scope.inScope).length,
    includedPrefixesRetiredInV2026: retiredPrefixes,
    distinctManufacturers: mfKeys.size,
    distinctBrands: brandKeys.size,
    files,
    seconds: Math.round((Date.now() - t0) / 1000),
  };
  writeJson(outDir('coverage.json'), coverage);
  writeFileSync(
    outDir('coverage.md'),
    `# Cobertura — equipos de diagnóstico, registros de Europa (fuentes oficiales)\n\nGenerado: ${generatedAt}\n\n` +
      `| Métrica | Valor |\n|---|---|\n` +
      `| EUDAMED /udi: recorrido completo | ${scanComplete ? 'sí' : 'NO (reanudable)'} |\n` +
      `| EUDAMED /udi: filas vistas | ${udi.state.rowsSeen} |\n` +
      `| EUDAMED /udi: filas en alcance de diagnóstico | ${udi.keptRaw} |\n` +
      `| EUDAMED /udi: filas exportadas (1 por UDI-DI, versión vigente) | ${exported.length} |\n` +
      `| BD/RDM: filas leídas / exportadas (CND W) | ${bdrdm.stats?.read ?? 0} / ${bdrdm.stats?.wExported ?? 0} |\n` +
      `| Actores EUDAMED | ${actors.length} |\n` +
      `| Conceptos EMDN v2026 / en alcance | ${emdnConcepts.length} / ${coverage.emdnInScope} |\n` +
      `| Fabricantes distintos / marcas distintas | ${mfKeys.size} / ${brandKeys.size} |\n\n` +
      `## Huecos\n\n| Fuente | Motivo |\n|---|---|\n${gaps.map((g) => `| ${g.source} | ${g.reason.replace(/\|/g, '/')} |`).join('\n')}\n`,
  );
  console.log(JSON.stringify({ exported: exported.length, bdrdm: bdrdm.rows.length, actors: actors.length, emdn: emdnConcepts.length, scanComplete, pages: udi.state.pages, seconds: coverage.seconds }, null, 2));
}

main().catch((err) => {
  console.error('ERROR FATAL en eu/build-official:', err);
  process.exitCode = 1;
});
