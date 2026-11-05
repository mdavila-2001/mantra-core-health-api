import { DUNIT } from '../../diagnostic_units/diagnostic_units.concepts';
import type {
  DiagnosticServiceCategories,
  DiagnosticStudyOfferings,
} from '../../diagnostic_units/entities';
import type { LabCategoryCountDto } from '../dto/lab-portal-summary.dto';

/** Name of the bucket that groups the services without a category. */
export const NO_CATEGORY = 'Sin categoría';

/**
 * Current (not withdrawn) services of the lab grouped by category, biggest
 * first and by name on a tie. Services without a category, or whose category
 * is gone, fall in the «Sin categoría» bucket.
 */
export function categoryBuckets(
  offerings: readonly DiagnosticStudyOfferings[],
  categories: readonly DiagnosticServiceCategories[],
): LabCategoryCountDto[] {
  const names = new Map(categories.map((c) => [c.id, c.name]));
  const buckets = new Map<string, LabCategoryCountDto>();
  for (const offering of offerings) {
    if (offering.statusConceptId === DUNIT.OFFERING_RETIRED) continue;
    const id = offering.serviceCategoryId;
    const name = (id ? names.get(id) : undefined) ?? NO_CATEGORY;
    const key = id && names.has(id) ? id : '';
    const bucket = buckets.get(key) ?? {
      categoryId: key === '' ? null : key,
      category: name,
      count: 0,
    };
    bucket.count += 1;
    buckets.set(key, bucket);
  }
  return [...buckets.values()].sort(
    (a, b) => b.count - a.count || a.category.localeCompare(b.category, 'es'),
  );
}
