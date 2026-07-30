import { describe, it, expect, jest } from '@jest/globals';
import { TerminologyTenantCatalogController } from './terminology-tenant-catalog.controller';
import { type AuthenticatedUser } from '../../../common';

const user: AuthenticatedUser = { id: 'actor-1', roles: ['SECURITY_ADMIN'] };

describe('TerminologyTenantCatalogController', () => {
  /**
   * Construye el sistema bajo prueba con dependencias controladas.
   * @returns Resultado de build.
   */
  function build() {
    const service = { upsertPolicy: jest.fn() } as any;
    const controller = new TerminologyTenantCatalogController(service);
    return { controller, service };
  }

  it('upsertPolicy delega con el id de tenant', async () => {
    const { controller, service } = build();
    const dto = { valueSetId: 'vs-1' };
    const expected = {
      id: 'p-1',
      tenantId: 't-1',
      valueSetId: 'vs-1',
      conceptsCreated: 0,
      conceptsUpdated: 0,
      updated: false,
    };
    service.upsertPolicy.mockResolvedValue(expected);

    const result = await controller.upsertPolicy('t-1', dto, user);

    expect(service.upsertPolicy).toHaveBeenCalledWith('t-1', dto, user);
    expect(result).toBe(expected);
  });
});
