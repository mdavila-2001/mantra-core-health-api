import { describe, it, expect, jest } from '@jest/globals';
import { ROLES_KEY } from '../../../common/auth/roles.decorator';
import { ConsentCollectionsController } from './consent-collections.controller';

const handlers = ConsentCollectionsController.prototype as unknown as Record<
  string,
  object
>;

describe('ConsentCollectionsController', () => {
  it('listConsents exige SECURITY_ADMIN y delega en el servicio', async () => {
    expect(Reflect.getMetadata(ROLES_KEY, handlers.listConsents)).toEqual([
      'SECURITY_ADMIN',
    ]);
    const page = {
      data: [],
      meta: { page: 1, pageSize: 20, total: 0, totalPages: 0 },
    };
    const service = {
      listConsents: jest.fn(async (..._args: unknown[]) => page),
    };
    const controller = new ConsentCollectionsController(service as any);
    const query = { page: 1, pageSize: 20 } as any;
    await expect(controller.listConsents(query)).resolves.toBe(page);
    expect(service.listConsents).toHaveBeenCalledWith(query);
  });

  it('listHipaaAuthorizations exige SECURITY_ADMIN y delega en el servicio', async () => {
    expect(
      Reflect.getMetadata(ROLES_KEY, handlers.listHipaaAuthorizations),
    ).toEqual(['SECURITY_ADMIN']);
    const page = {
      data: [],
      meta: { page: 1, pageSize: 20, total: 0, totalPages: 0 },
    };
    const service = {
      listHipaaAuthorizations: jest.fn(async (..._args: unknown[]) => page),
    };
    const controller = new ConsentCollectionsController(service as any);
    const query = { page: 1, pageSize: 20 } as any;
    await expect(controller.listHipaaAuthorizations(query)).resolves.toBe(page);
    expect(service.listHipaaAuthorizations).toHaveBeenCalledWith(query);
  });

  it('listPatientObjections exige SECURITY_ADMIN y delega en el servicio', async () => {
    expect(
      Reflect.getMetadata(ROLES_KEY, handlers.listPatientObjections),
    ).toEqual(['SECURITY_ADMIN']);
    const page = {
      data: [],
      meta: { page: 1, pageSize: 20, total: 0, totalPages: 0 },
    };
    const service = {
      listPatientObjections: jest.fn(async (..._args: unknown[]) => page),
    };
    const controller = new ConsentCollectionsController(service as any);
    const query = { page: 1, pageSize: 20 } as any;
    await expect(controller.listPatientObjections(query)).resolves.toBe(page);
    expect(service.listPatientObjections).toHaveBeenCalledWith(query);
  });

  it('listPrivacyRestrictions exige SECURITY_ADMIN y delega en el servicio', async () => {
    expect(
      Reflect.getMetadata(ROLES_KEY, handlers.listPrivacyRestrictions),
    ).toEqual(['SECURITY_ADMIN']);
    const page = {
      data: [],
      meta: { page: 1, pageSize: 20, total: 0, totalPages: 0 },
    };
    const service = {
      listPrivacyRestrictions: jest.fn(async (..._args: unknown[]) => page),
    };
    const controller = new ConsentCollectionsController(service as any);
    const query = { page: 1, pageSize: 20 } as any;
    await expect(controller.listPrivacyRestrictions(query)).resolves.toBe(page);
    expect(service.listPrivacyRestrictions).toHaveBeenCalledWith(query);
  });

  it('listProcessingLegalBases exige SECURITY_ADMIN y delega en el servicio', async () => {
    expect(
      Reflect.getMetadata(ROLES_KEY, handlers.listProcessingLegalBases),
    ).toEqual(['SECURITY_ADMIN']);
    const page = {
      data: [],
      meta: { page: 1, pageSize: 20, total: 0, totalPages: 0 },
    };
    const service = {
      listProcessingLegalBases: jest.fn(async (..._args: unknown[]) => page),
    };
    const controller = new ConsentCollectionsController(service as any);
    const query = { page: 1, pageSize: 20 } as any;
    await expect(controller.listProcessingLegalBases(query)).resolves.toBe(
      page,
    );
    expect(service.listProcessingLegalBases).toHaveBeenCalledWith(query);
  });

  it('listTreatmentInformedConsents exige SECURITY_ADMIN y delega en el servicio', async () => {
    expect(
      Reflect.getMetadata(ROLES_KEY, handlers.listTreatmentInformedConsents),
    ).toEqual(['SECURITY_ADMIN']);
    const page = {
      data: [],
      meta: { page: 1, pageSize: 20, total: 0, totalPages: 0 },
    };
    const service = {
      listTreatmentInformedConsents: jest.fn(
        async (..._args: unknown[]) => page,
      ),
    };
    const controller = new ConsentCollectionsController(service as any);
    const query = { page: 1, pageSize: 20 } as any;
    await expect(controller.listTreatmentInformedConsents(query)).resolves.toBe(
      page,
    );
    expect(service.listTreatmentInformedConsents).toHaveBeenCalledWith(query);
  });
});
