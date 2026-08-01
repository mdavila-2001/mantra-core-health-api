import { jest } from '@jest/globals';
import { PracticeTenantLookupService } from './practice-tenant-lookup.service';

describe('PracticeTenantLookupService', () => {
  it('expone una proyección mínima sin filtrar la entidad a otros dominios', async () => {
    const em = {};
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
    const service = new PracticeTenantLookupService(
      em as never,
      { findActive } as never,
    );

    await expect(service.findActive('active')).resolves.toEqual([
      { id: 'practice-1', tenantId: 'tenant-1' },
    ]);
    expect(findActive).toHaveBeenCalledWith(em, 'active');
  });
});
