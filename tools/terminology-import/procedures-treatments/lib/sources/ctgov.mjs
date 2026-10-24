// =============================================================================
// ClinicalTrials.gov (API v2) → intervención no farmacológica ↔ condición,
// SIEMPRE «en estudio».
//
// ClinicalTrials.gov publica el MeSH que NLM deriva para cada estudio
// (`derivedSection.interventionBrowseModule.meshes` y
// `conditionBrowseModule.meshes`), a nivel de ESTUDIO, no de intervención. Por
// eso la relación dice exactamente eso: la intervención MeSH y la condición MeSH
// están registradas en el mismo ensayo intervencional. No dice que la
// intervención sirva para la condición ni que esté indicada.
//
// - Solo descriptores MeSH (D…): los conceptos suplementarios (C…) son
//   sustancias y quedan afuera.
// - Intervención: `isNonPharmacologicalIntervention` (árbol de MeSH).
// - Condición: `isCondition` (árbol C o F03).
// - Una afirmación por par (intervención, condición) con TODOS los NCT que la
//   respaldan en la evidencia, ordenados y sin truncar.
// =============================================================================

import { readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { gunzipSync } from 'node:zlib';
import { assertionRecord, procedureRecord } from '../records.mjs';
import {
  isCondition,
  isNonPharmacologicalIntervention,
  meshInterventionCategory,
} from './mesh.mjs';

export const meshUri = (ui) => `https://id.nlm.nih.gov/mesh/${ui}`;
export const trialUri = (nct) => `https://clinicaltrials.gov/study/${nct}`;

/** Estudios de las páginas en caché, en orden de página. */
export function* ctgovStudies(dir) {
  for (const f of readdirSync(dir)
    .filter((x) => x.endsWith('.json.gz'))
    .sort()) {
    const { body } = JSON.parse(
      gunzipSync(readFileSync(join(dir, f))).toString('utf8'),
    );
    yield* body.studies;
  }
}

/**
 * @param {Iterable<object>} studies
 * @param {Map<string, {ui:string,name:string,trees:string[]}>} mesh
 * @param {object} meta      procedencia de ClinicalTrials.gov
 * @param {object} meshMeta  procedencia de MeSH (para los conceptos de procedimiento)
 */
export function ctgovCorpus(studies, mesh, meta, meshMeta) {
  const pairs = new Map(); // "Dint|Dcond" → Set<NCT>
  const stats = {
    studies: 0,
    interventional: 0,
    withProcedureMesh: 0,
    withConditionMesh: 0,
    withPair: 0,
  };
  for (const s of studies) {
    stats.studies++;
    const p = s.protocolSection ?? {};
    if (p.designModule?.studyType !== 'INTERVENTIONAL') continue;
    stats.interventional++;
    const nct = p.identificationModule?.nctId;
    const ints = (s.derivedSection?.interventionBrowseModule?.meshes ?? [])
      .map((m) => m.id)
      .filter((id) => isNonPharmacologicalIntervention(mesh.get(id)));
    const conds = (s.derivedSection?.conditionBrowseModule?.meshes ?? [])
      .map((m) => m.id)
      .filter((id) => isCondition(mesh.get(id)));
    if (ints.length) stats.withProcedureMesh++;
    if (conds.length) stats.withConditionMesh++;
    if (!nct || !ints.length || !conds.length) continue;
    stats.withPair++;
    for (const i of new Set(ints)) {
      for (const c of new Set(conds)) {
        const key = `${i}|${c}`;
        (pairs.get(key) ?? pairs.set(key, new Set()).get(key)).add(nct);
      }
    }
  }

  const assertions = [];
  const procedureCodes = new Set();
  for (const [key, ncts] of pairs) {
    const [i, c] = key.split('|');
    const trials = [...ncts].sort();
    procedureCodes.add(i);
    assertions.push(
      assertionRecord({
        typeCode: 'ctgov:investigational',
        subject: { system: 'mesh', code: i, label: mesh.get(i).name },
        object: { system: 'mesh', code: c, label: mesh.get(c).name },
        sourceRecordId: `${i}|${c}`,
        uri: trialUri(trials[0]),
        evidence: {
          trialCount: trials.length,
          trials,
          trialUriTemplate: 'https://clinicaltrials.gov/study/{nct}',
        },
        meta,
      }),
    );
  }
  const procedures = [...procedureCodes].sort().map((ui) =>
    procedureRecord({
      system: 'mesh',
      code: ui,
      display: mesh.get(ui).name,
      category: meshInterventionCategory(mesh.get(ui)),
      owned: true,
      meta: meshMeta,
      uri: meshUri(ui),
      extra: { meshTrees: mesh.get(ui).trees },
    }),
  );
  return { assertions, procedures, stats: { ...stats, pairs: pairs.size } };
}
