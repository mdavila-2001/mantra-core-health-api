/**
 * Text primitives for the medication search: accent-free normalization,
 * tokenization without filler words, and a bounded edit distance.
 *
 * Pure functions, no Nest, so the matcher can be tested in isolation.
 */

/**
 * Filler words that carry no search meaning («algo para el dolor de cabeza»
 * searches for «dolor cabeza»). Normalized: lowercase, no accents.
 */
const STOPWORDS = new Set(
  (
    'a al algo algun alguna con contra de del el en es esta estoy hay la las le ' +
    'lo los me mi mis muy mucho mucha o para pastilla pastillas por que quiero ' +
    'remedio remedios medicamento medicamentos medicina se siento sin su sus ' +
    'tengo tiene tomar un una unos unas y sirve sirva bueno buena cura curar ' +
    'trata tratar tratamiento fuerte leve'
  ).split(' '),
);

/** Lowercase, no accents, only letters, digits and single spaces. */
export function normalize(text: string): string {
  return text
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, ' ')
    .trim();
}

/** Every normalized word, filler included. */
export function words(text: string): string[] {
  const clean = normalize(text);
  return clean === '' ? [] : clean.split(' ');
}

/**
 * The words that carry meaning: no filler. A single letter only counts next to
 * other words («vitamina c»), never alone.
 */
export function keywords(text: string): string[] {
  const all = words(text);
  return all.filter(
    (word) => !STOPWORDS.has(word) && (word.length >= 2 || all.length > 1),
  );
}

/**
 * How many edits a word of this length may absorb and still count as a typo.
 * Short words get none: «tos» must not become «gas».
 */
export function tolerance(word: string): number {
  if (word.length <= 3) return 0;
  if (word.length <= 5) return 1;
  if (word.length <= 8) return 2;
  return 3;
}

/**
 * Optimal string alignment distance (Damerau–Levenshtein with adjacent
 * transpositions), cut short once it exceeds `max`.
 *
 * @returns The distance, or `max + 1` when it is larger than `max`.
 */
export function editDistance(a: string, b: string, max: number): number {
  if (Math.abs(a.length - b.length) > max) return max + 1;
  let prevPrev: number[] = [];
  let prev = Array.from({ length: b.length + 1 }, (_, j) => j);
  for (let i = 1; i <= a.length; i++) {
    const row = [i];
    let best = i;
    for (let j = 1; j <= b.length; j++) {
      const cost = a[i - 1] === b[j - 1] ? 0 : 1;
      let value = Math.min(prev[j] + 1, row[j - 1] + 1, prev[j - 1] + cost);
      if (i > 1 && j > 1 && a[i - 1] === b[j - 2] && a[i - 2] === b[j - 1]) {
        value = Math.min(value, prevPrev[j - 2] + 1);
      }
      row.push(value);
      best = Math.min(best, value);
    }
    if (best > max) return max + 1;
    prevPrev = prev;
    prev = row;
  }
  return prev[b.length];
}

/**
 * Whether a typed word matches a catalog word without fuzziness: equal, or a
 * prefix of it («ibupro» → «ibuprofeno»).
 */
export function prefixMatch(typed: string, word: string): boolean {
  // One letter is a whole word («vitamina c»), not the start of «calcio».
  return typed.length === 1 ? word === typed : word.startsWith(typed);
}

/**
 * Edits needed for a typed word to match a catalog word, also against the
 * catalog word's head so a half-written typo («ibopof») still finds it.
 */
export function typoDistance(typed: string, word: string): number {
  const max = tolerance(typed);
  if (max === 0) return typed === word ? 0 : 1;
  const whole = editDistance(typed, word, max);
  if (typed.length >= word.length) return whole;
  const head = editDistance(typed, word.slice(0, typed.length), max);
  return Math.min(whole, head);
}
