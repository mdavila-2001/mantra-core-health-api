// =============================================================================
// RxNav (NLM) → puente por códigos ATC 5 → RxCUI → UNII. Funciones puras sobre
// las respuestas JSON de la API REST pública (sin cuenta):
//   rxcui.json?idtype=ATC&id=<ATC5>            → RxCUI del ingrediente
//   rxcui/<id>/properties.json                 → TTY (IN, MIN, PIN…)
//   rxcui/<id>/related.json?tty=IN             → ingredientes de un MIN
//   rxcui/<id>/property.json?propName=UNII_CODE → UNII
//
//   rxcui/<id>/related.json?tty=PIN            → sales/formas precisas de un IN
//
// ESTADO (2026-10-27): validado contra respuestas REALES de rxnav.nlm.nih.gov
// (fixtures en test/fixtures/rxnav/). Los parsers son defensivos: ante una forma
// desconocida devuelven vacío, nunca un código adivinado.
//
// Hallazgo de la validación: `openfda.unii` de una etiqueta lista el UNII de la
// SAL (p. ej. clorhidrato de oxicodona C1ENJ2TE6C), mientras que el RxCUI del
// ingrediente (IN) trae el UNII de la base (oxicodona CD35PMG570). Por eso el
// puente guarda también los PIN (precise ingredient) del propio RxNorm de cada IN
// y sus UNII: la equivalencia sal↔base es la que RxNorm publica, no una
// coincidencia de nombres.
// =============================================================================

export const RXNAV_REST = 'https://rxnav.nlm.nih.gov/REST';
export const RXNAV_SOURCE = 'nlm-rxnav';
export const RXNAV_LICENSE =
  'RxNorm/RxNav (U.S. National Library of Medicine): API pública sin cuenta; https://lhncbc.nlm.nih.gov/RxNav/TermsofService.html. ' +
  'Sólo se usan identificadores (RxCUI, TTY, ATC, UNII); los UNII son del FDA Global Substance Registration System (dominio público).';

export const rxcuiByAtcUrl = (atc) => `${RXNAV_REST}/rxcui.json?idtype=ATC&id=${encodeURIComponent(atc)}`;
export const propertiesUrl = (rxcui) => `${RXNAV_REST}/rxcui/${encodeURIComponent(rxcui)}/properties.json`;
export const relatedInUrl = (rxcui) => `${RXNAV_REST}/rxcui/${encodeURIComponent(rxcui)}/related.json?tty=IN`;
export const relatedPinUrl = (rxcui) => `${RXNAV_REST}/rxcui/${encodeURIComponent(rxcui)}/related.json?tty=PIN`;
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

/** `related.json?tty=X` → conceptos de ese TTY `[{ rxcui, name, tty }]`, por RxCUI ascendente. */
export function parseRelatedTty(resp, tty) {
  const groups = resp?.relatedGroup?.conceptGroup;
  if (!Array.isArray(groups)) return [];
  const byId = new Map();
  for (const g of groups) {
    if (g?.tty !== tty) continue;
    for (const c of g.conceptProperties ?? []) if (isRxcui(c?.rxcui) && !byId.has(c.rxcui)) byId.set(c.rxcui, { rxcui: c.rxcui, name: c.name ?? null, tty: c.tty ?? tty });
  }
  return [...byId.values()].sort((a, b) => Number(a.rxcui) - Number(b.rxcui));
}

export const parseRelatedIn = (resp) => parseRelatedTty(resp, 'IN').map((c) => c.rxcui);
export const parseRelatedPin = (resp) => parseRelatedTty(resp, 'PIN');

export function parseUnii(resp) {
  const props = resp?.propConceptGroup?.propConcept;
  if (!Array.isArray(props)) return [];
  return [...new Set(props.filter((p) => p?.propName === 'UNII_CODE').map((p) => p.propValue).filter((v) => typeof v === 'string' && UNII.test(v)))].sort();
}

/** Todos los UNII con los que una etiqueta puede nombrar a un ingrediente: el propio y los de sus PIN (sales). */
export const ingredientUnii = (ing) => [...new Set([...ing.unii, ...ing.pins.flatMap((p) => p.unii)])].sort();

/**
 * Puente de un ATC 5:
 * `{ atc, rxcuis: [{ rxcui, tty, name }], ingredients: [{ rxcui, tty, name, unii, pins: [{ rxcui, name, unii }] }], unii, complete }`.
 * Ingrediente = el IN/PIN al que RxNorm mapea el ATC o, si el ATC es una combinación (MIN), cada IN de ésta.
 * Los PIN se listan sólo para los IN (RxNorm: «precise ingredient» = sal/forma del ingrediente).
 * `complete` = todo ingrediente tiene al menos un UNII (propio o de un PIN); si no, el ATC no se empareja
 * con etiquetas (un conjunto parcial emparejaría etiquetas de otra combinación).
 * @param {object} r respuestas crudas por RxCUI: { byAtc, properties: {rxcui→resp}, relatedIn, relatedPin, unii }
 */
export function atcBridge(atc, r) {
  const rxcuis = parseRxcuiByAtc(r.byAtc).map((id) => parseProperties(r.properties?.[id]) ?? { rxcui: id, name: null, tty: null });
  const ids = new Set();
  for (const c of rxcuis) {
    if (c.tty === 'IN' || c.tty === 'PIN') ids.add(c.rxcui);
    else if (c.tty === 'MIN') for (const i of parseRelatedIn(r.relatedIn?.[c.rxcui])) ids.add(i);
  }
  const ingredients = [...ids]
    .sort((a, b) => Number(a) - Number(b))
    .map((id) => {
      const p = parseProperties(r.properties?.[id]);
      const tty = p?.tty ?? null;
      const pins = tty === 'IN' ? parseRelatedPin(r.relatedPin?.[id]).map((x) => ({ rxcui: x.rxcui, name: x.name, unii: parseUnii(r.unii?.[x.rxcui]) })) : [];
      return { rxcui: id, tty, name: p?.name ?? null, unii: parseUnii(r.unii?.[id]), pins };
    });
  const complete = ingredients.length > 0 && ingredients.every((i) => ingredientUnii(i).length > 0);
  return { atc, rxcuis, ingredients, unii: [...new Set(ingredients.flatMap((i) => i.unii))].sort(), complete };
}
