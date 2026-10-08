// =============================================================================
// Catálogo cerrado de `kind` de sección (TAREA-41 §12.3) y reglas que asignan
// un `kind` a partir del TÍTULO que la propia fuente puso a la sección.
//
// La regla nunca mira el contenido ni lo interpreta: lee el encabezado de la
// NLM («¿Qué causa la afasia?» → `causes`). Un encabezado que ninguna regla
// reconoce NO se fuerza a un `kind` aproximado: la sección se rechaza con el
// motivo `unmapped-heading` y se cuenta en GAPS. Agregar un `kind` nuevo exige
// actualizar la ficha (§12.3), no este archivo.
//
// Familias de la ficha (la categoría la fija la semilla del glosario):
//   disease          → Enfermedades
//   symptom          → Síntomas y signos
//   test             → Pruebas y laboratorio     (diagnostic-test, lab)
//   procedure        → Procedimientos y tratamientos (procedure, treatment)
//   other            → «Otros términos»: la ficha no les define catálogo; solo
//                      se admiten los dos kinds transversales `definition` y
//                      `overview`.
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

const WHAT_IS = /^¿?\s*(?:qué|que)\s+(?:es|son)\b|^¿?\s*en qué consiste\b/i;

/** Reglas por familia: [kind, regex sobre el encabezado], en orden; gana la primera que casa. */
const RULES = Object.freeze({
  disease: [
    ['definition', WHAT_IS],
    ['symptoms', /\bs[ií]ntomas?\b|\bsignos?\b|\bse[ñn]ales\b/i],
    ['causes', /^¿?\s*qu[eé]\s+(?:causa|causan|provoca|provocan|origina|originan)\b|\bcausas?\s+(?:de|del)\b|^¿?\s*cu[aá]l(?:es)?\s+(?:es|son)\s+la[s]?\s+causas?\b/i],
    ['risk_factors', /^¿?\s*(?:qui[eé]n|qui[eé]nes)\b.*(?:probabilidad|riesgo|propens|expuest|susceptib|contraer|desarroll)|factores?\s+de\s+riesgo|\ben\s+riesgo\b|corren?\s+el\s+riesgo|tienen\s+riesgo\s+de|aumentar\s+(?:mi|el)\s+riesgo/i],
    ['diagnosis', /diagn[oó]stic/i],
    ['treatment_overview', /tratamient|c[oó]mo\s+se\s+tratan?\b|se\s+(?:puede|pueden)\s+tratar|c[oó]mo\s+se\s+trata/i],
    ['prevention', /prevenir|prevenci[oó]n|prevenirse|puede\s+prevenirse|se\s+(?:puede|pueden)\s+evitar/i],
    ['complications', /complicaciones|qu[eé]\s+(?:otros\s+)?problemas\b/i],
    ['classification', /\btipos?\s+de\b|\bclases?\s+de\b|^¿?\s*qu[eé]\s+tipos?\b/i],
    ['prognosis', /pron[oó]stico|perspectivas?\b|expectativa\s+de\s+vida/i],
    ['when_to_seek_care', /cu[aá]ndo\b.*\b(?:consult|llam|busc|acud|ver\b|vea\b|atenci[oó]n)/i],
    ['epidemiology', /cu[aá]nt[ao]s\s+personas|qu[eé]\s+tan\s+com[uú]n|\bprevalencia\b/i],
    ['genetics', /hereditari|gen[eé]tic|se\s+hereda/i],
  ],
  symptom: [
    ['definition', WHAT_IS],
    ['when_to_seek_care', /cu[aá]ndo\b.*\b(?:consult|llam|busc|acud|ver\b|vea\b|atenci[oó]n)/i],
    ['self_care', /c[oó]mo\s+(?:puedo|se\s+puede)\s+(?:aliviar|tratar|manejar)|cuidado\s+en\s+(?:el\s+)?hogar|autocuidado/i],
  ],
  test: [
    ['definition', WHAT_IS],
    ['purpose', /^¿?\s*para\s+qu[eé]\s+se\s+(?:usa|usan|utiliza|utilizan)\b|^¿?\s*c[oó]mo\s+se\s+usan?\b/i],
    ['preparation', /prepararme|prepararse|prepararte|c[oó]mo\s+prepararse/i],
    ['procedure_description', /^¿?\s*qu[eé]\s+(?:ocurre|sucede|pasa)\s+durante\b|c[oó]mo\s+se\s+realiza|c[oó]mo\s+se\s+hace/i],
    ['risks', /\briesgos?\b/i],
    ['interpretation', /^¿?\s*qu[eé]\s+significan?\s+(?:los|sus)\s+resultados/i],
  ],
  procedure: [
    ['definition', WHAT_IS],
    ['purpose', /^¿?\s*para\s+qu[eé]\s+se\s+(?:usa|usan|utiliza|utilizan)\b|^¿?\s*qu[eé]\s+afecciones\s+trata/i],
    ['procedure_description', /^¿?\s*qu[eé]\s+(?:ocurre|sucede|pasa)\s+durante\b|c[oó]mo\s+se\s+realiza|c[oó]mo\s+se\s+hace|qu[eé]\s+sucede\s+durante/i],
    ['risks', /\briesgos?\b/i],
    ['recovery', /^¿?\s*qu[eé]\s+(?:ocurre|sucede|pasa|se\s+puede\s+esperar)\s+despu[eé]s\b|recuperaci[oó]n/i],
    ['alternatives', /alternativ/i],
  ],
  other: [['definition', WHAT_IS]],
});

/**
 * Asigna `kind` al encabezado de una sección.
 * @returns {{ kind: string, rule: string } | null}  null = encabezado no reconocido.
 */
export function kindForHeading(family, heading) {
  const text = String(heading ?? '').replace(/\s+/g, ' ').trim();
  for (const [kind, re] of RULES[family] ?? RULES.other) {
    if (re.test(text) && KINDS_BY_FAMILY[family].includes(kind)) return { kind, rule: `${family}:${kind}` };
  }
  return null;
}
