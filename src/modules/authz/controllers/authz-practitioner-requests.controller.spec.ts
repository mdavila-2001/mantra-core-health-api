import { jest } from '@jest/globals';

const mockFn = (impl?: any): any => (jest.fn as any)(impl);

import { AuthzPractitionerRequestsController } from './authz-practitioner-requests.controller';

describe('AuthzPractitionerRequestsController (thin delegation)', () => {
  const actor = {
    id: 'u-doc',
    roles: ['CLINICIAN'],
    practitionerProfileId: 'prac-1',
  } as any;

  it('listAccessRequests delega en el buzón con el actor', async () => {
    const accessRequests = {
      listForPractitioner: mockFn().mockResolvedValue([{ id: 'r-1' }]),
    };
    const controller = new AuthzPractitionerRequestsController(
      accessRequests as any,
      {} as any,
    );

    const res = await controller.listAccessRequests(actor);

    expect(res).toEqual([{ id: 'r-1' }]);
    expect(accessRequests.listForPractitioner).toHaveBeenCalledWith(actor);
  });

  it('respond delega en el servicio de cabecera con id, dto y actor', async () => {
    const primaryCare = {
      respondAsPractitioner: mockFn().mockResolvedValue({
        ok: true,
        affected: 1,
      }),
    };
    const controller = new AuthzPractitionerRequestsController(
      {} as any,
      primaryCare as any,
    );
    const dto = { decision: 'ACCEPT' } as any;

    const res = await controller.respond('cr-1', dto, actor);

    expect(res).toEqual({ ok: true, affected: 1 });
    expect(primaryCare.respondAsPractitioner).toHaveBeenCalledWith(
      'cr-1',
      dto,
      actor,
    );
  });
});
