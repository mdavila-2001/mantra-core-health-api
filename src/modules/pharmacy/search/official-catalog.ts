/**
 * The showcase's second source: the official health registry, with hundreds
 * of thousands of products. Too big to match in memory, so it is queried in
 * SQL with what the in-memory pass learned — the corrected text, or the ATC
 * groups of a symptom search.
 */
import type { EntityManager } from '@mikro-orm/postgresql';
import type { PublicOfficialMedicineDto } from '../dto';
import type { MedicineCatalogRepository } from '../repositories';
import {
  usesOf,
  useAtcPrefixes,
  type SearchOutcome,
} from './medication-matcher';
import { normalize } from './search-text';

/** Most registry products listed under the cards. */
const OFFICIAL_CAP = 24;

/** Registry products that match the search; none without text. */
export async function searchOfficialCatalog(
  repo: MedicineCatalogRepository,
  em: EntityManager,
  query: string | undefined,
  outcome: SearchOutcome,
): Promise<PublicOfficialMedicineDto[]> {
  if (query === undefined || normalize(query).length < 2) return [];
  const text = (outcome.correctedQuery ?? query).slice(0, 100).trim();
  const matches = [...(outcome.matches?.values() ?? [])];
  // A symptom search («dolor abdominal») goes by ATC group; a name, by text.
  const prefixes = useAtcPrefixes(text);
  const byUse =
    prefixes.length > 0 && matches.every((m) => m.matchedBy === 'use');
  const products = byUse
    ? await repo.searchByAtcPrefixes(em, prefixes, OFFICIAL_CAP)
    : (await repo.search(em, { text, limit: OFFICIAL_CAP })).items;
  return products.map((product) => ({
    id: product.id,
    name: product.display,
    holder: product.holder,
    strengthText: product.strengthText,
    dosageForm: product.dosageForm,
    sourceName: product.sourceName,
    atc: product.atc,
    uses: usesOf(product.atc[0] ?? null),
    requiresPrescription: product.requiresPrescription,
  }));
}
