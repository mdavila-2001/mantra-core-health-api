import { describe, it, expect, jest } from '@jest/globals';
import { ROLES_KEY } from '../../../common/auth/roles.decorator';
import { ClinicalExtCollectionsController } from './clinical-ext-collections.controller';

const handlers =
  ClinicalExtCollectionsController.prototype as unknown as Record<
    string,
    object
  >;

describe('ClinicalExtCollectionsController', () => {
  it('listCdsRules exige SECURITY_ADMIN y delega en el servicio', async () => {
    expect(Reflect.getMetadata(ROLES_KEY, handlers.listCdsRules)).toEqual([
      'SECURITY_ADMIN',
    ]);
    const page = {
      data: [],
      meta: { page: 1, pageSize: 20, total: 0, totalPages: 0 },
    };
    const service = {
      listCdsRules: jest.fn(async (..._args: unknown[]) => page),
    };
    const controller = new ClinicalExtCollectionsController(service as any);
    const query = { page: 1, pageSize: 20 } as any;
    await expect(controller.listCdsRules(query)).resolves.toBe(page);
    expect(service.listCdsRules).toHaveBeenCalledWith(query);
  });

  it('listOrderSets exige SECURITY_ADMIN y delega en el servicio', async () => {
    expect(Reflect.getMetadata(ROLES_KEY, handlers.listOrderSets)).toEqual([
      'SECURITY_ADMIN',
    ]);
    const page = {
      data: [],
      meta: { page: 1, pageSize: 20, total: 0, totalPages: 0 },
    };
    const service = {
      listOrderSets: jest.fn(async (..._args: unknown[]) => page),
    };
    const controller = new ClinicalExtCollectionsController(service as any);
    const query = { page: 1, pageSize: 20 } as any;
    await expect(controller.listOrderSets(query)).resolves.toBe(page);
    expect(service.listOrderSets).toHaveBeenCalledWith(query);
  });

  it('listImmunizationSchedules exige SECURITY_ADMIN y delega en el servicio', async () => {
    expect(
      Reflect.getMetadata(ROLES_KEY, handlers.listImmunizationSchedules),
    ).toEqual(['SECURITY_ADMIN']);
    const page = {
      data: [],
      meta: { page: 1, pageSize: 20, total: 0, totalPages: 0 },
    };
    const service = {
      listImmunizationSchedules: jest.fn(async (..._args: unknown[]) => page),
    };
    const controller = new ClinicalExtCollectionsController(service as any);
    const query = { page: 1, pageSize: 20 } as any;
    await expect(controller.listImmunizationSchedules(query)).resolves.toBe(
      page,
    );
    expect(service.listImmunizationSchedules).toHaveBeenCalledWith(query);
  });
});
