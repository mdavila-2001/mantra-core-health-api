import { describe, it, expect, jest } from '@jest/globals';
import { GUARDS_METADATA } from '@nestjs/common/constants';
import { ROLES_KEY } from '../../../common/auth/roles.decorator';
import { ClinicalCollectionsController } from './clinical-collections.controller';
import { ClinicalRecordAccessGuard } from '../guards';

const handlers = ClinicalCollectionsController.prototype as unknown as Record<
  string,
  object
>;

describe('ClinicalCollectionsController', () => {
  it('listDiagnosticReports exige CLINICIAN, PRACTITIONER y delega en el servicio', async () => {
    expect(
      Reflect.getMetadata(ROLES_KEY, handlers.listDiagnosticReports),
    ).toEqual(['CLINICIAN', 'PRACTITIONER']);
    expect(
      Reflect.getMetadata(GUARDS_METADATA, handlers.listDiagnosticReports),
    ).toContain(ClinicalRecordAccessGuard);
    const page = {
      data: [],
      meta: { page: 1, pageSize: 20, total: 0, totalPages: 0 },
    };
    const service = {
      listDiagnosticReports: jest.fn(async (..._args: unknown[]) => page),
    };
    const controller = new ClinicalCollectionsController(service as any);
    const query = { page: 1, pageSize: 20 } as any;
    await expect(
      controller.listDiagnosticReports('patientProfileId-1', query),
    ).resolves.toBe(page);
    expect(service.listDiagnosticReports).toHaveBeenCalledWith(
      'patientProfileId-1',
      query,
    );
  });

  it('listImmunizations exige CLINICIAN, PRACTITIONER y delega en el servicio', async () => {
    expect(Reflect.getMetadata(ROLES_KEY, handlers.listImmunizations)).toEqual([
      'CLINICIAN',
      'PRACTITIONER',
    ]);
    expect(
      Reflect.getMetadata(GUARDS_METADATA, handlers.listImmunizations),
    ).toContain(ClinicalRecordAccessGuard);
    const page = {
      data: [],
      meta: { page: 1, pageSize: 20, total: 0, totalPages: 0 },
    };
    const service = {
      listImmunizations: jest.fn(async (..._args: unknown[]) => page),
    };
    const controller = new ClinicalCollectionsController(service as any);
    const query = { page: 1, pageSize: 20 } as any;
    await expect(
      controller.listImmunizations('patientProfileId-1', query),
    ).resolves.toBe(page);
    expect(service.listImmunizations).toHaveBeenCalledWith(
      'patientProfileId-1',
      query,
    );
  });

  it('listMedicationRecords exige CLINICIAN, PRACTITIONER y delega en el servicio', async () => {
    expect(
      Reflect.getMetadata(ROLES_KEY, handlers.listMedicationRecords),
    ).toEqual(['CLINICIAN', 'PRACTITIONER']);
    expect(
      Reflect.getMetadata(GUARDS_METADATA, handlers.listMedicationRecords),
    ).toContain(ClinicalRecordAccessGuard);
    const page = {
      data: [],
      meta: { page: 1, pageSize: 20, total: 0, totalPages: 0 },
    };
    const service = {
      listMedicationRecords: jest.fn(async (..._args: unknown[]) => page),
    };
    const controller = new ClinicalCollectionsController(service as any);
    const query = { page: 1, pageSize: 20 } as any;
    await expect(
      controller.listMedicationRecords('patientProfileId-1', query),
    ).resolves.toBe(page);
    expect(service.listMedicationRecords).toHaveBeenCalledWith(
      'patientProfileId-1',
      query,
    );
  });

  it('listProcedures exige CLINICIAN, PRACTITIONER y delega en el servicio', async () => {
    expect(Reflect.getMetadata(ROLES_KEY, handlers.listProcedures)).toEqual([
      'CLINICIAN',
      'PRACTITIONER',
    ]);
    expect(
      Reflect.getMetadata(GUARDS_METADATA, handlers.listProcedures),
    ).toContain(ClinicalRecordAccessGuard);
    const page = {
      data: [],
      meta: { page: 1, pageSize: 20, total: 0, totalPages: 0 },
    };
    const service = {
      listProcedures: jest.fn(async (..._args: unknown[]) => page),
    };
    const controller = new ClinicalCollectionsController(service as any);
    const query = { page: 1, pageSize: 20 } as any;
    await expect(
      controller.listProcedures('patientProfileId-1', query),
    ).resolves.toBe(page);
    expect(service.listProcedures).toHaveBeenCalledWith(
      'patientProfileId-1',
      query,
    );
  });

  it('listServiceRequests exige CLINICIAN, PRACTITIONER y delega en el servicio', async () => {
    expect(
      Reflect.getMetadata(ROLES_KEY, handlers.listServiceRequests),
    ).toEqual(['CLINICIAN', 'PRACTITIONER']);
    expect(
      Reflect.getMetadata(GUARDS_METADATA, handlers.listServiceRequests),
    ).toContain(ClinicalRecordAccessGuard);
    const page = {
      data: [],
      meta: { page: 1, pageSize: 20, total: 0, totalPages: 0 },
    };
    const service = {
      listServiceRequests: jest.fn(async (..._args: unknown[]) => page),
    };
    const controller = new ClinicalCollectionsController(service as any);
    const query = { page: 1, pageSize: 20 } as any;
    await expect(
      controller.listServiceRequests('patientProfileId-1', query),
    ).resolves.toBe(page);
    expect(service.listServiceRequests).toHaveBeenCalledWith(
      'patientProfileId-1',
      query,
    );
  });
});
