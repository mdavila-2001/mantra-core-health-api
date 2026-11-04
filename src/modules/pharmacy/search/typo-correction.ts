/**
 * Pass 3 of the medication search: each unknown word is replaced by the
 * closest known word («ibopofeno» → «ibuprofeno»). Split out of
 * `medication-matcher.ts`.
 */
import { prefixMatch, tolerance, typoDistance } from './search-text';

/**
 * The terms with every unknown word replaced by its closest known word, or
 * `null` when nothing changed.
 *
 * @param terms - Normalized words of the query.
 * @param vocabulary - Normalized words of the catalog and the uses.
 */
export function replaceTypos(
  terms: readonly string[],
  vocabulary: readonly string[],
): string | null {
  let changed = false;
  const fixed = terms.map((term) => {
    if (vocabulary.some((word) => prefixMatch(term, word))) return term;
    const closest = closestWord(term, vocabulary);
    if (closest === null) return term;
    changed = true;
    return closest;
  });
  return changed ? fixed.join(' ') : null;
}

function closestWord(
  term: string,
  vocabulary: readonly string[],
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
