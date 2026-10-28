// =============================================================================
// ClinicalTrials.gov → procedimiento (MeSH, árbol E) × condición (MeSH), SOLO «en estudio».
//
// ClinicalTrials.gov deriva términos MeSH del texto de cada registro
// (`interventionBrowseModule.meshes` y `conditionBrowseModule.meshes`): ese es su mapeo
// publicado y es el único puente que se usa entre el texto libre de los ensayos y un código.
// No se compara ningún nombre de intervención con ningún catálogo.
//
// Qué afirma una fila: «un estudio registrado declara esa intervención y esa condición».
// NO dice que la intervención apunte a esa condición en particular (un estudio con varias
// condiciones produce un par por cada una), ni que funcione, ni que esté indicada. Por eso el
// tipo de relación es `investigational` y su etiqueta dice «en estudio». Cada par agrega todos
// sus estudios y conserva, tal como los publica la fuente, el estado general y la fase.
//
// Sólo entran intervenciones cuyo MeSH está en el árbol E (no farmacológico, ver mesh.mjs) y
// estudios con al menos una intervención de tipo PROCEDURE, RADIATION, BEHAVIORAL o
// DIAGNOSTIC_TEST (el filtro de la consulta). Un descriptor de intervención que no esté entre
// los procedimientos de MeSH E se descarta y se cuenta.
// =============================================================================

import { assertionRecord } from '../records.mjs';
import { MESH_SYSTEM } from './mesh.mjs';

export const CTGOV_TYPE = 'ctgov:studied-for';
const studyUrl = (nct) => `https://clinicaltrials.gov/study/${nct}`;
/** Consulta que reproduce la lista completa de estudios de un par (procedimiento, condición). */
export const pairQueryUrl = (procUi, condUi) =>
  `https://clinicaltrials.gov/api/v2/studies?filter.advanced=${encodeURIComponent(`AREA[InterventionMeshId]${procUi} AND AREA[ConditionMeshId]${condUi}`)}&fields=NCTId,OverallStatus,Phase`;

export function ctgovAssertions(studies, procedureUis, meta) {
  const pairs = new Map();
  const stats = { studiesRead: 0, studiesWithProcedureMesh: 0, interventionMeshesDropped: 0, pairs: 0, studyPairs: 0, byStatus: {}, byPhase: {} };
  for (const st of studies) {
    stats.studiesRead += 1;
    const procs = st.interventionMeshes.filter((m) => procedureUis.has(m.id));
    stats.interventionMeshesDropped += st.interventionMeshes.length - procs.length;
    if (!procs.length) continue;
    stats.studiesWithProcedureMesh += 1;
    for (const p of procs) {
      for (const c of st.conditionMeshes) {
        const key = `${p.id}|${c.id}`;
        let e = pairs.get(key);
        if (!e) pairs.set(key, (e = { proc: p, cond: c, studies: [] }));
        e.studies.push({ nct: st.nct, status: st.status, phases: st.phases, startDate: st.startDate });
        stats.studyPairs += 1;
      }
    }
  }
  const assertions = [];
  for (const { proc, cond, studies: list } of [...pairs.values()].sort((a, b) => (a.proc.id + a.cond.id < b.proc.id + b.cond.id ? -1 : 1))) {
    list.sort((a, b) => (a.nct < b.nct ? -1 : 1));
    const byStatus = {};
    const byPhase = {};
    for (const s of list) {
      byStatus[s.status ?? 'sin estado'] = (byStatus[s.status ?? 'sin estado'] ?? 0) + 1;
      for (const ph of s.phases.length ? s.phases : ['sin fase']) byPhase[ph] = (byPhase[ph] ?? 0) + 1;
      stats.byStatus[s.status ?? 'sin estado'] = (stats.byStatus[s.status ?? 'sin estado'] ?? 0) + 1;
      for (const ph of s.phases.length ? s.phases : ['sin fase']) stats.byPhase[ph] = (stats.byPhase[ph] ?? 0) + 1;
    }
    assertions.push(
      assertionRecord({
        typeCode: CTGOV_TYPE,
        subject: { system: MESH_SYSTEM, code: proc.id, label: proc.term },
        object: { system: 'mesh', code: cond.id, label: cond.term },
        sourceRecordId: `ctgov ${proc.id} ${cond.id}`,
        uri: pairQueryUrl(proc.id, cond.id),
        evidence: { studyCount: list.length, byStatus, byPhase, studies: list.map((s) => ({ nct: s.nct, status: s.status, phases: s.phases, startDate: s.startDate })) },
        meta,
      }),
    );
  }
  stats.pairs = assertions.length;
  return { assertions, stats };
}

export { studyUrl };
