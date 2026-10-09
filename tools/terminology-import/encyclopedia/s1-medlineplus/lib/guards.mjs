// =============================================================================
// Guardias de seguridad de contenido de la canalización S1 (TAREA-41 §12.2).
//
//  - Dosis y posología: regla 5, «cero dosis y cero posología, en cualquier
//    sección y para cualquier fuente». Es una guardia CONSERVADORA: ante la
//    duda la sección se rechaza (queda en `rejected.ndjson` con su motivo y su
//    patrón) en vez de publicarse. Una concentración clínica («mg/dL») NO es
//    una dosis y no se rechaza: es un valor de laboratorio con su fuente.
//  - A.D.A.M.: la Enciclopedia Médica de MedlinePlus es de A.D.A.M., con
//    licencia propia. Si cualquier texto de la fuente la nombra, se rechaza.
// =============================================================================

/** Unidades de masa/volumen/actividad que, pegadas a un número, indican cantidad de un producto. */
const DOSE_AMOUNT = /\b\d+(?:[.,]\d+)?\s*(?:mg|mcg|µg|μg|ug|miligramos?|microgramos?|gramos?|g|ml|mL|mililitros?|cc|UI|IU|unidades internacionales|gotas|tabletas?|pastillas?|c[aá]psulas?|comprimidos?|cucharadas?|cucharaditas?|inyecciones|puffs?|inhalaciones)\b(?!\s*\/\s*(?:d[lL]|L|l|ml|mL|24\s*h))/i;
/** Palabras que nombran la prescripción en sí. */
const DOSE_WORDS = /\b(?:dosis|posolog[ií]a|dosificaci[oó]n|dosifica)\b/i;
/**
 * Frecuencia de administración. Solo cuenta si la MISMA oración habla de un
 * producto que se toma o aplica: «dos veces al día» del cepillado de dientes no
 * es una posología. «sobredosis» tampoco es una dosis y no está en DOSE_WORDS.
 */
const DOSE_SCHEDULE = /\b(?:cada\s+\d+(?:\s*(?:a|-|o)\s*\d+)?\s*(?:horas|h)\b|\d+\s+veces\s+(?:al|por|a la)\s+(?:d[ií]a|semana|hora)|(?:una|dos|tres|cuatro)\s+veces\s+(?:al|por|a la)\s+(?:d[ií]a|semana)|antes\s+de\s+cada\s+comida)\b/i;
const TAKEN_PRODUCT = /medicament|medicin|pastilla|tableta|c[aá]psula|comprimido|suplemento|inyecci|antibi[oó]tic|insulina|vacuna|tome\b|tomar\b|tom[ae]n?\b|aplique|aplicar|ung[uü]ento|crema|gotas/i;

const DOSE_PATTERNS = [
  ['cantidad-con-unidad', DOSE_AMOUNT],
  ['palabra-de-dosis', DOSE_WORDS],
];

function scheduleCheck(text) {
  for (const sentence of String(text ?? '').split(/(?<=[.!?:;])\s+|\n+/)) {
    const m = sentence.match(DOSE_SCHEDULE);
    if (m && TAKEN_PRODUCT.test(sentence)) return m[0];
  }
  return null;
}

/** @returns {{ ok: boolean, pattern?: string, match?: string }} */
export function doseCheck(text) {
  for (const [name, re] of DOSE_PATTERNS) {
    const m = String(text ?? '').match(re);
    if (m) return { ok: false, pattern: name, match: m[0] };
  }
  const schedule = scheduleCheck(text);
  if (schedule) return { ok: false, pattern: 'frecuencia-de-administracion', match: schedule };
  return { ok: true };
}

/**
 * A.D.A.M. escrito con puntos, o «ADAM, Inc.» / «ADAM Health…». El nombre propio suelto
 * («Adam MP», autor de una cita de GeneReviews) NO cuenta: sería un falso positivo.
 */
/**
 * Rescate por párrafo (regla «cero dosis», versión que no tira el resto del texto): separa el
 * texto en párrafos (el `htmlToText` deja una línea en blanco entre párrafos y entre viñetas),
 * conserva los que pasan `doseCheck` y descarta los demás. Los párrafos conservados son
 * literales y van en su orden; lo descartado se cuenta y se informa.
 * @returns {{ text: string|null, kept: number, removed: { pattern: string, match: string }[] }}
 */
export function redactDose(text) {
  const kept = [];
  const removed = [];
  for (const paragraph of String(text ?? '').split(/\n{2,}/)) {
    if (!paragraph.trim()) continue;
    const check = doseCheck(paragraph);
    if (check.ok) kept.push(paragraph);
    else removed.push({ pattern: check.pattern, match: check.match });
  }
  return { text: kept.length ? kept.join('\n\n') : null, kept: kept.length, removed };
}

const ADAM = /\bA\.\s?D\.\s?A\.\s?M\b|\bADAM,?\s+(?:Inc\b|Health|Education|Medical\s+Encyclopedia)|Adam,\s*Inc\b/i;

/** @returns {{ ok: boolean, match?: string }} */
export function adamCheck(text) {
  const m = String(text ?? '').match(ADAM);
  return m ? { ok: false, match: m[0] } : { ok: true };
}

/** Verbos de acusación/recomendación personal que el sistema no debe poner de su cuenta (regla 6). */
export const ACCUSATION_WORDS = /\b(?:mala\s+praxis|negligencia|culpable|usted\s+debe\s+tomar)\b/i;
