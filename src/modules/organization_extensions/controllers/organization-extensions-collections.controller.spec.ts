import { describe, it, expect, jest } from '@jest/globals';
import { ROLES_KEY } from '../../../common/auth/roles.decorator';
import { OrganizationExtensionsCollectionsController } from './organization-extensions-collections.controller';

const handlers =
  OrganizationExtensionsCollectionsController.prototype as unknown as Record<
    string,
    object
  >;

describe('OrganizationExtensionsCollectionsController', () => {
  it('listFacilityLicenses exige SECURITY_ADMIN y delega en el servicio', async () => {
    expect(
      Reflect.getMetadata(ROLES_KEY, handlers.listFacilityLicenses),
    ).toEqual(['SECURITY_ADMIN']);
    const page = {
      data: [],
      meta: { page: 1, pageSize: 20, total: 0, totalPages: 0 },
    };
    const service = {
      listFacilityLicenses: jest.fn(async (..._args: unknown[]) => page),
    };
    const controller = new OrganizationExtensionsCollectionsController(
      service as any,
    );
    const query = { page: 1, pageSize: 20 } as any;
    await expect(controller.listFacilityLicenses(query)).resolves.toBe(page);
    expect(service.listFacilityLicenses).toHaveBeenCalledWith(query);
  });

  it('listHospitals exige SECURITY_ADMIN y delega en el servicio', async () => {
    expect(Reflect.getMetadata(ROLES_KEY, handlers.listHospitals)).toEqual([
      'SECURITY_ADMIN',
    ]);
    const page = {
      data: [],
      meta: { page: 1, pageSize: 20, total: 0, totalPages: 0 },
    };
    const service = {
      listHospitals: jest.fn(async (..._args: unknown[]) => page),
    };
    const controller = new OrganizationExtensionsCollectionsController(
      service as any,
    );
    const query = { page: 1, pageSize: 20 } as any;
    await expect(controller.listHospitals(query)).resolves.toBe(page);
    expect(service.listHospitals).toHaveBeenCalledWith(query);
  });

  it('listDataBoundaries exige SECURITY_ADMIN y delega en el servicio', async () => {
    expect(Reflect.getMetadata(ROLES_KEY, handlers.listDataBoundaries)).toEqual(
      ['SECURITY_ADMIN'],
    );
    const page = {
      data: [],
      meta: { page: 1, pageSize: 20, total: 0, totalPages: 0 },
    };
    const service = {
      listDataBoundaries: jest.fn(async (..._args: unknown[]) => page),
    };
    const controller = new OrganizationExtensionsCollectionsController(
      service as any,
    );
    const query = { page: 1, pageSize: 20 } as any;
    await expect(controller.listDataBoundaries(query)).resolves.toBe(page);
    expect(service.listDataBoundaries).toHaveBeenCalledWith(query);
  });
});
