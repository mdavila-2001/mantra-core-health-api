import {
  analysisCategoryOf,
  categoryConceptIdFor,
} from './service-request-category';
import { CLIN } from './clinical.concepts';
import { DIAG } from '../diagnostics/diagnostics.concepts';

describe('service-request-category (P40)', () => {
  it('cada categoría textual vuelve a sí misma a través de su concepto', () => {
    for (const category of ['LAB', 'IMAGING', 'OTHER'] as const) {
      expect(analysisCategoryOf(categoryConceptIdFor(category))).toBe(category);
    }
  });

  it('imagen se escribe con el concepto que lee el circuito diagnóstico', () => {
    expect(categoryConceptIdFor('IMAGING')).toBe(
      DIAG.SERVICE_REQUEST_CATEGORY_IMAGING,
    );
  });

  it('los dos conceptos de imagen se leen como IMAGING', () => {
    expect(analysisCategoryOf(CLIN.SERVICE_REQUEST_CATEGORY_IMAGING)).toBe(
      'IMAGING',
    );
    expect(analysisCategoryOf(DIAG.SERVICE_REQUEST_CATEGORY_IMAGING)).toBe(
      'IMAGING',
    );
  });

  it.each([
    CLIN.SERVICE_REQUEST_CATEGORY_PROCEDURE,
    CLIN.SERVICE_REQUEST_CATEGORY_CARDIO,
    CLIN.SERVICE_REQUEST_CATEGORY_PATHOLOGY,
  ])('otra categoría declarada (%s) es OTHER', (conceptId) => {
    expect(analysisCategoryOf(conceptId)).toBe('OTHER');
  });

  it('sin concepto no hay categoría', () => {
    expect(analysisCategoryOf(undefined)).toBeUndefined();
    expect(analysisCategoryOf(null)).toBeUndefined();
  });

  it('SR_OTHER es un concepto propio, distinto de los demás', () => {
    const others = [
      CLIN.SERVICE_REQUEST_CATEGORY_LAB,
      CLIN.SERVICE_REQUEST_CATEGORY_IMAGING,
      CLIN.SERVICE_REQUEST_CATEGORY_PROCEDURE,
    ];
    expect(others).not.toContain(CLIN.SERVICE_REQUEST_CATEGORY_OTHER);
  });
});
