// =============================================================================
// Forma común de las filas que produce cada fuente.
//
//   procedure  un procedimiento referenciado (concepto); `owned` dice si esta
//              importación lo crea o si lo carga otra sesión (ICHI/PCS/CUPS:
//              `justin/seed-specialty-services`).
//   assertion  una afirmación publicada: procedimiento → enfermedad o sitio,
//              con el tipo literal y la procedencia del registro de origen.
//              Varias afirmaciones (p. ej. dos PMID) comparten `relationshipId`
//              cuando unen el mismo par con el mismo tipo.
//   map        una equivalencia PUBLICADA entre códigos (xref de MONDO o de
//              Uberon). Solo sirve para resolver contra las claves de las
//              sesiones hermanas; nunca se fabrica.
// =============================================================================

import { conceptKey, md5uuid } from './common.mjs';
import { relationType } from './relation-types.mjs';

/** Procedencia mínima exigida: fuente, id de origen, versión, URI y fecha. */
export function provenance(meta, sourceRecordId, uri, extra = {}) {
  for (const k of ['source', 'version', 'retrievedAt', 'license']) {
    if (!meta[k])
      throw new Error(
        `Procedencia incompleta: falta ${k} en ${meta.source ?? '(sin fuente)'}`,
      );
  }
  if (!sourceRecordId || !uri)
    throw new Error(
      `Procedencia incompleta en ${meta.source}: id de origen y URI son obligatorios`,
    );
  return {
    source: meta.source,
    sourceRecordId,
    version: meta.version,
    uri,
    retrievedAt: meta.retrievedAt,
    license: meta.license,
    file: meta.fileUrl ?? null,
    sha256: meta.sha256 ?? null,
    ...extra,
  };
}

export function procedureRecord({
  system,
  code,
  display,
  category,
  owned,
  meta,
  uri,
  extra = {},
}) {
  return {
    id: md5uuid(`mantra:procedures-treatments:procedure:${system}:${code}`),
    system,
    code,
    display,
    category,
    owned,
    provenance: provenance(meta, code, uri),
    ...extra,
  };
}

export function assertionRecord({
  typeCode,
  subject,
  object,
  sourceRecordId,
  uri,
  evidence = null,
  meta,
}) {
  const type = relationType(typeCode);
  const sKey = conceptKey(subject);
  const oKey = conceptKey(object);
  return {
    id: md5uuid(
      `mantra:procedures-treatments:assertion:${meta.source}:${sourceRecordId}:${typeCode}:${sKey}:${oKey}`,
    ),
    relationshipId: md5uuid(
      `mantra:procedures-treatments:relationship:${typeCode}:${sKey}:${oKey}`,
    ),
    kind: type.kind,
    relationType: {
      code: type.code,
      sourcePredicate: type.sourcePredicate,
      assertion: type.assertion,
      label: type.label,
    },
    subject,
    object,
    evidence,
    provenance: provenance(meta, sourceRecordId, uri),
  };
}

export function mapRecord({ from, to, mapType, sourceRecordId, uri, meta }) {
  return {
    id: md5uuid(
      `mantra:procedures-treatments:map:${meta.source}:${mapType}:${conceptKey(from)}:${conceptKey(to)}`,
    ),
    from,
    to,
    mapType,
    provenance: provenance(meta, sourceRecordId, uri),
  };
}

/** Quita duplicados exactos por `id` (dos líneas idénticas de la fuente producen la misma afirmación). */
export function uniqueById(rows) {
  const seen = new Map();
  for (const r of rows) if (!seen.has(r.id)) seen.set(r.id, r);
  return [...seen.values()];
}

/**
 * Sitio expresado en Uberon cuando la fuente lo publica en NCIt: SOLO si Uberon
 * declara un xref a ese código NCIt y es uno a uno (un único término Uberon).
 * Si hay varios, no se elige ninguno (`objectAlternatesAmbiguous`). La
 * afirmación conserva su objeto original; la alternativa lleva el registro del
 * mapeo publicado que la respalda.
 */
export function withPublishedSiteAlternates(assertions, maps) {
  const byNcit = new Map();
  for (const m of maps) {
    if (m.from.system !== 'uberon' || m.to.system !== 'ncit') continue;
    (byNcit.get(m.to.code) ?? byNcit.set(m.to.code, []).get(m.to.code)).push(m);
  }
  return assertions.map((a) => {
    if (a.kind !== 'procedure-site' || a.object.system !== 'ncit') return a;
    const found = byNcit.get(a.object.code) ?? [];
    if (found.length === 1) {
      const m = found[0];
      return {
        ...a,
        objectAlternates: [
          {
            system: 'uberon',
            code: m.from.code,
            via: {
              mapId: m.id,
              source: m.provenance.source,
              sourceRecordId: m.provenance.sourceRecordId,
              version: m.provenance.version,
              uri: m.provenance.uri,
            },
          },
        ],
      };
    }
    return found.length > 1
      ? { ...a, objectAlternatesAmbiguous: found.length }
      : a;
  });
}
