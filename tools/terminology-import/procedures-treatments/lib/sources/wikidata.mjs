// =============================================================================
// Wikidata P924 «possible treatment» (fuente COLABORATIVA, no oficial).
//
// Entra solo lo que cumple las tres condiciones, todas por identificadores
// publicados, nunca por nombre:
//  - la declaración tiene una referencia real: «stated in» (P248) o URL (P854).
//    «imported from Wikimedia project» (P143) no es una referencia y no alcanza;
//  - el tratamiento tiene MeSH (P486) y es no farmacológico por el árbol de MeSH;
//  - la enfermedad tiene MeSH de condición (árbol C/F03) o MONDO (P5270).
// Cada declaración es una afirmación con su id de declaración de Wikidata.
// =============================================================================

import { assertionRecord, procedureRecord } from '../records.mjs';
import {
  isCondition,
  isNonPharmacologicalIntervention,
  meshInterventionCategory,
} from './mesh.mjs';
import { meshUri } from './ctgov.mjs';

export const P924_SPARQL = `SELECT ?d ?s ?t ?tm ?dm ?dmondo
  (GROUP_CONCAT(DISTINCT ?refUrl; separator="|") AS ?urls)
  (GROUP_CONCAT(DISTINCT ?statedIn; separator="|") AS ?stated)
WHERE {
  ?d p:P924 ?s . ?s ps:P924 ?t . ?t wdt:P486 ?tm .
  OPTIONAL { ?d wdt:P486 ?dm }
  OPTIONAL { ?d wdt:P5270 ?dmondo }
  FILTER(BOUND(?dm) || BOUND(?dmondo))
  ?s prov:wasDerivedFrom ?ref .
  OPTIONAL { ?ref pr:P854 ?refUrl }
  OPTIONAL { ?ref pr:P248 ?statedIn }
}
GROUP BY ?d ?s ?t ?tm ?dm ?dmondo`;

const qid = (uri) => uri.replace('http://www.wikidata.org/entity/', '');
const split = (v) => (v ? v.split('|').filter(Boolean).sort() : []);
const mondoCode = (v) => `MONDO:${v.replace(/^MONDO[_:]/, '')}`;

/**
 * @param {object[]} bindings  `results.bindings` de la consulta P924_SPARQL
 */
export function wikidataP924Corpus(bindings, mesh, meta, meshMeta) {
  const assertions = [];
  const procedureCodes = new Set();
  const skipped = {
    withoutRealReference: 0,
    pharmacologicalOrNotProcedure: 0,
    diseaseNotCondition: 0,
  };
  for (const b of bindings) {
    const urls = split(b.urls?.value);
    const statedIn = split(b.stated?.value).map(qid);
    if (!urls.length && !statedIn.length) {
      skipped.withoutRealReference++;
      continue;
    }
    const tm = b.tm.value;
    if (!isNonPharmacologicalIntervention(mesh.get(tm))) {
      skipped.pharmacologicalOrNotProcedure++;
      continue;
    }
    const dm = b.dm?.value;
    let object = null;
    if (dm && isCondition(mesh.get(dm)))
      object = { system: 'mesh', code: dm, label: mesh.get(dm).name };
    else if (b.dmondo?.value)
      object = { system: 'mondo', code: mondoCode(b.dmondo.value) };
    if (!object) {
      skipped.diseaseNotCondition++;
      continue;
    }
    const statement = b.s.value.replace(
      'http://www.wikidata.org/entity/statement/',
      '',
    );
    procedureCodes.add(tm);
    assertions.push(
      assertionRecord({
        typeCode: 'wikidata:P924',
        subject: { system: 'mesh', code: tm, label: mesh.get(tm).name },
        object,
        sourceRecordId: statement,
        uri: `https://www.wikidata.org/wiki/${qid(b.d.value)}#P924`,
        evidence: {
          disease: qid(b.d.value),
          treatment: qid(b.t.value),
          referenceUrls: urls,
          statedIn,
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
  return { assertions, procedures, skipped };
}
