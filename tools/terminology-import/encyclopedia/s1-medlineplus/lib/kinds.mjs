// =============================================================================
// Catálogo de `kind` de sección (TAREA-41 §12.3) y reglas que asignan un `kind`
// a partir del TÍTULO que la propia fuente puso a la sección.
//
// La regla nunca mira el contenido ni lo interpreta: lee el encabezado de la
// NLM («¿Qué causa la afasia?» → `causes`). Cada sección de la fuente sale como
// UNA sección propia —nunca se fusionan dos— y varias secciones pueden tener el
// mismo `kind`; se distinguen por su `locator` (el encabezado original).
//
// Catálogo = el de la ficha por familia (`KINDS_BY_FAMILY`) + los `kind`
// TRANSVERSALES que S1 agregó el 2026-10-09 porque la NLM publica esas secciones
// y ninguno de los de la ficha las describía sin cambiarles el sentido
// (`TRANSVERSAL_KINDS`; la ficha §12.3 los registra). Los `kind` de la ficha se
// admiten en cualquier familia cuando el encabezado de la fuente lo dice
// («¿Qué causa el dolor?» en un síntoma es `causes`).
//
// Un encabezado que ninguna regla reconoce NO se fuerza a un `kind` cercano: cae
// en `additional_information` («Otra información de la fuente»), cuyo `locator`
// conserva la pregunta exacta. Eso evita perder la sección sin mentir sobre ella.
// =============================================================================

export const KINDS_BY_FAMILY = Object.freeze({
  disease: [
    'definition', 'overview', 'symptoms', 'causes', 'risk_factors', 'diagnosis', 'treatment_overview',
    'complications', 'prevention', 'prognosis', 'when_to_seek_care', 'epidemiology', 'genetics', 'classification',
  ],
  symptom: ['definition', 'overview', 'associated_conditions', 'red_flags', 'when_to_seek_care', 'self_care'],
  test: ['definition', 'purpose', 'preparation', 'procedure_description', 'risks', 'interpretation', 'reference_values'],
  procedure: ['definition', 'purpose', 'procedure_description', 'risks', 'recovery', 'alternatives'],
  other: ['definition', 'overview'],
});

/** Agregados por S1 (2026-10-09). Cada uno nombra una sección que la NLM publica con su propio título. */
export const TRANSVERSAL_KINDS = Object.freeze([
  'indications',            // «¿Por qué necesito…?», «¿Quién necesita…?», «¿Cuándo se necesita…?»
  'transmission',           // «¿Cómo se transmite/propaga…?», «¿Es contagiosa…?»
  'side_effects',           // «¿Cuáles son los efectos secundarios…?»
  'effects',                // «¿Cuáles son los efectos de…?» (a corto/largo plazo, en la salud)
  'benefits',               // «¿Cuáles son los beneficios…?»
  'how_it_works',           // «¿Cómo funcionan/actúan…?»
  'safe_use',               // «¿Cómo usar/tomar … de forma segura?» (sin dosis)
  'what_to_expect',         // «¿Qué puedo esperar…?»
  'importance',             // «¿Por qué es importante…?»
  'considerations',         // «¿Cómo decidir…?», «¿Qué debo considerar…?»
  'additional_information', // «¿Debo saber algo más…?» y toda sección sin regla más específica
]);

/** Orden de publicación de las secciones dentro de un artículo (estable). */
export const KIND_ORDER = Object.freeze([
  'definition', 'overview', 'classification', 'symptoms', 'associated_conditions', 'red_flags', 'causes', 'transmission',
  'risk_factors', 'indications', 'epidemiology', 'genetics', 'purpose', 'importance', 'how_it_works', 'preparation',
  'procedure_description', 'what_to_expect', 'diagnosis', 'interpretation', 'reference_values', 'treatment_overview',
  'alternatives', 'safe_use', 'benefits', 'effects', 'side_effects', 'risks', 'complications', 'recovery', 'prognosis',
  'prevention', 'when_to_seek_care', 'self_care', 'considerations', 'additional_information',
]);

export const ALL_KINDS = Object.freeze(new Set(KIND_ORDER));

const FAMILY_BY_CATEGORY = Object.freeze({
  disease: 'disease',
  'signs-symptoms': 'symptom',
  'diagnostic-test': 'test',
  lab: 'test',
  imaging: 'test',
  procedure: 'procedure',
  treatment: 'procedure',
  other: 'other',
});

export function familyOf(categoryKey) {
  return FAMILY_BY_CATEGORY[categoryKey] ?? 'other';
}

const WHAT_IS = /^¿?\s*(?:qué|que)\s+(?:es|son|significa)\b|^¿?\s*en qué consiste\b/i;
const SEEK = /cu[aá]ndo\b.*\b(?:consult|llam|busc|acud|ver\b|vea\b|atenci[oó]n|visit)/i;

/**
 * Reglas comunes a todas las familias, en orden (gana la primera). El orden importa:
 * lo específico («efectos secundarios») antes de lo general («efectos»), y «¿Cómo puedo…?»
 * (autocuidado) antes de los verbos que también aparecen en otras reglas.
 */
const RULES = Object.freeze([
  ['additional_information', /^¿?\s*(?:debo saber algo m[aá]s|hay algo m[aá]s|qu[eé] m[aá]s (?:debo|necesito|puedo|tengo que) saber|qu[eé] m[aá]s debo)/i],
  ['definition', WHAT_IS],
  ['indications', /^¿?\s*por qu[eé] (?:necesit|se necesit|se hace|se hacen|se realiza|se piden?)|^¿?\s*qui[eé]n(?:es)? (?:necesita|necesitan|debería|deberían|debe |puede beneficiarse|podría beneficiarse)|^¿?\s*qui[eé]n la necesita|^¿?\s*cu[aá]ndo (?:se necesita|es necesari[oa] (?:una|un|el|la)\b(?!.*(?:consult|vea\b|llam))|se usa|se utiliza|debo comenzar|debo empezar)/i],
  ['transmission', /\bc[oó]mo se (?:transmite|transmiten|propaga|propagan|contagia|contagian|pasa|contrae)\b|\bes contagios[ao]\b|\bse contagia\b/i],
  ['side_effects', /efectos secundarios|efectos adversos|efectos indeseables/i],
  ['considerations', /beneficios y riesgos|riesgos y beneficios/i],
  ['benefits', /\bbeneficios?\b/i],
  ['how_it_works', /^¿?\s*c[oó]mo (?:funcionan?|act[uú]an?|trabajan?|bajan? |ayudan? |previenen? )/i],
  ['safe_use', /^¿?\s*(?:c[oó]mo|qu[eé]) (?:usar|uso|tomar|se toman?|puedo tomar|puedo usar|debo tomar|debo usar|mantenerme seguro)|forma segura|manera segura|correctamente\b/i],
  ['purpose', /qu[eé] (?:problemas|afecci[oó]n|afecciones|condiciones|enfermedades)\b.*\b(?:trata|tratan|son tratadas)\b|qu[eé] (?:trata|tratan) /i],
  ['what_to_expect', /^¿?\s*cu[aá]nt[oa] (?:tiempo )?(?:dura|tarda|tardan|duran)|^¿?\s*qu[eé] (?:puedo|puede|debe|se puede) esperar\b(?!.*despu[eé]s)|^¿?\s*qu[eé] esperar\b(?!.*despu[eé]s)/i],
  ['recovery', /despu[eé]s de (?:una|un|la|el)\b|recuperaci[oó]n|c[oó]mo es la vida despu[eé]s|volver a\b/i],
  ['procedure_description', /^¿?\s*qu[eé] (?:ocurre|sucede|pasa) (?:durante|en)\b|c[oó]mo se (?:realiza|hace|administra|lleva a cabo)|qu[eé] (?:enfoques|m[eé]todos|t[eé]cnicas)\b/i],
  ['preparation', /prepararme|prepararse|prepararte|preparar\b|c[oó]mo prepararse|antes de (?:la|una|el)\b/i],
  ['interpretation', /^¿?\s*qu[eé] significan?\s+(?:los |sus |mis )?resultados|^¿?\s*qu[eé] (?:ocurre|pasa) si (?:la|el|mi|los|sus)\b.*(?:no es normal|anormal|positiv|resultado)/i],
  ['symptoms', /\bs[ií]ntomas?\b|\bsignos?\b|\bse[ñn]ales\b|c[oó]mo (?:s[eé]|saber) si/i],
  ['causes', /^¿?\s*qu[eé]\s+(?:causa|causan|provoca|provocan|origina|originan)\b|\bcausas?\b|\bqu[eé] (?:puede|pueden) (?:afectar|causar)\b/i],
  ['risk_factors', /^¿?\s*(?:qui[eé]n|qui[eé]nes|qu[eé] (?:ni[ñn]os|personas|adultos|mujeres|hombres))\b.*(?:probabilidad|riesgo|propens|expuest|susceptib|contraer|desarroll|padecer)|factores?\s+de\s+riesgo|\ben\s+riesgo\b|corren?\s+el\s+riesgo|tienen\s+riesgo\s+de|aumentar\s+(?:mi|el)\s+riesgo|aumenta\s+el\s+riesgo|qui[eé]n (?:no )?debería\b/i],
  ['diagnosis', /diagn[oó]stic|\bse hacen? las pruebas\b|c[oó]mo se (?:detecta|detectan|identifica)/i],
  ['treatment_overview', /tratamient|c[oó]mo se tratan?\b|se\s+(?:puede|pueden)\s+tratar/i],
  ['prevention', /prevenir|prevenci[oó]n|prevenirse|puede\s+prevenirse|se\s+(?:puede|pueden)\s+evitar/i],
  ['complications', /complicaciones|qu[eé]\s+(?:otros\s+)?problemas\b(?!.*\btrata)|qu[eé] enfermedades pueden/i],
  ['classification', /\btipos?\s+de\b|\bclases?\s+de\b|^¿?\s*qu[eé]\s+tipos?\b|diferentes (?:tipos|maneras|formas)|\bcu[aá]les son los (?:dos |tres )?tipos\b/i],
  ['prognosis', /pron[oó]stico|perspectivas?\b|expectativa\s+de\s+vida|cu[aá]nto (?:dura|tarda)/i],
  ['when_to_seek_care', SEEK],
  ['epidemiology', /cu[aá]nt[ao]s\s+personas|qu[eé]\s+tan\s+(?:com[uú]n|frecuente)|\bprevalencia\b/i],
  ['alternatives', /alternativ/i],
  ['importance', /^¿?\s*por qu[eé] (?:es|son) importantes?|qu[eé] importancia\b/i],
  ['considerations', /^¿?\s*c[oó]mo (?:decidir|decido|elegir|elijo)|qu[eé] debo considerar|qu[eé] factores|qu[eé] tipo de .* es adecuad/i],
  ['risks', /\briesgos?\b|desventajas|peligros?\b/i],
  ['genetics', /\bhereditari|se\s+hereda|componente gen[eé]tico/i],
  ['effects', /\befectos\b/i],
  ['purpose', /^¿?\s*para qu[eé] se (?:usa|usan|utiliza|utilizan)\b|^¿?\s*c[oó]mo se usan?\b|^¿?\s*por qu[eé] se utiliza/i],
  ['self_care', /^¿?\s*(?:qu[eé]|c[oó]mo) (?:puedo|podr[ií]a|debo|hago|se puede)\b|^¿?\s*c[oó]mo (?:mantener|mejorar|reducir|bajar|elevar|obtener|cuidar|proteger|ayudar|afrontar|evaluar|mantengo)|\bsugerencias\b/i],
]);

/**
 * Asigna `kind` al encabezado de una sección. Nunca devuelve null para un encabezado:
 * lo que ninguna regla reconoce es `additional_information` con `rule: 'fallback'`.
 * @returns {{ kind: string, rule: string }}
 */
export function kindForHeading(_family, heading) {
  const text = String(heading ?? '').replace(/\s+/g, ' ').trim();
  for (const [kind, re] of RULES) if (re.test(text)) return { kind, rule: `rule:${kind}` };
  return { kind: 'additional_information', rule: 'fallback' };
}
