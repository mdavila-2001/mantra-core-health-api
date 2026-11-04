import { DUNIT } from '../../diagnostic_units/diagnostic_units.concepts';
import { categoryBuckets } from './lab-portal-category-buckets';

const offering = (status: string, serviceCategoryId?: string): any => ({
  statusConceptId: status,
  serviceCategoryId,
});
const category = (id: string, name: string): any => ({ id, name });

describe('categoryBuckets', () => {
  it('groups current services by category, biggest first, then by name', () => {
    const buckets = categoryBuckets(
      [
        offering(DUNIT.OFFERING_ACTIVE, 'b'),
        offering(DUNIT.OFFERING_DRAFT, 'a'),
        offering(DUNIT.OFFERING_ACTIVE, 'c'),
        offering(DUNIT.OFFERING_ACTIVE, 'c'),
        offering(DUNIT.OFFERING_ACTIVE),
      ],
      [
        category('a', 'Química'),
        category('b', 'Hematología'),
        category('c', 'Orina'),
      ],
    );
    expect(buckets).toEqual([
      { categoryId: 'c', category: 'Orina', count: 2 },
      { categoryId: 'b', category: 'Hematología', count: 1 },
      { categoryId: 'a', category: 'Química', count: 1 },
      { categoryId: null, category: 'Sin categoría', count: 1 },
    ]);
  });

  it('skips withdrawn services and files an unknown category under «Sin categoría»', () => {
    expect(
      categoryBuckets(
        [
          offering(DUNIT.OFFERING_RETIRED, 'a'),
          offering(DUNIT.OFFERING_ACTIVE, 'gone'),
        ],
        [category('a', 'Química')],
      ),
    ).toEqual([{ categoryId: null, category: 'Sin categoría', count: 1 }]);
    expect(categoryBuckets([], [])).toEqual([]);
  });
});
