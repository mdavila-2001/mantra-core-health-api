#!/usr/bin/env node
// =============================================================================
// Propuesta de especialidades y profesiones que las fuentes nombran y `VS_MEDICAL_SPECIALTY` no tiene.
//
// Lee los huecos (`gaps`) del armado —local si existe, si no la copia versionada en `data/`— y los
// agrupa SIN fusionar nombres de fuentes distintas: cada fila es una frase o sección tal cual la
// escribe UNA fuente, con cuántos servicios deja sin especialidad. Fusionar «CIRUGIA PLASTICA Y REPARADORA»
// (FONASA) con «Cirugía Plástica, Estética y Reconstructiva» (arancel SCZ) sería inventar una equivalencia que
// ninguna fuente publica; eso lo decide el propietario del modelo. No inventa códigos.
//
// Escribe `<BUILD_DIR>/model-proposal.json` (con `--write-repo-data`, `data/model-proposal.json`, que está versionado) y, con `--markdown`, la tabla.
//   node tools/terminology-import/specialty-services/propose-model-specialties.mjs [--markdown] [--write-repo-data]
// =============================================================================

import { existsSync, readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';

import { BUILD_DIR, META_PATH, REPO_DATA_DIR, ensureDir, readGzParts } from './lib/common.mjs';
import { loadModelSpecialties } from './lib/rules.mjs';

function readMeta() {
  if (existsSync(META_PATH())) return JSON.parse(readFileSync(META_PATH(), 'utf8'));
  const manifest = JSON.parse(readFileSync(join(REPO_DATA_DIR, 'MANIFEST.json'), 'utf8'));
  return JSON.parse(readGzParts(REPO_DATA_DIR, manifest.meta)[0]);
}

const SOURCE_LABEL = { boArancel: 'Arancel SCZ', fonasa: 'FONASA MLE 2026', cups: 'CUPS (copias)', cups2025: 'CUPS 2025 (Res. 2706/2025)' };

const meta = readMeta();
const model = loadModelSpecialties();
const rows = meta.gaps
  .map((g) => ({
    source: g.source,
    sourceLabel: SOURCE_LABEL[g.source] ?? g.source,
    name: g.phrase ?? g.section,
    basis: g.basis,
    servicesWithoutSpecialty: g.count,
    reason: g.note ?? null,
    examples: g.examples,
  }))
  .sort((a, b) => b.servicesWithoutSpecialty - a.servicesWithoutSpecialty || a.name.localeCompare(b.name, 'es'));
const bySource = {};
for (const r of rows) {
  bySource[r.source] ??= { names: 0, services: 0 };
  bySource[r.source].names += 1;
  bySource[r.source].services += r.servicesWithoutSpecialty;
}
const proposal = {
  generatedAt: new Date().toISOString(),
  modelSnapshot: model.source,
  modelSpecialties: model.specialties.length,
  corpusBuiltAt: meta.builtAt,
  rulesVersion: meta.rulesVersion,
  note: 'Cada fila es un nombre tal cual lo escribe UNA fuente. No se fusionan nombres de fuentes distintas ni se proponen códigos: el código de cada especialidad nueva lo fija el propietario del modelo.',
  bySource,
  rows,
};
// Pisar `data/` (versionado) exige --write-repo-data; por defecto va a <BUILD_DIR>/model-proposal.json.
const target = process.argv.includes('--write-repo-data') ? join(REPO_DATA_DIR, 'model-proposal.json') : join(ensureDir(BUILD_DIR), 'model-proposal.json');
writeFileSync(target, `${JSON.stringify(proposal, null, 2)}\n`);
console.error(`Propuesta escrita en ${target}`);
console.log(JSON.stringify({ rows: rows.length, bySource }, null, 2));
if (process.argv.includes('--markdown')) {
  console.log('\n| Fuente | Nombre en la fuente | Servicios sin especialidad del modelo | Motivo |\n|---|---|---:|---|');
  for (const r of rows) console.log(`| ${r.sourceLabel} | ${r.name} | ${r.servicesWithoutSpecialty} | ${r.reason ?? '—'} |`);
}
