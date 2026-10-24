import { jest } from '@jest/globals';
import { PRAC } from '../practice.concepts';
import { PracticeTenantLookupService } from './practice-tenant-lookup.service';

describe('PracticeTenantLookupService', () => {
  it('expone una proyección mínima sin filtrar la entidad a otros dominios', async () => {
    const em = { fork: jest.fn().mockReturnValue({}) };
    const findActive = jest
      .fn<
        (
          entityManager: unknown,
          status: string,
        ) => Promise<Array<{ id: string; tenantId: string; name: string }>>
      >()
      .mockResolvedValue([
        { id: 'practice-1', tenantId: 'tenant-1', name: 'Clínica' },
      ]);
    const findActiveByPractitioner = jest.fn();
    const service = new PracticeTenantLookupService(
      em as never,
      { findActive } as never,
      { findActiveByPractitioner } as never,
    );

    await expect(service.findActive('active')).resolves.toEqual([
      { id: 'practice-1', tenantId: 'tenant-1' },
    ]);
    expect(findActive).toHaveBeenCalledWith(em, 'active');
  });

  it('Carril 18: resuelve las prácticas donde el profesional tiene una vinculación ACTIVE vigente, sin repetidos', async () => {
    const forkedEm = {};
    const em = { fork: jest.fn().mockReturnValue(forkedEm) };
    const findActiveByPractitioner = jest
      .fn<
        (
          entityManager: unknown,
          practitionerProfileId: string,
          activeStatusConceptId: string,
        ) => Promise<Array<{ practiceId: string }>>
      >()
      .mockResolvedValue([
        { practiceId: 'practice-1' },
        { practiceId: 'practice-1' },
        { practiceId: 'practice-2' },
      ]);
    const service = new PracticeTenantLookupService(
      em as never,
      {} as never,
      { findActiveByPractitioner } as never,
    );

    await expect(
      service.findActivePracticeIdsForPractitioner('practitioner-1'),
    ).resolves.toEqual(['practice-1', 'practice-2']);
    expect(findActiveByPractitioner).toHaveBeenCalledWith(
      forkedEm,
      'practitioner-1',
      expect.any(String),
    );
  });

  describe('isOwnOffice (v4.2.40)', () => {
    /** Una práctica con el tipo y el administrador que se le indiquen. */
    function withPractice(practice: Record<string, unknown> | null) {
      const em = { fork: jest.fn().mockReturnValue({}) };
      const findById = jest
        .fn<(...args: unknown[]) => Promise<unknown>>()
        .mockResolvedValue(practice);
      const service = new PracticeTenantLookupService(
        em as never,
        { findById } as never,
        {} as never,
      );
      return { service, findById };
    }

    it('es verdadero sólo para la práctica personal (OFFICE) que el usuario administra', async () => {
      const { service } = withPractice({
        adminUserId: 'u-1',
        typeConceptId: PRAC.PRACTICE_TYPE_OFFICE,
      });

      await expect(service.isOwnOffice('p-1', 'u-1')).resolves.toBe(true);
    });

    it('no lo es si la administra otro usuario', async () => {
      const { service } = withPractice({
        adminUserId: 'u-2',
        typeConceptId: PRAC.PRACTICE_TYPE_OFFICE,
      });

      await expect(service.isOwnOffice('p-1', 'u-1')).resolves.toBe(false);
    });

    it('no lo es si es una organización aunque el usuario figure como administrador', async () => {
      const { service } = withPractice({
        adminUserId: 'u-1',
        typeConceptId: 'otro-tipo-de-practica',
      });

      await expect(service.isOwnOffice('p-1', 'u-1')).resolves.toBe(false);
    });

    it('una práctica que no existe responde falso, igual que una ajena', async () => {
      const { service } = withPractice(null);

      await expect(service.isOwnOffice('inventada', 'u-1')).resolves.toBe(
        false,
      );
    });
  });
});
