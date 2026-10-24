import { describe, it, expect, jest } from '@jest/globals';
import { ROLES_KEY } from '../../../common/auth/roles.decorator';
import { DiagnosticsCollectionsController } from './diagnostics-collections.controller';

const handlers =
  DiagnosticsCollectionsController.prototype as unknown as Record<
    string,
    object
  >;

describe('DiagnosticsCollectionsController', () => {
  it('listImagingEndpoints exige CLINICIAN, PRACTITIONER y delega en el servicio', async () => {
    expect(
      Reflect.getMetadata(ROLES_KEY, handlers.listImagingEndpoints),
    ).toEqual(['CLINICIAN', 'PRACTITIONER']);
    const page = {
      data: [],
      meta: { page: 1, pageSize: 20, total: 0, totalPages: 0 },
    };
    const service = {
      listImagingEndpoints: jest.fn(async (..._args: unknown[]) => page),
    };
    const controller = new DiagnosticsCollectionsController(service as any);
    const query = { page: 1, pageSize: 20 } as any;
    await expect(controller.listImagingEndpoints(query)).resolves.toBe(page);
    expect(service.listImagingEndpoints).toHaveBeenCalledWith(query);
  });
});
