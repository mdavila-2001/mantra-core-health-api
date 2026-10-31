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

  it('servicio: una fila sin tipo cuenta como CONSULTATION y no choca con otro tipo', async () => {
    const d = build();

    await d.repo.findDuplicate(d.em, {
      sourceEncounterId: 'e1',
      referralTypeConceptId: CEXT.REFERRAL_TYPE_TREATMENT,
      treatNullTypeAsSame: false,
      targetServiceCatalogId: 'svc-1',
    });

    const [, where] = d.findOne.mock.calls[0];
    expect(
      matches({ ...consultation, referralTypeConceptId: null }, where),
    ).toBe(false);
  });

  describe('derivación sólo a la organización (sin profesional ni servicio)', () => {
    const orgConsultation = {
      sourceEncounterId: 'e1',
      targetTenantId: 'ten-1',
      targetProfileId: null,
      targetServiceCatalogId: null,
      specialtyConceptId: null,
      referralTypeConceptId: CEXT.REFERRAL_TYPE_CONSULTATION,
    };

    async function whereFor(type: string, treatNullTypeAsSame: boolean) {
      const d = build();
      await d.repo.findDuplicate(d.em, {
        sourceEncounterId: 'e1',
        referralTypeConceptId: type,
        treatNullTypeAsSame,
        targetTenantId: 'ten-1',
      });
      const [entity, where] = d.findOne.mock.calls[0];
      expect(entity).toBe(Referrals);
      return where;
    }

    it('compara encuentro, organización y tipo, sin profesional ni servicio', async () => {
      const where = await whereFor(CEXT.REFERRAL_TYPE_TREATMENT, false);

      expect(where).toEqual({
        sourceEncounterId: 'e1',
        referralTypeConceptId: CEXT.REFERRAL_TYPE_TREATMENT,
        targetTenantId: 'ten-1',
        targetProfileId: null,
        targetServiceCatalogId: null,
      });
    });

    it('la misma organización con OTRO tipo no es duplicado', async () => {
      const where = await whereFor(CEXT.REFERRAL_TYPE_TREATMENT, false);

      expect(matches(orgConsultation, where)).toBe(false);
    });

    it('la misma organización con el MISMO tipo sí es duplicado; sin tipo cuenta como CONSULTATION', async () => {
      const where = await whereFor(CEXT.REFERRAL_TYPE_CONSULTATION, true);

      expect(matches(orgConsultation, where)).toBe(true);
      expect(
        matches({ ...orgConsultation, referralTypeConceptId: null }, where),
      ).toBe(true);
    });

    it('otra organización, o una fila con profesional o con servicio, no es duplicado', async () => {
      const where = await whereFor(CEXT.REFERRAL_TYPE_CONSULTATION, true);

      expect(
        matches({ ...orgConsultation, targetTenantId: 'ten-2' }, where),
      ).toBe(false);
      expect(
        matches({ ...orgConsultation, targetProfileId: 'hp-1' }, where),
      ).toBe(false);
      expect(
        matches({ ...orgConsultation, targetServiceCatalogId: 'svc-1' }, where),
      ).toBe(false);
    });
  });
});
