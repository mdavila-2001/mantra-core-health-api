#!/usr/bin/env node
// =============================================================================
// Etapa 2 (sin red): fuentes descargadas → NDJSON normalizado + reporte de cobertura.
//
//   glossary-data-build/nursing-care/openehr-ckm.ndjson          arquetipos, nodos y respuestas
//   glossary-data-build/nursing-care/es-msssi-cmdic-13606.ndjson   CMDIC del Ministerio de Sanidad (ISO 13606)
//   glossary-data-build/nursing-care/nursing-terminology-registry.ndjson
//   glossary-data-build/nursing-care/coverage.json               conteos reales
//
// Requiere haber corrido `fetch-sources.mjs` (lee `sources.meta.json`).
// =============================================================================

import { readdirSync, readFileSync, statSync } from 'node:fs';
import { join, relative } from 'node:path';
import { nowIso, writeJson, writeNdjson } from '../lib/glossary-es/common.mjs';
import { parseArchetype } from './lib/adl.mjs';
import { CODE_SYSTEM, LOADED_ARCHETYPE_CLASSES, NURSING_RULES, archetypeClass, archetypeRmLabel, archetypeRows } from './lib/ckm.mjs';
import { MISSING_SCALES, SCALE_LICENSE_NOTES } from './lib/licenses.mjs';
import { MSSSI_CODE_SYSTEM, MSSSI_RULES, MSSSI_SUBDIR, NURSING_REPORT_ID, msssiProfile, slotTargets } from './lib/msssi.mjs';
import { NURSING_OUT, SOURCES_META } from './lib/paths.mjs';
import { REGISTRY_CODE_SYSTEM, registryRows } from './lib/registry.mjs';

function walk(dir, ext, out = []) {
  for (const name of readdirSync(dir)) {
    if (name === '.git') continue;
    const p = join(dir, name);
    if (statSync(p).isDirectory()) walk(p, ext, out);
    else if (name.endsWith(ext)) out.push(p);
  }
  return out.sort();
}

const count = (rows, fn) => rows.reduce((m, r) => {
  const k = fn(r);
  m[k] = (m[k] ?? 0) + 1;
  return m;
}, {});

async function main() {
  const meta = JSON.parse(readFileSync(SOURCES_META, 'utf8'));
  const { ckm, adlArchetypes, tho } = meta;

  // --- openEHR CKM -----------------------------------------------------------
  const files = walk(ckm.dir, '.adl');
  const rows = [];
  const excluded = {};
  const seen = new Set();
  for (const f of files) {
    const archetype = parseArchetype(readFileSync(f, 'utf8'));
    const cls = archetypeClass(archetype.archetypeId);
    if (!LOADED_ARCHETYPE_CLASSES.has(cls)) {
      const k = archetypeRmLabel(archetype.archetypeId);
      excluded[k] = (excluded[k] ?? 0) + 1;
      continue;
    }
    if (seen.has(archetype.archetypeId)) throw new Error(`Arquetipo repetido en el espejo: ${archetype.archetypeId}`);
    seen.add(archetype.archetypeId);
    const out = archetypeRows(archetype, { path: relative(ckm.dir, f), commit: ckm.commit, retrievedAt: ckm.retrievedAt, repoUrl: ckm.repoUrl });
    const note = SCALE_LICENSE_NOTES[archetype.archetypeId];
    if (note) out[0].licenseVerification = note;
    rows.push(...out);
  }
  const codes = new Set();
  for (const r of rows) {
    if (codes.has(r.code)) throw new Error(`Código repetido: ${r.code}`);
    codes.add(r.code);
  }
  for (const r of rows) if (r.parentCode && !codes.has(r.parentCode)) throw new Error(`Padre ausente para ${r.code}: ${r.parentCode}`);

  // --- Ministerio de Sanidad (CMDIC, ISO 13606) ------------------------------
  const msssiDir = join(adlArchetypes.dir, MSSSI_SUBDIR);
  const msssiParsed = walk(msssiDir, '.adl').map((f) => ({ f, a: parseArchetype(readFileSync(f, 'utf8')) }));
  const report = msssiParsed.find((x) => x.a.archetypeId === NURSING_REPORT_ID);
  if (!report) throw new Error(`Falta ${NURSING_REPORT_ID} en ${msssiDir}`);
  const targets = slotTargets(report.a, msssiParsed.map((x) => x.a.archetypeId));
  const profile = msssiProfile(targets);
  const msssi = msssiParsed.flatMap(({ f, a }) => archetypeRows(a, { path: relative(adlArchetypes.dir, f), commit: adlArchetypes.commit, retrievedAt: adlArchetypes.retrievedAt, repoUrl: adlArchetypes.repoUrl, profile }));
  const msssiCodes = new Set();
  for (const r of msssi) {
    if (msssiCodes.has(r.code)) throw new Error(`Código repetido (CMDIC): ${r.code}`);
    msssiCodes.add(r.code);
  }

  // --- HL7 THO --------------------------------------------------------------
  const nsDir = tho.dir;
  const namingSystems = Object.fromEntries(
    readdirSync(nsDir).filter((n) => n.startsWith('NamingSystem-') && n.endsWith('.json')).map((n) => {
      const d = JSON.parse(readFileSync(join(nsDir, n), 'utf8'));
      return [d.id, d];
    }),
  );
  const registry = registryRows(namingSystems, tho);

  await writeNdjson(join(NURSING_OUT, `${CODE_SYSTEM}.ndjson`), rows);
  await writeNdjson(join(NURSING_OUT, `${MSSSI_CODE_SYSTEM}.ndjson`), msssi);
  await writeNdjson(join(NURSING_OUT, `${REGISTRY_CODE_SYSTEM}.ndjson`), registry);

  // --- Cobertura ------------------------------------------------------------
  const roots = rows.filter((r) => r.kind === 'archetype');
  const nursingRoots = roots.filter((r) => r.nursingRules.length);
  const nursingCodes = new Set(nursingRoots.map((r) => r.code));
  const allBindings = rows.flatMap((r) => r.bindings.map((b) => ({ ...b, kind: r.kind })));
  const coverage = {
    generatedAt: nowIso(),
    sources: { ckm: { commit: ckm.commit, commitDate: ckm.commitDate, repoUrl: ckm.repoUrl }, adlArchetypes: { commit: adlArchetypes.commit, commitDate: adlArchetypes.commitDate, repoUrl: adlArchetypes.repoUrl, path: MSSSI_SUBDIR }, tho: { package: `${tho.packageName}@${tho.packageVersion}`, integrity: tho.integrity, license: tho.packageLicense } },
    openehrCkm: {
      adlFiles: files.length,
      archetypesLoaded: roots.length,
      archetypesExcludedByClass: excluded,
      concepts: rows.length,
      byKind: count(rows, (r) => r.kind),
      byRmType: count(rows, (r) => r.rmType),
      withSpanish: count(rows, (r) => `${r.kind}:${r.nameEs ? 'es' : 'sin-es'}`),
      spanishLanguages: count(rows.filter((r) => r.esLanguage), (r) => r.esLanguage),
      originalLanguages: count(roots, (r) => r.originalLanguage),
      contentLicenseByArchetype: count(roots, (r) => r.contentLicense.status),
      archetypesWithContentWithheld: roots.filter((r) => !r.contentLoaded).length,
      valuesWithOrdinal: rows.filter((r) => r.kind === 'value' && r.ordinalValue !== null).length,
      specialisations: roots.filter((r) => r.specialises).length,
      bindings: {
        total: allBindings.length,
        byTerminology: count(allBindings, (b) => b.terminology),
        loincCodes: new Set(allBindings.filter((b) => /^(LOINC|LNC)/i.test(b.terminology)).map((b) => b.code)).size,
      },
    },
    nursingSubset: {
      archetypes: nursingRoots.length,
      withSpanishName: nursingRoots.filter((r) => r.nameEs).length,
      byRule: Object.fromEntries(NURSING_RULES.map((rule) => [rule.key, nursingRoots.filter((r) => r.nursingRules.includes(rule.key)).length])),
      conceptsInsideNursingArchetypes: rows.filter((r) => nursingCodes.has(r.archetypeId)).length,
      contentLicense: count(nursingRoots, (r) => r.contentLicense.status),
      scalesWithContentWithheld: nursingRoots.filter((r) => !r.contentLoaded).map((r) => ({ code: r.code, name: r.nameEs ?? r.nameOriginal, status: r.contentLicense.status })),
    },
    msssiCmdic: {
      adlFiles: msssiParsed.length,
      concepts: msssi.length,
      byKind: count(msssi, (r) => r.kind),
      byRmType: count(msssi, (r) => r.rmType),
      nursingReportSlotTargets: [...targets].sort(),
      nursingArchetypes: msssi.filter((r) => r.kind === 'archetype' && r.nursingRules.length).map((r) => ({ code: r.code, name: r.nameEs, rules: r.nursingRules })),
      byRule: Object.fromEntries(MSSSI_RULES.map((rule) => [rule.key, msssi.filter((r) => r.kind === 'archetype' && r.nursingRules.includes(rule.key)).length])),
    },
    registry: { terminologies: registry.length, byLicense: count(registry, (r) => r.license.status) },
    missingScales: MISSING_SCALES,
    relations: {
      diseaseOrSymptomPublished: 0,
      note: 'Ninguna fuente alcanzable publica relaciones enfermedad/síntoma ↔ cuidado de enfermería. Ver docs/seed-research/nursing-care.md.',
    },
  };
  writeJson(join(NURSING_OUT, 'coverage.json'), coverage, true);
  console.log(JSON.stringify(coverage, null, 2));
}

main().catch((err) => {
  console.error('ERROR en build-nursing-care:', err);
  process.exitCode = 1;
});
