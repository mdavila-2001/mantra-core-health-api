// =============================================================================
// RxNav (NLM) → puente por códigos ATC 5 → RxCUI → UNII. Funciones puras sobre
// las respuestas JSON de la API REST pública (sin cuenta):
//   rxcui.json?idtype=ATC&id=<ATC5>            → RxCUI del ingrediente
//   rxcui/<id>/properties.json                 → TTY (IN, MIN, PIN…)
//   rxcui/<id>/related.json?tty=IN             → ingredientes de un MIN
//   rxcui/<id>/property.json?propName=UNII_CODE → UNII
//
// ESTADO: no validado contra respuestas reales (rxnav.nlm.nih.gov bloqueado en
// la sesión que lo escribió). Los parsers son defensivos: ante una forma
// desconocida devuelven vacío, nunca un código adivinado.
// =============================================================================

export const RXNAV_REST = 'https://rxnav.nlm.nih.gov/REST';
export const RXNAV_SOURCE = 'nlm-rxnav';
export const RXNAV_LICENSE =
  'RxNorm/RxNav (U.S. National Library of Medicine): API pública sin cuenta; https://lhncbc.nlm.nih.gov/RxNav/TermsofService.html. ' +
  'Sólo se usan identificadores (RxCUI, TTY, ATC, UNII); los UNII son del FDA Global Substance Registration System (dominio público).';

export const rxcuiByAtcUrl = (atc) => `${RXNAV_REST}/rxcui.json?idtype=ATC&id=${encodeURIComponent(atc)}`;
export const propertiesUrl = (rxcui) => `${RXNAV_REST}/rxcui/${encodeURIComponent(rxcui)}/properties.json`;
export const relatedInUrl = (rxcui) => `${RXNAV_REST}/rxcui/${encodeURIComponent(rxcui)}/related.json?tty=IN`;
export const uniiUrl = (rxcui) => `${RXNAV_REST}/rxcui/${encodeURIComponent(rxcui)}/property.json?propName=UNII_CODE`;

const isRxcui = (v) => typeof v === 'string' && /^\d+$/.test(v);
const UNII = /^[A-Z0-9]{10}$/;

export function parseRxcuiByAtc(resp) {
  const ids = resp?.idGroup?.rxnormId;
  return Array.isArray(ids) ? [...new Set(ids.filter(isRxcui))].sort((a, b) => Number(a) - Number(b)) : [];
}

export function parseProperties(resp) {
  const p = resp?.properties;
  return p && isRxcui(p.rxcui) ? { rxcui: p.rxcui, name: p.name ?? null, tty: p.tty ?? null } : null;
}

export function parseRelatedIn(resp) {
  const groups = resp?.relatedGroup?.conceptGroup;
  if (!Array.isArray(groups)) return [];
  return [...new Set(groups.filter((g) => g?.tty === 'IN').flatMap((g) => (g.conceptProperties ?? []).map((c) => c.rxcui)).filter(isRxcui))].sort(
    (a, b) => Number(a) - Number(b),
  );
}

export function parseUnii(resp) {
  const props = resp?.propConceptGroup?.propConcept;
  if (!Array.isArray(props)) return [];
  return [...new Set(props.filter((p) => p?.propName === 'UNII_CODE').map((p) => p.propValue).filter((v) => typeof v === 'string' && UNII.test(v)))].sort();
}

/**
 * Puente de un ATC 5: `{ atc, rxcuis: [{ rxcui, tty, name }], ingredients: [rxcui], unii: [..] }`.
 * Sólo se considera resuelto si TODOS los ingredientes tienen UNII; si no, `unii` queda vacío
 * (un conjunto parcial emparejaría etiquetas de otra combinación).
 * @param {object} r respuestas crudas: { byAtc, properties: {rxcui→resp}, relatedIn: {rxcui→resp}, unii: {rxcui→resp} }
 */
export function atcBridge(atc, r) {
  const rxcuis = parseRxcuiByAtc(r.byAtc).map((id) => parseProperties(r.properties?.[id]) ?? { rxcui: id, name: null, tty: null });
  const ingredients = new Set();
  for (const c of rxcuis) {
    if (c.tty === 'IN' || c.tty === 'PIN') ingredients.add(c.rxcui);
    else if (c.tty === 'MIN') for (const i of parseRelatedIn(r.relatedIn?.[c.rxcui])) ingredients.add(i);
  }
  const ing = [...ingredients].sort((a, b) => Number(a) - Number(b));
  const perIngredient = ing.map((i) => parseUnii(r.unii?.[i]));
  const complete = ing.length > 0 && perIngredient.every((u) => u.length > 0);
  return { atc, rxcuis, ingredients: ing, unii: complete ? [...new Set(perIngredient.flat())].sort() : [], complete };
}
