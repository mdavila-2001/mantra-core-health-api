#!/usr/bin/env node
// =============================================================================
// Servicios por especialidad · etapa 1 (fuentes → corpus NDJSON, sin base).
//
// Baja las fuentes a `<BUILD_DIR>/cache/` (fuera de git), verifica el SHA-256 de
// cada una, coteja las copias (FONASA contra la extracción del PDF oficial del
// repo; CUPS copia A contra copia B), aplica las reglas de evidencia de
// `src/common/seed/data/specialty-services/rules.json` y escribe:
//   <BUILD_DIR>/specialty-services.ndjson     un servicio por línea, con su evidencia
//   <BUILD_DIR>/specialty-services.meta.json  hashes, cruces, cobertura, huecos
//
// Uso:
//   node tools/terminology-import/specialty-services/build-specialty-services.mjs
//   node tools/terminology-import/specialty-services/build-specialty-services.mjs --report   # imprime la tabla de cobertura en markdown
// =============================================================================

import { writeFileSync } from 'node:fs';

import { BUILD_DIR, CORPUS_PATH, META_PATH, ensureDir, fetchCached, readTarGzMember, sha256 } from './lib/common.mjs';
import { buildCorpus, coverage } from './lib/corpus.mjs';
import { compileRules, loadModelSpecialties, loadRules, referencedSpecialties } from './lib/rules.mjs';
import {
  SOURCES,
  crossValidateCups,
  parseCupsCopyA,
  parseCupsCopyB,
  parseFonasa,
  readBoDataset,
  readFonasaPdfExtracts,
  verifyFonasaAgainstPdf,
} from './lib/sources.mjs';

const REPORT = process.argv.includes('--report');

async function loadFonasa() {
  const t = SOURCES.fonasa.transport;
  const { bytes, sha256: tgzSha } = await fetchCached(t.url, { sha256: t.sha256, name: 'fonasa-mle-open-1.0.0.tgz' });
  const member = readTarGzMember(bytes, t.member);
  const rows = parseFonasa(member.toString('utf8'));
  const check = verifyFonasaAgainstPdf(rows, readFonasaPdfExtracts());
  if (check.problems.length > 0) {
    throw new Error(`FONASA: la copia npm no coincide con el PDF oficial en ${check.problems.length} filas: ${check.problems.slice(0, 5).join('; ')}`);
  }
  return { rows, transport: { ...t, sha256: tgzSha, memberSha256: sha256(member) }, check };
}

async function loadCups() {
  const [a, b] = SOURCES.cups.transport.copies;
  const raw = (c) => `https://raw.githubusercontent.com/${c.repo}/${c.commit}/${c.path}`;
  const fa = await fetchCached(raw(a), { sha256: a.sha256, name: `cups-A-${a.commit.slice(0, 12)}.js` });
  const fb = await fetchCached(raw(b), { sha256: b.sha256, name: `cups-B-${b.commit.slice(0, 12)}.sql` });
  const copyA = parseCupsCopyA(fa.bytes.toString('utf8'));
  const copyB = parseCupsCopyB(fb.bytes.toString('utf8'));
  const cross = crossValidateCups(copyA, copyB);
  return {
    agreed: cross.agreed,
    onlyA: cross.onlyA,
    transport: { kind: 'github-raw-pair', copies: [a, b].map((c) => ({ repo: c.repo, commit: c.commit, path: c.path, url: raw(c), sha256: c.sha256 })) },
    cross: { copyA: copyA.size, copyB: copyB.size, agreed: cross.agreed.length, onlyA: cross.onlyA.length, onlyB: cross.onlyB.length, disagree: cross.disagree.length },
  };
}

function markdownCoverage(cov) {
  const lines = ['| Especialidad | Código | Servicios | FONASA | CUPS | Arancel BO | Nombres distintos |', '|---|---|---:|---:|---:|---:|---:|'];
  for (const r of cov) {
    lines.push(`| ${r.display} | \`${r.code}\` | ${r.total} | ${r.bySource['fonasa-mle-2026'] ?? 0} | ${r.bySource['cups-co'] ?? 0} | ${r.bySource.VS_BO_MEDICAL_PROCEDURE ?? 0} | ${r.distinctNames} |`);
  }
  return lines.join('\n');
}

async function main() {
  ensureDir(BUILD_DIR);
  const rules = loadRules();
  const model = loadModelSpecialties();
  const modelCodes = new Set(model.specialties.map((s) => s.code));
  const missing = [...referencedSpecialties(rules)].filter((c) => !modelCodes.has(c));
  if (missing.length > 0) throw new Error(`rules.json apunta a especialidades que el modelo no tiene: ${missing.join(', ')}`);

  const retrievedAt = new Date().toISOString();
  const fonasa = await loadFonasa();
  const cups = await loadCups();
  const bo = readBoDataset();

  const corpus = buildCorpus(
    { fonasaRows: fonasa.rows, cupsAgreed: cups.agreed, cupsOnlyA: cups.onlyA, bo, retrievedAt, transports: { fonasa: fonasa.transport, cups: cups.transport } },
    compileRules(rules),
  );
  const cov = coverage(corpus.records, model.specialties);

  writeFileSync(CORPUS_PATH(), corpus.records.map((r) => JSON.stringify(r)).join('\n') + '\n');
  const meta = {
    builtAt: retrievedAt,
    rulesVersion: rules.version,
    modelSnapshot: model.source,
    fonasa: { rows: fonasa.rows.length, verifiedAgainstPdf: fonasa.check, transport: fonasa.transport },
    cups: { ...cups.cross, transport: cups.transport },
    bo: { honorariosMedicos: bo.honorariosMedicos.length, arancelOdontologico: bo.arancelOdontologico.length },
    records: corpus.records.length,
    relations: corpus.records.reduce((n, r) => n + new Set(r.evidence.map((e) => e.specialty)).size, 0),
    coverage: cov,
    gaps: corpus.gaps,
    unmatched: corpus.unmatched,
    excluded: corpus.excluded,
  };
  writeFileSync(META_PATH(), JSON.stringify(meta, null, 2));

  console.log(JSON.stringify({ corpus: CORPUS_PATH(), records: meta.records, relations: meta.relations, fonasa: { rows: meta.fonasa.rows, checkedAgainstPdf: fonasa.check.checked }, cups: cups.cross, gaps: corpus.gaps.length, unmatched: corpus.unmatched.length }, null, 2));
  if (REPORT) console.log(`\n${markdownCoverage(cov)}`);
}

main().catch((err) => {
  console.error(err.stack ?? err.message);
  process.exit(1);
});
