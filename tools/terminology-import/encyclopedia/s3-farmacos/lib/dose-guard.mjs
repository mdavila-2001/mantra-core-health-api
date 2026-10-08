// =============================================================================
// Guardia de dosis. Regla dura del carril 41 (§3.3, §12.2.5): ni dosis ni
// posología en ninguna sección, para ninguna fuente.
//
// La sección 4.2 nunca se pide (lista blanca). Pero las demás secciones citan
// cantidades de pasada («no superar 4 g», «aclaramiento < 30 ml/min», «reducir
// la dosis»). Esta guardia las detecta POR ORACIÓN y la oración entera se
// descarta (queda anotada en `rejected.ndjson`); lo que se publica sigue siendo
// literal, solo que sin esas oraciones.
//
// Es deliberadamente más estricta que el mínimo pedido (número + mg/g/ml/UI/mcg/%,
// «cada N horas», «dosis»): también corta unidades de peso, formas de toma y
// remisiones a la sección 4.2. Preferimos perder una oración inocente a publicar
// una posología.
// =============================================================================

const UNIT_WORDS = [
  'mg', 'g', 'kg', 'ml', 'dl', 'mcg', 'ug', 'ng', 'µg', 'μg', 'ui', 'iu', 'meq', 'mmol', 'mol',
  'gramos?', 'miligramos?', 'microgramos?', 'mililitros?', 'litros?', 'unidades(?:\\s+internacionales)?',
  'gotas?', 'comprimidos?', 'c[aá]psulas?', 'ampollas?', 'viales?', 'sobres?', 'cucharad\\w+', 'inhalaciones?',
  'puffs?', 'aplicaciones?', 'supositorios?', 'parches?',
].join('|');

/** id → expresión. El id viaja a `rejected.ndjson` como motivo. */
export const DOSE_PATTERNS = Object.freeze([
  // número + unidad: «500 mg», «0,5 mcg», «30 ml/min», «10 %», «1 comprimido»
  ['quantity-unit', new RegExp(`(?<![\\p{L}\\d])\\d[\\d.,]*(?:\\s\\d{3})*\\s*(?:${UNIT_WORDS})(?![\\p{L}\\d])`, 'iu')],
  // cantidad escrita con letras: «un comprimido», «dos gotas», «medio vial»
  ['spelled-quantity', /\b(?:un|una|uno|dos|tres|cuatro|cinco|seis|siete|ocho|nueve|diez|doce|medio|media)\s+(?:comprimidos?|c[aá]psulas?|ampollas?|viales?|sobres?|gotas?|cucharad\w+|inhalaciones?|puffs?|aplicaciones?|supositorios?|parches?|gramos?|miligramos?|microgramos?|mililitros?|litros?|unidades)(?![\p{L}])/iu],
  ['percent', /\d\s*%|\bpor\s+ciento\b/iu],
  ['every-n-time', /\bcada\s+(?:\d+|una|un|dos|tres|cuatro|cinco|seis|ocho|doce|veinticuatro|cuarenta y ocho)\s+(?:horas?|h|d[ií]as?|semanas?|meses|minutos?)(?![\p{L}])/iu],
  ['every-period', /\bcada\s+(?:hora|d[ií]a|semana|ma[ñn]ana|noche|comida)(?![\p{L}])/iu],
  ['times-per-period', /\b(?:\d+|una|dos|tres|cuatro|cinco|seis)\s+veces\s+(?:al|por|a\s+la|cada)\s+(?:d[ií]a|semana|hora|noche)/iu],
  ['once-per-period', /\buna\s+vez\s+(?:al|por|a\s+la|cada)\s+(?:d[ií]a|semana|hora|noche)/iu],
  ['dose-word', /dosis|dosific|dosifi|posolog|sobredos/iu],
  ['posology-section-ref', /secci[oó]n(?:es)?\s[^.;]*?\b4\.2\b/iu],
]);

/** Devuelve el id del primer patrón de dosis que casa, o `null` si el texto está limpio. */
export function doseMatch(text) {
  if (typeof text !== 'string' || text === '') return null;
  const flat = text.replace(/[  ]/g, ' ');
  for (const [id, re] of DOSE_PATTERNS) if (re.test(flat)) return id;
  return null;
}

export const containsDose = (text) => doseMatch(text) !== null;

export class DoseLeakError extends Error {
  constructor(path, patternId, excerpt) {
    super(`Patrón de dosis «${patternId}» en ${path}: «${excerpt.slice(0, 120)}»`);
    this.name = 'DoseLeakError';
    this.path = path;
    this.patternId = patternId;
  }
}

/** Claves cuyo valor es una URL, un identificador o un código: no son prosa y no se miran. */
const NON_PROSE_KEYS = new Set([
  'url', 'thumbUrl', 'sourceUrl', 'licenseUrl', 'sourcePage', 'slug', 'system', 'code', 'source', 'kind',
  'lang', 'altTextQuality', 'retrievedAt', 'sourceVersion', 'license', 'author', 'locator', 'label', 'title',
]);

/**
 * Recorre TODO el artículo y lanza `DoseLeakError` ante cualquier cadena de prosa
 * (texto, ítems, valores de `facts`, leyendas) que case con un patrón de dosis.
 * Es la última barrera antes de escribir una línea de `articles.ndjson`.
 */
export function assertNoDose(value, path = '$') {
  if (typeof value === 'string') {
    const id = doseMatch(value);
    if (id) throw new DoseLeakError(path, id, value);
    return;
  }
  if (Array.isArray(value)) {
    value.forEach((v, i) => assertNoDose(v, `${path}[${i}]`));
    return;
  }
  if (value && typeof value === 'object') {
    for (const [k, v] of Object.entries(value)) {
      if (NON_PROSE_KEYS.has(k) && typeof v === 'string') continue;
      assertNoDose(v, `${path}.${k}`);
    }
  }
}
