// =============================================================================
// TAREA-41 F4 — qué AFIRMA una oración de la sección 4.5 de CIMA.
//
// El extractor arma un par fármaco-fármaco con cualquier oración de la 4.5 que
// nombre otro principio activo del catálogo. Pero muchas oraciones de esa
// sección dicen lo CONTRARIO de una interacción: «no se dan interacciones
// clínicamente significativas», «dronedarona no afecta la farmacocinética de
// clopidogrel». Cargarlas como par escribiría en la base lo opuesto de la ficha.
//
// Esta clasificación sólo DEGRADA, nunca promueve: una oración que no se puede
// leer con certeza queda como `unspecified` y sigue siendo un par. Lo que se
// descarta va a la cola (`cima-unmatched.csv`) con su razón, para revisión.
//
// Prioridad (la primera que aplica):
//   0. concesiva    — «Aunque no se han descrito interacciones, …»: se conserva.
//   1. `warning`    — la tabla fija de severidad la reconoce («no se recomienda»,
//                      «contraindicado»): la advertencia manda aunque la oración
//                      empiece con «Aunque no se ha informado de interacciones…».
//   2. `possible`   — «no se puede descartar…»: doble negación = posible
//                      interacción, es una cautela, no una ausencia.
//   3. `no-data`    — la ficha dice que NO se estudió: ausencia de datos, que no
//                      es ni interacción ni su ausencia. Va antes que `negated`
//                      porque «no se han realizado estudios de interacción»
//                      también contiene «no … interacción».
//   4. `negated`    — la ficha dice que NO hay interacción ni efecto.
//   5. `unspecified`— todo lo demás.
// =============================================================================

import { foldForSearch } from './common.mjs';

export const INTERACTION_ASSERTION = Object.freeze({
  WARNING: 'warning',
  POSSIBLE: 'possible',
  NEGATED: 'negated',
  NO_DATA: 'no-data',
  UNSPECIFIED: 'unspecified',
});

/** Motivo en la cola `cima-unmatched.csv` para cada aserción que no se carga. */
export const INTERACTION_DROP_REASON = Object.freeze({
  [INTERACTION_ASSERTION.NEGATED]: 'negated-interaction',
  [INTERACTION_ASSERTION.NO_DATA]: 'no-interaction-data',
});

const fold = (text) => foldForSearch(text).replace(/\s+/g, ' ').trim();

/** Doble negación: la ficha no puede descartar la interacción. */
const POSSIBLE = [
  /\bno (?:se )?(?:puede|pueden|podria|podrian)(?:n)? (?:descartar|excluir)/u,
  /\bno (?:puede|pueden) (?:descartarse|excluirse)/u,
  /\bno (?:se )?(?:descarta|excluye)(?:n)?\b/u,
  /\bno cabe (?:descartar|excluir)/u,
  /\bno se (?:puede|pueden) (?:asegurar|garantizar)/u,
];

/** La ficha afirma que no hay interacción, efecto ni cambio. */
const NEGATED = [
  // «no se dan / han observado / existen … interacciones», «sin interacciones»
  /\b(?:no|ni|ninguna?|ningun)\b[^.;\u2014]{0,60}\binteracc?ion(?:es)?\b/u,
  /\b(?:sin|ausencia de|falta de) (?:\w+ ){0,2}interacc?ion(?:es)?\b/u,
  /\bno interaccion(?:a|an|o|aron|ara|e|en)\b/u,
  // «no tuvo / tiene efecto», «no afecta / modifica / altera / influye / inhibe / induce»
  /\bno (?:se )?(?:ha(?:n)? )?(?:afect|modific|alter|influy|influid|inhib|induc|cambi|interfier|potenci|aument|reduj|disminuy)\w*/u,
  /\bno (?:ejercio|ejercieron|provoco|provocaron|causo|causaron|origino|originaron)\b/u,
  /\bningun (?:efecto|cambio|influencia|interaccion)\b/u,
  /\bfalta de efecto (?:en|sobre) la farmacocinetica\b/u,
  /\bno es (?:probable|de esperar)\b/u,
  /\bno (?:se )?(?:vio|vieron|ha visto|han visto) (?:influid|afectad|modificad|alterad)\w*/u,
  /\bno (?:tuvo|tuvieron|tiene|tienen|ejerce|ejercen|produjo|produjeron|produce|producen|presenta|presentan|mostro|mostraron|muestra|muestran) \w*(?: \w+){0,2} ?(?:efecto|cambio|influencia|alteracion|modificacion|diferencia)/u,
  /\bno (?:se )?(?:ha(?:n)? )?(?:observ|detect|encontr|identific|notific|describ|inform|document|constat|apreci)\w*/u,
  /\bno (?:se )?(?:da|dan|dio|dieron) (?:como resultado )?(?:un |unos |una |unas )?(?:interacc|cambio|efecto)/u,
  /\bno (?:se )?(?:espera|esperan|preve|prevee|preven|anticipa|anticipan)\b/u,
  /\bno (?:se )?(?:conoce|conocen|existe|existen|hay)\b(?: ningun[ao]?s?)? ?(?:evidencia|interacc|efecto|indicio|caso)/u,
  /\bno (?:se )?(?:requiere|requieren|necesita|necesitan|precisa|precisan)\b[^.;]{0,40}\b(?:ajuste|modificacion|cambio)/u,
  /\bno (?:fue|es|son|resulta|resultan|resulto|se considera)\b[^.;]{0,20}\b(?:necesari|relevante|significativ|clinicamente)/u,
  /\bno (?:es|son|actua|actuan) (?:un |unos )?(?:sustrato|inhibidor|inductor)/u,
  /\bno (?:es|son|fue|fueron) metaboliz\w*/u,
  /\bni (?:tampoco )?(?:inhib|induc|afect|modific|alter)\w*/u,
  /\bsin (?:efecto|cambio|cambios|influencia|alteracion|modificacion|diferencia)\b/u,
];

/** La ficha dice que la interacción no se estudió. */
const NO_DATA = [
  /\b(?:no|aun no|todavia no)(?: se)?(?: ha(?:n)?)? (?:realizado|realizaron|llevado a cabo|llevaron a cabo|efectuado|investigado|estudiado|evaluado|analizado|determinado)/u,
  /\bno (?:se )?(?:dispone|disponen|cuenta|cuentan|dispone de|disponen de) (?:de )?(?:datos|informacion|estudios|ensayos)/u,
  /\bno (?:hay|existen|existe) (?:datos|estudios|ensayos|informacion)/u,
  /\b(?:sin|ausencia de|falta de) (?:estudios|ensayos|datos)\b/u,
  /\binteracc?ion(?:es)? no (?:estudiad|investigad|evaluad)\w*/u,
  /\bno (?:estudiad|investigad|evaluad)[oa]s?\b/u,
  /\bno se ha(?:n)? (?:estudiad|investigad|evaluad)\w*/u,
];

/**
 * «Aunque no se han descrito interacciones, se recomienda controlar…»: la
 * negación es una concesión y lo que sigue es una precaución. Se conserva.
 */
const CONCESSIVE = /^(?:[-\u2022\s]*)(?:aunque|si bien|a pesar de que|pese a que|no obstante)\b/u;

/**
 * Oración mixta: una parte niega y otra afirma («AAS no modificó la inhibición…,
 * pero clopidogrel potenció el efecto del AAS»). No se puede partir sin leerla:
 * se conserva.
 */
const CONTRAST = /\b(?:pero|sin embargo|no obstante|mientras que|aunque|si bien|excepto|salvo|con la excepcion)\b/u;

/**
 * «Interacción no estudiada. Las concentraciones pueden aumentar…»: la ausencia
 * de estudios viene con una sospecha. Descartarla perdería la sospecha.
 */
const RISK_CUE = /\b(?:puede|pueden|podria|podrian|es posible|es probable|posible|probable|riesgo|precaucion|vigil\w*|evitar|esperar|esperad\w*|se espera|aumento|descenso|incremento|disminucion|reduccion)\b/u;

const matchesAny = (patterns, text) => patterns.some((p) => p.test(text));

/**
 * Qué afirma una oración de 4.5.
 *
 * @param {string} sentence             oración literal de la ficha
 * @param {string} severityCode         resultado de `interactionSeverity(sentence)`
 * @param {string} unspecifiedSeverity  el código «sin severidad» (`UNSPECIFIED`)
 * @returns {'warning'|'possible'|'negated'|'no-data'|'unspecified'}
 */
export function interactionAssertion(sentence, severityCode, unspecifiedSeverity) {
  if (severityCode !== unspecifiedSeverity) return INTERACTION_ASSERTION.WARNING;
  const plain = fold(sentence);
  if (CONCESSIVE.test(plain)) return INTERACTION_ASSERTION.UNSPECIFIED;
  if (matchesAny(POSSIBLE, plain)) return INTERACTION_ASSERTION.POSSIBLE;
  if (matchesAny(NO_DATA, plain)) return CONTRAST.test(plain) || RISK_CUE.test(plain) ? INTERACTION_ASSERTION.UNSPECIFIED : INTERACTION_ASSERTION.NO_DATA;
  if (matchesAny(NEGATED, plain)) return CONTRAST.test(plain) ? INTERACTION_ASSERTION.UNSPECIFIED : INTERACTION_ASSERTION.NEGATED;
  return INTERACTION_ASSERTION.UNSPECIFIED;
}
