#!/usr/bin/env node
// =============================================================================
// Repositorio universal de servicios · etapa 1 (fuentes → corpus versionado).
//
// Corre cada adaptador de `lib/adapters/` (contrato en ADAPTERS.md), une los
// registros por (sistema, código) y escribe el corpus en `data/`
// (`service-repository.part-NNN.ndjson.gz` + `MANIFEST.json`), que es lo que
// lee `load-service-repository.mjs`. Las fuentes crudas NO viven en git: se
// leen de `$SERVICE_REPOSITORY_SOURCES_DIR` y cada adaptador verifica su SHA-256.
//
// Unión: si dos adaptadores traen el mismo código del mismo sistema (p. ej. la
// CUPS 2026 oficial y el dataset PBS), el nombre lo pone el de mayor prioridad
// (los `mergeOnly` van últimos) y los demás sólo suman definición, sinónimos y
// especialidades.
//
// Además absorbe las especialidades ya relacionadas por `specialty-services/`
// (mismo id de concepto), para que la cobertura del reporte sea la real.
//
// Uso:
//   node tools/terminology-import/service-repository/build-service-repository.mjs [--only clave,clave] [--report]
// =============================================================================

import { readdirSync, readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { pathToFileURL } from 'node:url';

import { DATA_DIR, SOURCES_DIR, norm } from './lib/common.mjs';
import { conceptIdOf } from './lib/load-plan.mjs';
import { readGzParts, writeGzParts } from '../specialty-services/lib/common.mjs';
import { REPO_DATA_DIR as SPECIALTY_DATA_DIR } from '../specialty-services/lib/common.mjs';

const ADAPTERS_DIR = new URL('./lib/adapters/', import.meta.url);
const onlyArg = process.argv.find((a) => a.startsWith('--only='));
const ONLY = onlyArg ? new Set(onlyArg.slice(7).split(',')) : null;

export async function loadAdapters() {
  const files = readdirSync(ADAPTERS_DIR).filter((f) => f.endsWith('.mjs')).sort();
  const mods = [];
  for (const f of files) {
    const key = f.replace(/\.mjs$/, '');
    if (ONLY && !ONLY.has(key)) continue;
    mods.push({ key, mod: await import(new URL(f, ADAPTERS_DIR).href) });
  }
  // Prioridad del nombre: primero las fuentes propias, al final las de sólo-enriquecer.
  return mods.sort((a, b) => Number(Boolean(a.mod.meta.mergeOnly)) - Number(Boolean(b.mod.meta.mergeOnly)) || a.key.localeCompare(b.key));
}

/** Une registros por (sistema, código). Pura: es lo que prueba el test. */
export function mergeRecords(batches) {
  const byKey = new Map();
  for (const { records } of batches) {
    for (const r of records) {
      const key = `${r.codeSystem}|${r.code}`;
      const prev = byKey.get(key);
      // `attachOnly`: sólo suma a un concepto que otra fuente ya trajo (p. ej. una cita curada sobre un CUPS).
      if (!prev && r.attachOnly) continue;
      if (!prev) {
        const { attachOnly, ...rest } = r;
        byKey.set(key, { ...rest, synonyms: [...(r.synonyms ?? [])], specialties: [...(r.specialties ?? [])] });
        continue;
      }
      if (!prev.definition && r.definition) {
        prev.definition = r.definition;
        prev.definitionSource = r.definitionSource ?? null;
      }
      if (r.display && r.display !== prev.display && !prev.synonyms.some((s) => s.value === r.display)) {
        prev.synonyms.push({ value: r.display, lang: 'es' });
      }
      for (const s of r.synonyms ?? []) if (!prev.synonyms.some((x) => x.value === s.value)) prev.synonyms.push(s);
      for (const s of r.specialties ?? []) if (!prev.specialties.some((x) => x.code === s.code)) prev.specialties.push(s);
      if (!prev.price && r.price) prev.price = r.price;
      if (!prev.chapter && r.chapter) prev.chapter = r.chapter;
    }
  }
  return foldCurated([...byKey.values()]);
}

/**
 * Un servicio curado cuyo nombre ya es el de un servicio con código oficial
 * (mismo texto normalizado, en el nombre o un sinónimo) no nace aparte: se
 * pliega en el oficial, que gana sus especialidades.
 */
export function foldCurated(records) {
  const official = new Map();
  for (const r of records) {
    if (r.codeSystem === 'mantra-curado') continue;
    for (const name of [r.display, ...(r.synonyms ?? []).map((s) => s.value)]) {
      const k = norm(name);
      if (k && !official.has(k)) official.set(k, r);
    }
  }
  const out = [];
  for (const r of records) {
    const target = r.codeSystem === 'mantra-curado' ? official.get(norm(r.display)) : null;
    if (!target) { out.push(r); continue; }
    for (const sp of r.specialties) if (!target.specialties.some((x) => x.code === sp.code)) target.specialties.push(sp);
  }
  return out;
}

/** Especialidades que ya relacionó specialty-services/, por id de concepto. */
function specialtyEvidenceById() {
  const manifest = JSON.parse(readFileSync(join(SPECIALTY_DATA_DIR, 'MANIFEST.json'), 'utf8'));
  const map = new Map();
  for (const line of readGzParts(SPECIALTY_DATA_DIR, manifest.corpus)) {
    const r = JSON.parse(line);
    map.set(r.id, r.evidence.map((e) => ({ code: e.specialty, method: `specialty-services:${e.basis}`, detail: e.phrase ?? null })));
  }
  return map;
}

async function main() {
  const adapters = await loadAdapters();
  const batches = [];
  const metas = new Map();
  const reports = {};
  for (const { key, mod } of adapters) {
    const out = await mod.build({ sourcesDir: SOURCES_DIR });
    for (const r of out.records) if (!r.attachOnly && r.codeSystem !== mod.meta.internalCode) throw new Error(`${key}: registro con codeSystem ${r.codeSystem}`);
    batches.push(out);
    reports[key] = out.report;
    // Los adaptadores vienen ordenados con los `mergeOnly` al final: el primero que declara el sistema es el dueño.
    if (!metas.has(mod.meta.internalCode)) metas.set(mod.meta.internalCode, { ...mod.meta, adapter: key });
    console.log(`${key}: ${out.report.kept} de ${out.report.read}`);
  }

  const records = mergeRecords(batches);
  const evidence = specialtyEvidenceById();
  let absorbed = 0;
  for (const r of records) {
    const prev = evidence.get(conceptIdOf(r));
    if (!prev) continue;
    for (const s of prev) if (!r.specialties.some((x) => x.code === s.code)) { r.specialties.push(s); absorbed += 1; }
  }

  records.sort((a, b) => a.codeSystem.localeCompare(b.codeSystem) || a.code.localeCompare(b.code, 'es'));
  const parts = writeGzParts(DATA_DIR, 'service-repository', records.map((r) => JSON.stringify(r)));
  const meta = {
    builtFrom: Object.fromEntries(adapters.map(({ key, mod }) => [key, mod.meta.files])),
    codeSystems: [...metas.values()].map(({ files, adapter, mergeOnly, ...m }) => m),
    reports,
    absorbedSpecialtyRelations: absorbed,
  };
  const metaParts = writeGzParts(DATA_DIR, 'service-repository.meta', [JSON.stringify(meta)]);
  const bySystem = {};
  for (const r of records) bySystem[r.codeSystem] = (bySystem[r.codeSystem] ?? 0) + 1;
  writeFileSync(
    join(DATA_DIR, 'MANIFEST.json'),
    JSON.stringify(
      {
        _nota: 'Corpus del repositorio universal de servicios. Lo escribe build-service-repository.mjs; lo lee load-service-repository.mjs. Las fuentes crudas no se versionan (SOURCES.md).',
        records: records.length,
        bySystem,
        withSpecialty: records.filter((r) => r.specialties.length > 0).length,
        withDefinition: records.filter((r) => r.definition).length,
        corpus: parts,
        meta: metaParts,
      },
      null,
      2,
    ) + '\n',
  );
  console.log(JSON.stringify({ records: records.length, bySystem, absorbed }, null, 2));
}

if (import.meta.url === pathToFileURL(process.argv[1]).href) {
  main().catch((err) => {
    console.error(err.stack ?? err.message);
    process.exit(1);
  });
}
