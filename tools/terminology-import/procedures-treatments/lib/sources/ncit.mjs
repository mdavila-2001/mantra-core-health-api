// =============================================================================
// NCIt (OBO Edition): roles de procedimiento declarados por la terminología.
//
// Solo cuentan los sujetos que cuelgan de C25218 «Intervention or Procedure» y
// los roles registrados en `NCIT_PROCEDURE_ROLES` (R163, R165–R171 hacia
// anatomía; R180 hacia enfermedad, hoy sin filas en la edición OBO). Los
// regímenes de quimioterapia (R172) son fármacos: no entran.
// =============================================================================

import { fromCurie } from '../common.mjs';
import {
  headerVersion,
  oboName,
  relationships,
  splitQualifiers,
} from '../obo.mjs';
import { assertionRecord, procedureRecord, uniqueById } from '../records.mjs';
import { NCIT_PROCEDURE_ROLES } from '../relation-types.mjs';

export const NCIT_PROCEDURE_ROOT = 'NCIT:C25218';
export const ncitUri = (code) =>
  `https://ncit.nci.nih.gov/ncitbrowser/ConceptReport.jsp?dictionary=NCI_Thesaurus&code=${code}`;

/** Una pasada por las stanzas: padres, nombres, obsoletos y roles de procedimiento. */
export async function readNcit(stanzas) {
  const parents = new Map();
  const names = new Map();
  const obsolete = new Set();
  const roles = [];
  let version = null;
  for await (const st of stanzas) {
    if (st.type === 'header') version = headerVersion(st);
    if (st.type !== 'Term' || !st.id?.startsWith('NCIT:')) continue;
    names.set(st.id, oboName(st));
    parents.set(
      st.id,
      (st.tags.is_a ?? []).map((v) => splitQualifiers(v).value),
    );
    if (st.tags.is_obsolete?.[0] === 'true') obsolete.add(st.id);
    for (const r of [
      ...relationships(st, 'relationship'),
      ...relationships(st, 'intersection_of'),
    ]) {
      const role = r.rel?.replace(/^NCIT:/, '');
      if (NCIT_PROCEDURE_ROLES.includes(role) && r.target?.startsWith('NCIT:'))
        roles.push({ subject: st.id, role, target: r.target });
    }
  }
  return { parents, names, obsolete, roles, version };
}

export function isUnder(id, root, parents, seen = new Set()) {
  for (const p of parents.get(id) ?? []) {
    if (p === root) return true;
    if (!seen.has(p)) {
      seen.add(p);
      if (isUnder(p, root, parents, seen)) return true;
    }
  }
  return false;
}

export function ncitProcedureAssertions(ncit, meta) {
  const assertions = [];
  const procedures = new Map();
  const skipped = { notProcedure: 0, obsolete: 0 };
  for (const { subject, role, target } of ncit.roles) {
    if (ncit.obsolete.has(subject) || ncit.obsolete.has(target)) {
      skipped.obsolete++;
      continue;
    }
    if (!isUnder(subject, NCIT_PROCEDURE_ROOT, ncit.parents)) {
      skipped.notProcedure++;
      continue;
    }
    const s = fromCurie(subject);
    const o = fromCurie(target);
    procedures.set(
      s.code,
      procedureRecord({
        system: 'ncit',
        code: s.code,
        display: ncit.names.get(subject),
        category: 'ncit-procedure',
        owned: true,
        meta,
        uri: ncitUri(s.code),
      }),
    );
    assertions.push(
      assertionRecord({
        typeCode: `ncit:${role}`,
        subject: { ...s, label: ncit.names.get(subject) },
        object: { ...o, label: ncit.names.get(target) },
        sourceRecordId: `${s.code} ${role} ${o.code}`,
        uri: ncitUri(s.code),
        meta,
      }),
    );
  }
  return {
    assertions: uniqueById(assertions),
    procedures: [...procedures.values()],
    skipped,
  };
}
