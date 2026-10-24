// =============================================================================
// Ontologías OBO de procedimientos que no traen relaciones con enfermedades
// (p. ej. OHD, Oral Health and Disease Ontology). Genérico:
//
//  - Procedimientos: términos vigentes del prefijo propio que descienden de una
//    raíz declarada (para OHD, OHD:0000002 «dental procedure»).
//  - Procedimiento → sitio: SOLO `OBI:0000293 has specified input` o
//    `RO:0002233 has input` hacia UBERON, declarados en el propio término.
//    No se heredan de los padres ni se infieren por el nombre.
// =============================================================================

import { fromCurie } from '../common.mjs';
import {
  headerVersion,
  oboName,
  relationships,
  splitQualifiers,
} from '../obo.mjs';
import { assertionRecord, procedureRecord, uniqueById } from '../records.mjs';

const SITE_RELATIONS = new Set(['OBI:0000293', 'RO:0002233']);
const purl = (curie) =>
  `http://purl.obolibrary.org/obo/${curie.replace(':', '_')}`;

export async function readOboTerms(stanzas) {
  const terms = new Map();
  let version = null;
  for await (const st of stanzas) {
    if (st.type === 'header') version = headerVersion(st);
    if (st.type !== 'Term' || !st.id) continue;
    const rels = [
      ...relationships(st, 'relationship'),
      ...relationships(st, 'intersection_of'),
    ];
    terms.set(st.id, {
      id: st.id,
      label: oboName(st),
      obsolete: st.tags.is_obsolete?.[0] === 'true',
      parents: (st.tags.is_a ?? []).map((v) => splitQualifiers(v).value),
      sites: [
        ...new Set(
          rels
            .filter(
              (r) =>
                SITE_RELATIONS.has(r.rel) && r.target?.startsWith('UBERON:'),
            )
            .map((r) => `${r.rel} ${r.target}`),
        ),
      ].sort(),
    });
  }
  return { terms, version };
}

function descends(id, root, terms, seen = new Set()) {
  for (const p of terms.get(id)?.parents ?? []) {
    if (p === root) return true;
    if (!seen.has(p)) {
      seen.add(p);
      if (descends(p, root, terms, seen)) return true;
    }
  }
  return false;
}

/** Procedimientos (y sus sitios declarados) de una ontología OBO bajo `root`. */
export function oboProcedureCorpus({
  terms,
  prefix,
  root,
  system,
  category,
  typePrefix,
  meta,
}) {
  const procedures = [];
  const assertions = [];
  for (const t of terms.values()) {
    if (!t.id.startsWith(`${prefix}:`) || t.obsolete) continue;
    if (t.id !== root && !descends(t.id, root, terms)) continue;
    procedures.push(
      procedureRecord({
        system,
        code: t.id,
        display: t.label,
        category,
        owned: true,
        meta,
        uri: purl(t.id),
      }),
    );
    for (const s of t.sites) {
      const [rel, target] = s.split(' ');
      assertions.push(
        assertionRecord({
          typeCode: `${typePrefix}:${rel}`,
          subject: { system, code: t.id, label: t.label },
          object: fromCurie(target),
          sourceRecordId: `${t.id} ${rel} ${target}`,
          uri: purl(t.id),
          meta,
        }),
      );
    }
  }
  return { procedures, assertions: uniqueById(assertions) };
}
