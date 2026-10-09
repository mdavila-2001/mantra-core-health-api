// =============================================================================
// Puente CIE-10 ↔ Wikidata (CC0): qué ítem (Q-id) ES este término.
//
// El ítem debe declarar el MISMO código (P4229 CIE-10-CM o P494 CIE-10 OMS). Es
// conocimiento colaborativo (T3): sirve para imágenes y `facts`, nunca para
// texto. Igual que con Orphanet/MONDO, solo se usa si es inequívoco:
//   · un solo Q-id declara ese código, y
//   · ese Q-id no declara además otro término del glosario (sería un grupo), y
//   · si Orphanet/MONDO ya identificó la enfermedad, Wikidata no la contradice.
// =============================================================================

import { REJECT_REASONS, WIKIDATA_CODE_PROPERTIES } from './config.mjs';

const normalizeMondo = (v) => String(v).replace(/^MONDO[:_]/, '').replace(/^0+/, '');

/**
 * @param {{code:string}[]} terms
 * @param {{codes:{qid:string,code:string,prop:string}[], images:{qid:string,file:string}[], facts:Record<string,{qid:string,value:string}[]>}} bridge
 * @param {Map<string, {orpha:object|null, mondo:object|null}>} identities
 * @returns {Map<string, {qid:string|null, rejectReason:string|null, detail:string|null, files:string[], facts:Record<string,string[]>}>}
 */
export function resolveWikidata(terms, bridge, identities) {
  const termCodes = new Set(terms.map((t) => t.code));
  const qidsByCode = new Map();
  const codesByQid = new Map();
  for (const { qid, code, prop } of bridge.codes) {
    if (!WIKIDATA_CODE_PROPERTIES[prop] || !termCodes.has(code)) continue;
    if (!qidsByCode.has(code)) qidsByCode.set(code, new Set());
    qidsByCode.get(code).add(qid);
    if (!codesByQid.has(qid)) codesByQid.set(qid, new Set());
    codesByQid.get(qid).add(code);
  }
  const filesByQid = new Map();
  for (const { qid, file } of bridge.images) {
    if (!filesByQid.has(qid)) filesByQid.set(qid, new Set());
    filesByQid.get(qid).add(file);
  }
  const factsByQid = new Map();
  for (const [prop, rows] of Object.entries(bridge.facts)) {
    for (const { qid, value } of rows) {
      if (!factsByQid.has(qid)) factsByQid.set(qid, {});
      (factsByQid.get(qid)[prop] ??= new Set()).add(value);
    }
  }
  const out = new Map();
  for (const { code } of terms) {
    const none = { qid: null, rejectReason: null, detail: null, files: [], facts: {} };
    const identity = identities.get(code);
    const factsOf = (q) => Object.fromEntries(Object.entries(factsByQid.get(q) ?? {}).map(([p, vs]) => [p, [...vs].sort()]));
    const contradicts = (f) =>
      (identity?.orpha && f.P1550?.length && !f.P1550.includes(identity.orpha.orpha)) ||
      (identity?.mondo && f.P5270?.length && !f.P5270.some((v) => normalizeMondo(v) === normalizeMondo(identity.mondo.id)));
    const mondoExact = identity?.mondo?.exact;
    const orphaMesh = (identity?.orpha?.xrefs ?? []).filter((x) => x.exact && x.source === 'MeSH').map((x) => x.reference);
    const orphaOmim = (identity?.orpha?.xrefs ?? []).filter((x) => x.exact && x.source === 'OMIM').map((x) => x.reference);
    const sharesAny = (values, known) => (values ?? []).some((v) => known.includes(String(v).replace(/^DOID:/, '')));
    // Evidencia independiente de que el ítem es la enfermedad que Orphanet/MONDO ya identificaron.
    const confirms = (f) =>
      (identity?.orpha && f.P1550?.includes(identity.orpha.orpha)) ||
      (identity?.mondo && f.P5270?.some((v) => normalizeMondo(v) === normalizeMondo(identity.mondo.id))) ||
      sharesAny(f.P486, [...(mondoExact?.mesh ?? []), ...orphaMesh]) ||
      sharesAny(f.P699, mondoExact?.doid ?? []) ||
      sharesAny(f.P492, [...(mondoExact?.omim ?? []), ...orphaOmim]);
    let qids = [...(qidsByCode.get(code) ?? [])].sort();
    if (qids.length === 0) {
      out.set(code, none);
      continue;
    }
    // Varios ítems declaran el código: solo se desempata con evidencia independiente
    // (Orphanet/MONDO ya identificaron la enfermedad y el ítem la confirma).
    if (qids.length > 1) {
      const confirmed = qids.filter((q) => confirms(factsOf(q)));
      if (confirmed.length === 1) qids = confirmed;
    }
    if (qids.length > 1) {
      out.set(code, { ...none, rejectReason: REJECT_REASONS.CODE_MAPS_TO_MANY_QID, detail: qids.join(',') });
      continue;
    }
    const [qid] = qids;
    if (codesByQid.get(qid).size > 1) {
      out.set(code, { ...none, rejectReason: REJECT_REASONS.QID_MAPS_TO_MANY_TERMS, detail: `${qid}: ${[...codesByQid.get(qid)].sort().join(',')}` });
      continue;
    }
    const facts = factsOf(qid);
    if (contradicts(facts)) {
      out.set(code, { ...none, rejectReason: 'wikidata_contradice_a_orphanet_o_mondo', detail: `${qid}: ${JSON.stringify({ P1550: facts.P1550, P5270: facts.P5270 })}` });
      continue;
    }
    out.set(code, { qid, rejectReason: null, detail: null, files: [...(filesByQid.get(qid) ?? [])].sort(), facts });
  }
  return out;
}
