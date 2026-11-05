/**
 * Applies {@link searchDocs} to the patient store (`GET /pharmacy/products`):
 * one document per product, with the vademécum concept's name and ATC code
 * so «dolor abdominal» and «ibopofeno» find products as well.
 */
import type { EntityManager } from '@mikro-orm/postgresql';
import type { PharmacyProducts } from '../entities';
import type {
  PharmacyReadRepository,
  ProductSearchFilter,
} from '../repositories';
import { searchDocs, type SearchDoc } from './medication-matcher';

/**
 * Candidates read before matching in memory. A network's active catalog is
 * products, not events: thousands at most.
 */
const CANDIDATE_CAP = 5000;

/** The products that match, best first, and the corrected text if any. */
export async function searchProductRows(
  repo: PharmacyReadRepository,
  em: EntityManager,
  pharmacyIds: readonly string[],
  filter: ProductSearchFilter & { exact?: boolean },
  limit: number,
): Promise<{ rows: PharmacyProducts[]; correctedQuery: string | null }> {
  const term = filter.search?.trim();
  if (!term) {
    return {
      rows: await repo.findActiveProducts(em, pharmacyIds, filter, limit),
      correctedQuery: null,
    };
  }
  const candidates = await repo.findActiveProducts(
    em,
    pharmacyIds,
    { conceptId: filter.conceptId },
    CANDIDATE_CAP,
  );
  const conceptIds = [
    ...new Set(
      candidates
        .map((row) => row.medicationConceptId)
        .filter((id): id is string => !!id),
    ),
  ];
  const concepts = new Map(
    (await repo.findConcepts(em, conceptIds)).map((concept) => [
      concept.id,
      concept,
    ]),
  );
  const docs: SearchDoc[] = candidates.map((row) => {
    const concept = row.medicationConceptId
      ? concepts.get(row.medicationConceptId)
      : undefined;
    return {
      key: row.id,
      names: [row.genericName ?? null, concept?.display ?? null],
      brands: [row.brandName ?? null],
      codes: [row.productCode ?? null, concept?.code ?? null],
      atc: concept?.code ?? null,
    };
  });
  const { matches, correctedQuery } = searchDocs(
    docs,
    term,
    filter.exact === true,
  );
  const score = (row: PharmacyProducts) => matches?.get(row.id)?.score ?? 0;
  const rows = candidates
    .filter((row) => matches === null || matches.has(row.id))
    .sort((a, b) => score(b) - score(a))
    .slice(0, limit);
  return { rows, correctedQuery };
}
