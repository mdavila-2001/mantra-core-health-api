import { jest } from '@jest/globals';
import { ReferralsRepository } from './referrals.repository';
import { Referrals } from '../entities';
import { CEXT } from '../clinical_ext.concepts';

const mockFn = (impl?: any): any => (jest.fn as any)(impl);

/**
 * Sin base de datos en las pruebas unitarias, se fija el WHERE con el que
 * `findDuplicate` busca la derivación equivalente, y se evalúa contra filas en
 * memoria con la semántica de igualdad de MikroORM (`null` ↔ `IS NULL`, `$or`).
 */
function build() {
  const findOne = mockFn(() => Promise.resolve(null));
  const em: any = { findOne };
  return { repo: new ReferralsRepository(), em, findOne };
}

/** ¿La fila satisface el filtro? Igualdad campo a campo y `$or`. */
function matches(row: Record<string, unknown>, where: any): boolean {
  return Object.entries(where).every(([key, value]) =>
    key === '$or'
      ? (value as any[]).some((branch) => matches(row, branch))
      : (row[key] ?? null) === value,
  );
}

describe('ReferralsRepository.findDuplicate', () => {
  const consultation = {
    sourceEncounterId: 'e1',
    targetProfileId: null,
    targetServiceCatalogId: 'svc-1',
    specialtyConceptId: null,
    referralTypeConceptId: CEXT.REFERRAL_TYPE_CONSULTATION,
  };

  it('el mismo servicio desde el mismo encuentro con OTRO tipo no es duplicado', async () => {
    const d = build();

    await d.repo.findDuplicate(d.em, {
      sourceEncounterId: 'e1',
      referralTypeConceptId: CEXT.REFERRAL_TYPE_TREATMENT,
      treatNullTypeAsSame: false,
      targetServiceCatalogId: 'svc-1',
    });

    const [entity, where] = d.findOne.mock.calls[0];
    expect(entity).toBe(Referrals);
    expect(where).toEqual({
      sourceEncounterId: 'e1',
      referralTypeConceptId: CEXT.REFERRAL_TYPE_TREATMENT,
      targetServiceCatalogId: 'svc-1',
      targetProfileId: null,
    });
    expect(matches(consultation, where)).toBe(false);
  });

  it('el mismo servicio con el MISMO tipo sí es duplicado', async () => {
    const d = build();

    await d.repo.findDuplicate(d.em, {
      sourceEncounterId: 'e1',
      referralTypeConceptId: CEXT.REFERRAL_TYPE_CONSULTATION,
      treatNullTypeAsSame: true,
      targetServiceCatalogId: 'svc-1',
    });

    const [, where] = d.findOne.mock.calls[0];
    expect(matches(consultation, where)).toBe(true);
    // Una derivación previa sin tipo cuenta como CONSULTATION.
    expect(
      matches({ ...consultation, referralTypeConceptId: null }, where),
    ).toBe(true);
  });
});
