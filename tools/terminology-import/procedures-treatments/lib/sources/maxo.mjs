// =============================================================================
// MAxO (Medical Action Ontology) y sus anotaciones curadas POET.
//
//  - Procedimientos: los términos MAXO vigentes que no cuelgan de una raíz
//    farmacológica (`MAXO_PHARMACOLOGICAL_ROOTS`; los fármacos son de la
//    sesión `justin/seed-drug-treatments`).
//  - Procedimiento → sitio: SOLO el axioma `RO:0002233 has input` hacia un
//    término UBERON, en `relationship:` o `intersection_of:`. No se infiere un
//    sitio por el nombre («gastrectomía» no se une a «estómago» si MAxO no lo
//    declara).
//  - Procedimiento → enfermedad: cada fila de `data/poet/annotations.tsv`
//    (curación manual con PMID u otra fuente). `relation` se conserva literal:
//    TREATS, PREVENTS, CONTRAINDICATED, NO_OBSERVED_BENEFIT.
//    Las anotaciones `automaxo` (extracción automática) NO se usan: la regla
//    prohíbe relaciones generadas por un modelo.
// =============================================================================

import { fromCurie } from '../common.mjs';
import { oboName, relationships, splitQualifiers } from '../obo.mjs';
import {
  assertionRecord,
  mapRecord,
  procedureRecord,
  uniqueById,
} from '../records.mjs';
import {
  MAXO_DIAGNOSTIC_ROOT,
  MAXO_PHARMACOLOGICAL_ROOTS,
} from '../sources.mjs';

export const maxoPurl = (curie) =>
  `http://purl.obolibrary.org/obo/${curie.replace(':', '_')}`;

/** Stanzas OBO → `Map<MAXO:id, término>` (solo términos MAXO). */
export async function readMaxoTerms(stanzas) {
  const terms = new Map();
  let header = null;
  for await (const st of stanzas) {
    if (st.type === 'header') header = st;
    if (st.type !== 'Term' || !st.id?.startsWith('MAXO:')) continue;
    const rels = [
      ...relationships(st, 'relationship'),
      ...relationships(st, 'intersection_of'),
    ];
    terms.set(st.id, {
      id: st.id,
      label: oboName(st),
      obsolete: st.tags.is_obsolete?.[0] === 'true',
      parents: (st.tags.is_a ?? [])
        .map((v) => splitQualifiers(v).value)
        .filter((p) => p.startsWith('MAXO:')),
      hasInput: [
        ...new Set(
          rels
            .filter(
              (r) => r.rel === 'RO:0002233' && r.target?.startsWith('UBERON:'),
            )
            .map((r) => r.target),
        ),
      ].sort(),
      xrefs: (st.tags.xref ?? []).map((v) => splitQualifiers(v).value),
    });
  }
  return { terms, header };
}

export function ancestors(id, terms, seen = new Set()) {
  for (const p of terms.get(id)?.parents ?? []) {
    if (!seen.has(p)) {
      seen.add(p);
      ancestors(p, terms, seen);
    }
  }
  return seen;
}

/** Categoría por ascendencia en la propia MAxO. */
export function maxoCategory(id, terms) {
  const line = new Set([id, ...ancestors(id, terms)]);
  if (Object.keys(MAXO_PHARMACOLOGICAL_ROOTS).some((r) => line.has(r)))
    return 'pharmacological';
  if (line.has(MAXO_DIAGNOSTIC_ROOT)) return 'diagnostic';
  if (line.has('MAXO:0001014')) return 'avoidance';
  if (line.has('MAXO:0000004')) return 'surgical';
  return 'therapeutic-or-other';
}

export function maxoProcedures(terms, meta) {
  const out = [];
  for (const t of terms.values()) {
    if (t.obsolete) continue;
    const category = maxoCategory(t.id, terms);
    if (category === 'pharmacological') continue;
    out.push(
      procedureRecord({
        system: 'maxo',
        code: t.id,
        display: t.label,
        category,
        owned: true,
        meta,
        uri: maxoPurl(t.id),
      }),
    );
  }
  return out;
}

export function maxoSiteAssertions(terms, meta) {
  const out = [];
  for (const t of terms.values()) {
    if (t.obsolete || maxoCategory(t.id, terms) === 'pharmacological') continue;
    for (const target of t.hasInput) {
      out.push(
        assertionRecord({
          typeCode: 'maxo:RO:0002233',
          subject: { system: 'maxo', code: t.id, label: t.label },
          object: fromCurie(target),
          sourceRecordId: `${t.id} RO:0002233 ${target}`,
          uri: maxoPurl(t.id),
          meta,
        }),
      );
    }
  }
  return uniqueById(out);
}

/** Xrefs que MAxO publica hacia NCIt y MeSH: sirven para unir con procedimientos de esas terminologías. */
export function maxoProcedureMaps(terms, meta) {
  const out = [];
  for (const t of terms.values()) {
    if (t.obsolete || maxoCategory(t.id, terms) === 'pharmacological') continue;
    for (const x of t.xrefs) {
      const to = fromCurie(x);
      if (!to || !['ncit', 'mesh'].includes(to.system)) continue;
      out.push(
        mapRecord({
          from: { system: 'maxo', code: t.id },
          to,
          mapType: 'oboInOwl:hasDbXref',
          sourceRecordId: `${t.id} xref ${x}`,
          uri: maxoPurl(t.id),
          meta,
        }),
      );
    }
  }
  return uniqueById(out);
}

/**
 * Filas POET → afirmaciones procedimiento → enfermedad.
 * @returns {{ assertions: object[], skipped: Record<string, number> }}
 */
export function poetAssertions(rows, terms, meta) {
  const assertions = [];
  const skipped = {
    pharmacological: 0,
    unknownMaxo: 0,
    obsoleteMaxo: 0,
    unknownRelation: 0,
    unknownDisease: 0,
  };
  for (const row of rows) {
    const term = terms.get(row.maxo_id);
    if (!term) {
      skipped.unknownMaxo++;
      continue;
    }
    if (term.obsolete) {
      skipped.obsoleteMaxo++;
      continue;
    }
    if (maxoCategory(term.id, terms) === 'pharmacological') {
      skipped.pharmacological++;
      continue;
    }
    const typeCode = `maxo-poet:${row.relation}`;
    if (
      ![
        'TREATS',
        'PREVENTS',
        'CONTRAINDICATED',
        'NO_OBSERVED_BENEFIT',
      ].includes(row.relation)
    ) {
      skipped.unknownRelation++;
      continue;
    }
    const disease = fromCurie(row.disease_id);
    if (!disease) {
      skipped.unknownDisease++;
      continue;
    }
    assertions.push(
      assertionRecord({
        typeCode,
        subject: { system: 'maxo', code: term.id, label: term.label },
        object: { ...disease, label: row.disease_name },
        sourceRecordId: [
          row.disease_id,
          row.source_id,
          row.maxo_id,
          row.hpo_id,
          row.relation,
        ].join('|'),
        uri: `${meta.fileUrl}#L${row.__line}`,
        evidence: {
          code: row.evidence || null,
          references: row.source_id ? [row.source_id] : [],
          // La columna se llama hpo_id pero a veces trae un MONDO: se conserva el CURIE tal cual.
          phenotype: row.hpo_id
            ? (fromCurie(row.hpo_id) ?? { raw: row.hpo_id })
            : null,
          extension: row.extension_id
            ? { code: row.extension_id, label: row.extension_name }
            : null,
          curator: row.author || null,
          created: row.created || null,
          lastUpdated: row.last_updated || null,
        },
        meta,
      }),
    );
  }
  return { assertions: uniqueById(assertions), skipped };
}
