import { jest } from '@jest/globals';

const mockFn = (impl?: any): any => (jest.fn as any)(impl);

import { AuthzMeController } from './authz-me.controller';

describe('AuthzMeController (thin delegation)', () => {
  const actor = {
    id: 'u-pat',
    roles: ['PATIENT'],
    patientProfileId: 'pat-1',
  } as any;

  it('listAccessRequests delega en el buzón con el actor', async () => {
    const accessRequests = {
      listForPatient: mockFn().mockResolvedValue([{ id: 'r-1' }]),
    };
    const controller = new AuthzMeController(
      {} as any,
      {} as any,
      accessRequests as any,
    );

    const res = await controller.listAccessRequests(actor);

    expect(res).toEqual([{ id: 'r-1' }]);
    expect(accessRequests.listForPatient).toHaveBeenCalledWith(actor);
  });

  it('requestPrimaryPractitioner delega en el servicio de cabecera con dto y actor', async () => {
    const primaryCare = {
      requestAsPatient: mockFn().mockResolvedValue({ id: 'cr-1' }),
    };
    const controller = new AuthzMeController(
      {} as any,
      primaryCare as any,
      {} as any,
    );
    const dto = { practitionerProfileId: 'prac-1' } as any;

    const res = await controller.requestPrimaryPractitioner(dto, actor);

    expect(res).toEqual({ id: 'cr-1' });
    expect(primaryCare.requestAsPatient).toHaveBeenCalledWith(dto, actor);
  });
});
