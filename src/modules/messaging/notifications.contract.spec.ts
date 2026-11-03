import {
  NOTIFICATION_CATEGORIES,
  NOTIFICATION_CATEGORY_BY_CONCEPT,
  NOTIFICATION_CATEGORY_CONCEPT,
} from './notifications.contract';
import { PROF } from '../profiles/profiles.concepts';

describe('contrato de categorías de aviso', () => {
  it('ADMISSION está registrada con un nombre estable y respaldada por el concepto de aviso de admisión', () => {
    expect(NOTIFICATION_CATEGORIES).toContain('ADMISSION');
    expect(NOTIFICATION_CATEGORY_CONCEPT.ADMISSION).toBe(PROF.NOTICE_ADMISSION);
    expect(NOTIFICATION_CATEGORY_BY_CONCEPT.get(PROF.NOTICE_ADMISSION)).toBe(
      'ADMISSION',
    );
  });

  it('cada categoría tiene su propio concepto y vuelve a sí misma', () => {
    const concepts = NOTIFICATION_CATEGORIES.map(
      (category) => NOTIFICATION_CATEGORY_CONCEPT[category],
    );
    expect(new Set(concepts).size).toBe(NOTIFICATION_CATEGORIES.length);
    for (const category of NOTIFICATION_CATEGORIES) {
      expect(
        NOTIFICATION_CATEGORY_BY_CONCEPT.get(
          NOTIFICATION_CATEGORY_CONCEPT[category],
        ),
      ).toBe(category);
    }
  });
});
