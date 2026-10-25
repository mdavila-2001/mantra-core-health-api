// =============================================================================
// Corpus de servicios por especialidad (puro): de las filas de cada fuente a
// registros `{ servicio, evidencia[] }`, más los huecos y las frases sin regla.
//
// Entra al corpus sólo un servicio con al menos UNA especialidad del modelo
// respaldada por la fuente. Lo demás no se descarta en silencio: queda contado
// en `gaps` (la fuente nombra una especialidad que el modelo no tiene) o en
// `unmatched` (frase de prestador que ninguna regla decide).
// =============================================================================

import { deterministicId } from '../../lib/glossary-es/common.mjs';
import { md5uuid } from '../../lib/glossary-es/load-plan.mjs';
import { dentalRule, fonasaGroupRule, headingRule, performerPhrases } from './rules.mjs';
import { SOURCES, cupsComparable } from './sources.mjs';
import { clean } from './common.mjs';

export const serviceConceptId = (codeSystem, code) => md5uuid(`mantra:specialty-services:concept:${codeSystem}:${code}`);

/** Mismos ids que `bolivia-fee-schedule.catalog.ts` (`boFeeConceptId`, `boFeeConceptCode`). */
export const boConceptId = (code) => deterministicId(`seed:concept:bo-procedure:${code}`);
export const boConceptCode = (code) => `procedure:bo:${code}`;

class Tally {
  constructor() {
    this.map = new Map();
  }
  add(key, base, example) {
    const k = JSON.stringify(key);
    const row = this.map.get(k) ?? { ...base, count: 0, examples: [] };
    row.count += 1;
    if (row.examples.length < 3) row.examples.push(example);
    this.map.set(k, row);
  }
  list() {
    return [...this.map.values()].sort((a, b) => b.count - a.count);
  }
}

function pushEvidence(list, ev) {
  const key = `${ev.specialty}|${ev.basis}|${ev.section ?? ''}|${ev.phrase ?? ''}`;
  if (!list.some((e) => `${e.specialty}|${e.basis}|${e.section ?? ''}|${e.phrase ?? ''}` === key)) list.push(ev);
}

function sourceBlock(def, extra) {
  return {
    sourceCode: def.sourceCode,
    sourceName: def.sourceName,
    owner: def.owner,
    codeSystem: def.codeSystem,
    version: def.version,
    officialUrl: def.officialUrl,
    license: def.license,
    ...extra,
  };
}

/**
 * Aplica las reglas de descriptor a un servicio. Devuelve cuántas evidencias
 * sumó; anota huecos y frases sin regla.
 */
function applyPerformer(compiled, sourceKey, row, evidence, gaps, unmatched) {
  for (const { phrase, rule } of performerPhrases(compiled, sourceKey, row.display)) {
    if (rule === undefined) unmatched.add({ sourceKey, phrase }, { source: sourceKey, phrase }, `${row.code} ${row.display}`);
    else if (rule.specialty === null) gaps.add({ sourceKey, phrase }, { source: sourceKey, basis: 'descriptor', phrase, note: rule.note ?? null }, `${row.code} ${row.display}`);
    else pushEvidence(evidence, { specialty: rule.specialty, basis: 'descriptor', phrase: rule.phrase, match: rule.match, ...(rule.note ? { note: rule.note } : {}) });
  }
}

export function buildCorpus({ fonasaRows, cupsAgreed, cupsOnlyA = [], bo, retrievedAt, transports }, compiled) {
  const records = [];
  const gaps = new Tally();
  const unmatched = new Tally();
  const excluded = new Tally();

  // --- FONASA ------------------------------------------------------------------
  for (const row of fonasaRows) {
    const g = fonasaGroupRule(compiled, row.code);
    if (g.excluded) {
      excluded.add({ s: 'fonasa', g: g.group }, { source: 'fonasa', section: `Grupo ${g.group} · ${g.title}`, reason: g.excluded }, row.code);
      continue;
    }
    const evidence = [];
    if (g.specialty) {
      pushEvidence(evidence, { specialty: g.specialty, basis: 'source-section', section: `Grupo ${g.group} · ${g.title}`, match: g.match, ...(g.note ? { note: g.note } : {}) });
    } else if (g.title && g.note && /Falta/.test(g.note)) {
      gaps.add({ s: 'fonasa', g: g.group }, { source: 'fonasa', basis: 'source-section', section: `Grupo ${g.group} · ${g.title}`, note: g.note }, `${row.code} ${row.display}`);
    }
    applyPerformer(compiled, 'fonasa', row, evidence, gaps, unmatched);
    if (evidence.length === 0) continue;
    records.push({
      id: serviceConceptId(SOURCES.fonasa.codeSystem, row.code),
      reuse: false,
      codeSystem: SOURCES.fonasa.codeSystem,
      code: row.code,
      display: row.display,
      source: sourceBlock(SOURCES.fonasa, { group: g.group, retrievedAt, transport: transports.fonasa }),
      reviewStatus: 'copy-verified',
      evidence,
    });
  }

  // --- CUPS --------------------------------------------------------------------
  const cupsRows = [...cupsAgreed.map((r) => ({ ...r, reviewStatus: 'two-copies-agree' })), ...cupsOnlyA.map((r) => ({ ...r, reviewStatus: 'single-copy' }))];
  for (const row of cupsRows) {
    const evidence = [];
    applyPerformer(compiled, 'cups', row, evidence, gaps, unmatched);
    if (evidence.length === 0) continue;
    records.push({
      id: serviceConceptId(SOURCES.cups.codeSystem, row.code),
      reuse: false,
      codeSystem: SOURCES.cups.codeSystem,
      code: row.code,
      display: row.display,
      source: sourceBlock(SOURCES.cups, { retrievedAt, transport: transports.cups }),
      reviewStatus: row.reviewStatus,
      evidence,
    });
  }

  // --- Arancel médico SCZ (conceptos ya sembrados por la API) --------------------
  for (const row of bo.honorariosMedicos) {
    const rule = headingRule(compiled, row.especialidad);
    if (rule === undefined) {
      unmatched.add({ s: 'boArancel', h: row.especialidad }, { source: 'boArancel', phrase: row.especialidad }, row.code);
      continue;
    }
    if (rule.specialty === null) {
      gaps.add({ s: 'boArancel', h: row.especialidad }, { source: 'boArancel', basis: 'source-section', section: row.especialidad, note: rule.note ?? null }, `${row.code} ${clean(row.concepto)}`);
      continue;
    }
    records.push({
      id: boConceptId(row.code),
      reuse: true,
      codeSystem: SOURCES.boArancel.codeSystem,
      code: boConceptCode(row.code),
      display: clean(row.concepto),
      source: sourceBlock(SOURCES.boArancel, { sourceFile: row.source_file, sourceRow: row.source_row }),
      reviewStatus: row.ocrSospechoso ? 'ocr-suspect' : 'in-repo',
      evidence: [{ specialty: rule.specialty, basis: 'source-section', section: row.especialidad, match: rule.match, ...(rule.note ? { note: rule.note } : {}) }],
    });
  }

  // --- Arancel odontológico 2026 ------------------------------------------------
  for (const row of bo.arancelOdontologico) {
    const evidence = [{ specialty: compiled.dentalAll, basis: 'source-section', section: 'Listado arancel odontológico 2026', match: 'exact' }];
    const rule = dentalRule(compiled, row.seccion);
    if (rule === undefined) unmatched.add({ s: 'boDental', h: row.seccion }, { source: 'boDental', phrase: row.seccion }, row.code);
    else if (rule.specialty) pushEvidence(evidence, { specialty: rule.specialty, basis: 'source-section', section: row.seccion, match: rule.match });
    records.push({
      id: boConceptId(row.code),
      reuse: true,
      codeSystem: SOURCES.boDental.codeSystem,
      code: boConceptCode(row.code),
      display: clean(row.concepto),
      source: sourceBlock(SOURCES.boDental, { sourceFile: row.source_file, sourceRow: row.source_row }),
      reviewStatus: row.ocrSospechoso ? 'ocr-suspect' : 'in-repo',
      evidence,
    });
  }

  return { records, gaps: gaps.list(), unmatched: unmatched.list(), excluded: excluded.list() };
}

/**
 * Cobertura: por especialidad, servicios por fuente y nombres distintos (la
 * forma normalizada del texto, que es lo único que se puede deduplicar entre
 * nomencladores sin inventar un mapeo).
 */
export function coverage(records, modelSpecialties) {
  const bySpecialty = new Map(modelSpecialties.map((s) => [s.code, { code: s.code, display: s.display, total: 0, bySource: {}, distinctNames: new Set() }]));
  for (const r of records) {
    for (const code of new Set(r.evidence.map((e) => e.specialty))) {
      const row = bySpecialty.get(code);
      if (!row) throw new Error(`Especialidad ${code} no está en el value set del modelo`);
      row.total += 1;
      row.bySource[r.codeSystem] = (row.bySource[r.codeSystem] ?? 0) + 1;
      row.distinctNames.add(cupsComparable(r.display));
    }
  }
  return [...bySpecialty.values()].map((r) => ({ ...r, distinctNames: r.distinctNames.size }));
}
