import { jest } from '@jest/globals';

/**
 * Ejecuta la operación mock fn.
 *
 * @param impl - Valor de impl requerido por la operación.
 * @returns Resultado de mock fn conforme al contrato `any`.
 */
const mockFn = (impl?: any): any => (jest.fn as any)(impl);

import { AuthzCareRelationshipsController } from './authz-care-relationships.controller';

describe('AuthzCareRelationshipsController (thin delegation)', () => {
  it('requestCareRelationship delega en el service con el actor', async () => {
    const service = {
      requestCareRelationship: mockFn().mockResolvedValue({ id: 'cr-1' }),
    };
    const controller = new AuthzCareRelationshipsController(service as any);
    const actor = { id: 'u1', roles: ['PRACTITIONER'] } as any;
    const dto = { tenantId: 't1', patientProfileId: 'pat-1' } as any;

    const res = await controller.requestCareRelationship(dto, actor);

    expect(res).toEqual({ id: 'cr-1' });
    expect(service.requestCareRelationship).toHaveBeenCalledWith(dto, actor);
  });

  it('respondToCareRelationshipRequest delega en el service con id, dto y actor', async () => {
    const service = {
      respondToCareRelationshipRequest: mockFn().mockResolvedValue({
        ok: true,
        affected: 1,
      }),
    };
    const controller = new AuthzCareRelationshipsController(service as any);
    const actor = {
      id: 'u2',
      roles: ['PATIENT'],
      patientProfileId: 'pat-1',
    } as any;
    const dto = { decision: 'ACCEPT' } as any;

    const res = await controller.respondToCareRelationshipRequest(
      'cr-1',
      dto,
      actor,
    );

    expect(res).toEqual({ ok: true, affected: 1 });
    expect(service.respondToCareRelationshipRequest).toHaveBeenCalledWith(
      'cr-1',
      dto,
      actor,
    );
  });
});
