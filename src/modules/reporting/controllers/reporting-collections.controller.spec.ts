import { describe, it, expect, jest } from '@jest/globals';
import { ROLES_KEY } from '../../../common/auth/roles.decorator';
import { ReportingCollectionsController } from './reporting-collections.controller';

const handlers = ReportingCollectionsController.prototype as unknown as Record<
  string,
  object
>;

describe('ReportingCollectionsController', () => {
  it('listDefinitions exige REPORTING_ADMIN, REPORT_AUTHOR y delega en el servicio', async () => {
    expect(Reflect.getMetadata(ROLES_KEY, handlers.listDefinitions)).toEqual([
      'REPORTING_ADMIN',
      'REPORT_AUTHOR',
    ]);
    const page = {
      data: [],
      meta: { page: 1, pageSize: 20, total: 0, totalPages: 0 },
    };
    const service = {
      listDefinitions: jest.fn(async (..._args: unknown[]) => page),
    };
    const controller = new ReportingCollectionsController(service as any);
    const query = { page: 1, pageSize: 20 } as any;
    await expect(controller.listDefinitions(query)).resolves.toBe(page);
    expect(service.listDefinitions).toHaveBeenCalledWith(query);
  });

  it('listDefinitionExecutions exige REPORTING_ADMIN, REPORT_VIEWER y delega en el servicio', async () => {
    expect(
      Reflect.getMetadata(ROLES_KEY, handlers.listDefinitionExecutions),
    ).toEqual(['REPORTING_ADMIN', 'REPORT_VIEWER']);
    const page = {
      data: [],
      meta: { page: 1, pageSize: 20, total: 0, totalPages: 0 },
    };
    const service = {
      listDefinitionExecutions: jest.fn(async (..._args: unknown[]) => page),
    };
    const controller = new ReportingCollectionsController(service as any);
    const query = { page: 1, pageSize: 20 } as any;
    await expect(
      controller.listDefinitionExecutions('id-1', query),
    ).resolves.toBe(page);
    expect(service.listDefinitionExecutions).toHaveBeenCalledWith(
      'id-1',
      query,
    );
  });

  it('listSchedules exige REPORTING_ADMIN, REPORT_AUTHOR y delega en el servicio', async () => {
    expect(Reflect.getMetadata(ROLES_KEY, handlers.listSchedules)).toEqual([
      'REPORTING_ADMIN',
      'REPORT_AUTHOR',
    ]);
    const page = {
      data: [],
      meta: { page: 1, pageSize: 20, total: 0, totalPages: 0 },
    };
    const service = {
      listSchedules: jest.fn(async (..._args: unknown[]) => page),
    };
    const controller = new ReportingCollectionsController(service as any);
    const query = { page: 1, pageSize: 20 } as any;
    await expect(controller.listSchedules('id-1', query)).resolves.toBe(page);
    expect(service.listSchedules).toHaveBeenCalledWith('id-1', query);
  });

  it('listExecutions exige REPORTING_ADMIN y delega en el servicio', async () => {
    expect(Reflect.getMetadata(ROLES_KEY, handlers.listExecutions)).toEqual([
      'REPORTING_ADMIN',
    ]);
    const page = {
      data: [],
      meta: { page: 1, pageSize: 20, total: 0, totalPages: 0 },
    };
    const service = {
      listExecutions: jest.fn(async (..._args: unknown[]) => page),
    };
    const controller = new ReportingCollectionsController(service as any);
    const query = { page: 1, pageSize: 20 } as any;
    await expect(controller.listExecutions(query)).resolves.toBe(page);
    expect(service.listExecutions).toHaveBeenCalledWith(query);
  });

  it('listDashboards exige REPORTING_ADMIN, REPORT_AUTHOR y delega en el servicio', async () => {
    expect(Reflect.getMetadata(ROLES_KEY, handlers.listDashboards)).toEqual([
      'REPORTING_ADMIN',
      'REPORT_AUTHOR',
    ]);
    const page = {
      data: [],
      meta: { page: 1, pageSize: 20, total: 0, totalPages: 0 },
    };
    const service = {
      listDashboards: jest.fn(async (..._args: unknown[]) => page),
    };
    const controller = new ReportingCollectionsController(service as any);
    const query = { page: 1, pageSize: 20 } as any;
    await expect(controller.listDashboards(query)).resolves.toBe(page);
    expect(service.listDashboards).toHaveBeenCalledWith(query);
  });

  it('listDataSources exige REPORTING_ADMIN, DATA_STEWARD y delega en el servicio', async () => {
    expect(Reflect.getMetadata(ROLES_KEY, handlers.listDataSources)).toEqual([
      'REPORTING_ADMIN',
      'DATA_STEWARD',
    ]);
    const page = {
      data: [],
      meta: { page: 1, pageSize: 20, total: 0, totalPages: 0 },
    };
    const service = {
      listDataSources: jest.fn(async (..._args: unknown[]) => page),
    };
    const controller = new ReportingCollectionsController(service as any);
    const query = { page: 1, pageSize: 20 } as any;
    await expect(controller.listDataSources(query)).resolves.toBe(page);
    expect(service.listDataSources).toHaveBeenCalledWith(query);
  });
});
