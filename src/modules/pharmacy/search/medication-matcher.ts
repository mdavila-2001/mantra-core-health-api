/**
 * The medication search engine shared by the public showcase
 * (`GET /public/medications`) and the patient store (`GET /pharmacy/products`).
 *
 * Three passes, in order:
 * 1. **By name** — generic, brand or code; accent-free, every typed word as a
 *    prefix («ibupro 400» finds «Ibuprofeno 400 mg»).
 * 2. **By use** — only if pass 1 found nothing: what it is for
 *    («dolor abdominal» → ATC A03), from
 *    {@link THERAPEUTIC_USES}. Only the most specific uses win: «dolor
 *    abdominal» brings antispasmodics, not every painkiller.
 * 3. **By typo** — only when 1 and 2 found nothing and the caller did not ask
 *    for the literal text: each unknown word is replaced by the closest
 *    catalog word («ibopofeno» → «ibuprofeno») and passes 1–2 run again. The
 *    correction travels back so the screen can say so.
 */
import {
  THERAPEUTIC_USES,
  type TherapeuticUse,
} from './therapeutic-uses.catalog';
import {
  keywords,
  normalize,
  prefixMatch,
  tolerance,
  typoDistance,
  words,
} from './search-text';

/** Something searchable: one medication or one product. */
export interface SearchDoc {
  readonly key: string;
  readonly names: readonly (string | null)[];
  readonly brands: readonly (string | null)[];
  readonly codes: readonly (string | null)[];
  readonly atc: string | null;
}

/** Why a document came back. */
export type MatchKind = 'name' | 'brand' | 'code' | 'use';

export interface DocMatch {
  readonly matchedBy: MatchKind;
  /** The use label that found it, when `matchedBy === 'use'`. */
  readonly matchedUse: string | null;
  /** Higher first: name matches outrank use matches. */
  readonly score: number;
}

export interface SearchOutcome {
  /** Matches by document key. Empty query → `null` (no filtering). */
  readonly matches: ReadonlyMap<string, DocMatch> | null;
  /** The corrected text actually searched, or `null` if none was needed. */
  readonly correctedQuery: string | null;
}

/** Normalized phrases of every use, computed once. */
const USE_PHRASES = THERAPEUTIC_USES.map((use) => ({
  use,
  phrases: use.terms.map((term) => keywordsOrWords(term)),
}));

/**
 * The use labels of an ATC code, most specific group first.
 *
 * @param atc - ATC code of the medication, any level.
 */
export function usesOf(atc: string | null): string[] {
  if (!atc) return [];
  const code = atc.toUpperCase();
  return THERAPEUTIC_USES.filter((use) => coversAtc(use, code))
    .sort((a, b) => longestPrefix(b, code) - longestPrefix(a, code))
    .map((use) => use.label);
}

/**
 * Searches the documents.
 *
 * @param docs - What to search in.
 * @param query - What the person typed.
 * @param exact - `true` disables the typo pass («search X anyway»).
 */
export function searchDocs(
  docs: readonly SearchDoc[],
  query: string | undefined,
  exact = false,
): SearchOutcome {
  if (query === undefined || normalize(query) === '') {
    return { matches: null, correctedQuery: null };
  }
  const clean = normalize(query);
  if (clean.length < 2) {
    // One character: a plain substring filter, as the old SQL `ILIKE` did.
    return { matches: substringMatches(docs, clean), correctedQuery: null };
  }
  const direct = directMatches(docs, query);
  if (direct.size > 0 || exact)
    return { matches: direct, correctedQuery: null };

  const corrected = correctTypos(docs, query);
  if (corrected === null) return { matches: direct, correctedQuery: null };
  const second = directMatches(docs, corrected);
  return second.size > 0
    ? { matches: second, correctedQuery: corrected }
    : { matches: direct, correctedQuery: null };
}

/* ---- passes 1 and 2 ------------------------------------------------------ */

function directMatches(
  docs: readonly SearchDoc[],
  query: string,
): Map<string, DocMatch> {
  const whole = normalize(query);
  const terms = keywordsOrWords(query);
  const out = new Map<string, DocMatch>();

  for (const doc of docs) {
    const hit = nameHit(doc, whole, terms);
    if (hit !== null) out.set(doc.key, hit);
  }

  // Uses only when nothing matched by name: «calc» means calcitriol, not
  // every vitamin and mineral, and «ibuprofeno» must not bring its group.
  if (out.size > 0) return out;
  const uses = bestUses(terms);
  if (uses.length === 0) return out;
  for (const doc of docs) {
    if (out.has(doc.key) || !doc.atc) continue;
    const code = doc.atc.toUpperCase();
    const use = uses.find((candidate) => coversAtc(candidate, code));
    if (use !== undefined) {
      out.set(doc.key, { matchedBy: 'use', matchedUse: use.label, score: 50 });
    }
  }
  return out;
}

function nameHit(
  doc: SearchDoc,
  whole: string,
  terms: readonly string[],
): DocMatch | null {
  const fields: Array<[MatchKind, readonly (string | null)[]]> = [
    ['name', doc.names],
    ['brand', doc.brands],
    ['code', doc.codes],
  ];
  for (const [kind, values] of fields) {
    if (present(values).some((value) => normalize(value).includes(whole))) {
      return { matchedBy: kind, matchedUse: null, score: 100 };
    }
  }
  const vocabulary = fields.map(([kind, values]) => ({
    kind,
    words: present(values).flatMap((value) => words(value)),
  }));
  const all = vocabulary.flatMap((field) => field.words);
  if (!terms.every((term) => all.some((word) => prefixMatch(term, word))))
    return null;
  const first = vocabulary.find((field) =>
    field.words.some((word) => prefixMatch(terms[0], word)),
  );
  return { matchedBy: first?.kind ?? 'name', matchedUse: null, score: 90 };
}

/**
 * The uses whose phrases best fit the terms. A phrase fits fully when all its
 * words were typed, or partially when all typed words are in it; the score
 * favors more words and full fits, and only the top score survives.
 */
function bestUses(terms: readonly string[]): TherapeuticUse[] {
  let best = 0;
  let winners: TherapeuticUse[] = [];
  for (const { use, phrases } of USE_PHRASES) {
    let score = 0;
    for (const phrase of phrases) {
      const typed = (word: string) => terms.some((term) => fits(term, word));
      const full = phrase.every(typed);
      const partial = terms.every((term) =>
        phrase.some((word) => fits(term, word)),
      );
      if (full) score = Math.max(score, phrase.length * 2 + 1);
      else if (partial) score = Math.max(score, terms.length * 2);
    }
    if (score > best) [best, winners] = [score, [use]];
    else if (score === best && score > 0) winners.push(use);
  }
  return winners;
}

/** A typed term fits a phrase word: same word, or a prefix of 3+ letters. */
function fits(term: string, word: string): boolean {
  return term === word || (term.length >= 3 && prefixMatch(term, word));
}

/* ---- pass 3 -------------------------------------------------------------- */

/** The query with every unknown word replaced by its closest catalog word. */
function correctTypos(
  docs: readonly SearchDoc[],
  query: string,
): string | null {
  const vocabulary = new Set<string>();
  for (const doc of docs) {
    for (const value of present([...doc.names, ...doc.brands])) {
      for (const word of words(value))
        if (word.length >= 3) vocabulary.add(word);
    }
  }
  for (const { phrases } of USE_PHRASES) {
    for (const phrase of phrases)
      for (const word of phrase) vocabulary.add(word);
  }

  let changed = false;
  const fixed = keywordsOrWords(query).map((term) => {
    if ([...vocabulary].some((word) => prefixMatch(term, word))) return term;
    const closest = closestWord(term, vocabulary);
    if (closest === null) return term;
    changed = true;
    return closest;
  });
  return changed ? fixed.join(' ') : null;
}

function closestWord(
  term: string,
  vocabulary: ReadonlySet<string>,
): string | null {
  const max = tolerance(term);
  if (max === 0) return null;
  let best: { word: string; rank: number } | null = null;
  for (const word of vocabulary) {
    const distance = typoDistance(term, word);
    if (distance > max) continue;
    // Same first letter and closer length break ties: typos rarely hit the
    // first letter, and «ibopofeno» is closer to «ibuprofeno» than to «ibu».
    const rank =
      distance * 10 +
      (word[0] === term[0] ? 0 : 5) +
      Math.abs(word.length - term.length);
    if (best === null || rank < best.rank) best = { word, rank };
  }
  return best?.word ?? null;
}

/* ---- helpers ------------------------------------------------------------- */

function substringMatches(
  docs: readonly SearchDoc[],
  text: string,
): Map<string, DocMatch> {
  const out = new Map<string, DocMatch>();
  for (const doc of docs) {
    const fields = present([...doc.names, ...doc.brands, ...doc.codes]);
    if (fields.some((value) => normalize(value).includes(text))) {
      out.set(doc.key, { matchedBy: 'name', matchedUse: null, score: 100 });
    }
  }
  return out;
}

function keywordsOrWords(text: string): string[] {
  const meaningful = keywords(text);
  return meaningful.length > 0 ? meaningful : words(text);
}

function coversAtc(use: TherapeuticUse, code: string): boolean {
  return use.atc.some((prefix) => code.startsWith(prefix));
}

function longestPrefix(use: TherapeuticUse, code: string): number {
  return Math.max(
    0,
    ...use.atc.filter((prefix) => code.startsWith(prefix)).map((p) => p.length),
  );
}

function present(values: readonly (string | null)[]): string[] {
  return values.filter(
    (value): value is string => typeof value === 'string' && value !== '',
  );
}
