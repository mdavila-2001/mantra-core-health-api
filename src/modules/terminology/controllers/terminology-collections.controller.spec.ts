import { describe, it, expect, jest } from '@jest/globals';
import { ROLES_KEY } from '../../../common/auth/roles.decorator';
import { TerminologyCollectionsController } from './terminology-collections.controller';

const handlers =
  TerminologyCollectionsController.prototype as unknown as Record<
    string,
    object
  >;

describe('TerminologyCollectionsController', () => {
  it('listCatalogPolicies exige SECURITY_ADMIN y delega en el servicio', async () => {
    expect(
      Reflect.getMetadata(ROLES_KEY, handlers.listCatalogPolicies),
    ).toEqual(['SECURITY_ADMIN']);
    const page = {
      data: [],
      meta: { page: 1, pageSize: 20, total: 0, totalPages: 0 },
    };
    const service = {
      listCatalogPolicies: jest.fn(async (..._args: unknown[]) => page),
    };
    const controller = new TerminologyCollectionsController(service as any);
    const query = { page: 1, pageSize: 20 } as any;
    await expect(
      controller.listCatalogPolicies('tenantId-1', query),
    ).resolves.toBe(page);
    expect(service.listCatalogPolicies).toHaveBeenCalledWith(
      'tenantId-1',
      query,
    );
  });
});
