import { jest } from '@jest/globals';
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
});
