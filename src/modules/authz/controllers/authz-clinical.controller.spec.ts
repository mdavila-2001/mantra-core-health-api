import { jest } from '@jest/globals';

const mockFn = (impl?: any): any => (jest.fn as any)(impl);
import { AuthzClinicalController } from './authz-clinical.controller';

const actor = { id: 'clin-1', roles: ['CLINICAL'] } as any;

function build() {
  const clinicalService = {
    grantClinicalAccess: mockFn(),
    breakTheGlass: mockFn(),
    revokeClinicalAccess: mockFn(),
  };
  const controller = new AuthzClinicalController(clinicalService as any);
  return { controller, clinicalService };
}

describe('AuthzClinicalController', () => {
  it('delegates grantClinicalAccess (UC-06-06)', async () => {
    const d = build();
    const dto = {
      grantedUserId: 'u2',
      tenantId: 't1',
      purposeOfUse: 'TREATMENT',
      accessLevel: 'READ',
      validTo: new Date(),
    };
    await d.controller.grantClinicalAccess('pat-1', dto as any, actor);
    expect(d.clinicalService.grantClinicalAccess).toHaveBeenCalledWith(
      'pat-1',
      dto,
      actor,
    );
  });

  it('delegates breakTheGlass (UC-06-07)', async () => {
    const d = build();
    const dto = { tenantId: 't1', justification: 'emergency here' };
    await d.controller.breakTheGlass('pat-1', dto, actor);
    expect(d.clinicalService.breakTheGlass).toHaveBeenCalledWith(
      'pat-1',
      dto,
      actor,
    );
  });

  it('delegates revokeClinicalAccess (UC-06-10)', async () => {
    const d = build();
    await d.controller.revokeClinicalAccess('cag-1', actor);
    expect(d.clinicalService.revokeClinicalAccess).toHaveBeenCalledWith(
      'cag-1',
      actor,
    );
  });
});
