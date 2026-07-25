import { jest } from '@jest/globals';

// Loose-typed mock factory: keeps runtime 'jest' but avoids @jest/globals' strict Mock<never> typings under the root tsconfig.
const mockFn = (impl?: any): any => (jest.fn as any)(impl);
import { ProfilesPatientsController } from './profiles-patients.controller';

const actor = { id: 'admin-1', roles: ['SECURITY_ADMIN'] } as any;

function build() {
  const patientsService = {
    registerPatient: mockFn(),
    linkAccount: mockFn(),
    addIdentityLink: mockFn(),
    mergePatients: mockFn(),
    reverseMerge: mockFn(),
    addRelatedPerson: mockFn(),
    grantPortalProxy: mockFn(),
    decease: mockFn(),
  };
  const controller = new ProfilesPatientsController(patientsService as any);
  return { controller, patientsService };
}

describe('ProfilesPatientsController', () => {
  it('delegates registerPatient (UC-05-01)', async () => {
    const d = build();
    const dto = { patientCode: 'PC-1' };
    d.patientsService.registerPatient.mockResolvedValue({ profileId: 'pp1' });
    await expect(d.controller.registerPatient(dto as any, actor)).resolves.toEqual({ profileId: 'pp1' });
    expect(d.patientsService.registerPatient).toHaveBeenCalledWith(dto, actor);
  });

  it('delegates linkAccount (UC-05-02)', async () => {
    const d = build();
    const dto = { userId: 'u1' };
    await d.controller.linkAccount('p1', dto as any, actor);
    expect(d.patientsService.linkAccount).toHaveBeenCalledWith('p1', dto, actor);
  });

  it('delegates addIdentityLink (UC-05-07)', async () => {
    const d = build();
    const dto = { sourceTenantId: 't1', sourcePatientIdentifier: 'x', confidenceScore: 0.9 };
    await d.controller.addIdentityLink('pp1', dto as any, actor);
    expect(d.patientsService.addIdentityLink).toHaveBeenCalledWith('pp1', dto, actor);
  });

  it('delegates mergePatients (UC-05-08)', async () => {
    const d = build();
    const dto = { survivingPatientProfileId: 'a', mergedPatientProfileId: 'b' };
    await d.controller.mergePatients(dto as any, actor);
    expect(d.patientsService.mergePatients).toHaveBeenCalledWith(dto, actor);
  });

  it('delegates reverseMerge (UC-05-09)', async () => {
    const d = build();
    await d.controller.reverseMerge('e1', {} as any, actor);
    expect(d.patientsService.reverseMerge).toHaveBeenCalledWith('e1', {}, actor);
  });

  it('delegates addRelatedPerson (UC-05-10)', async () => {
    const d = build();
    const dto = { displayName: 'Mom' };
    await d.controller.addRelatedPerson('pp1', dto as any, actor);
    expect(d.patientsService.addRelatedPerson).toHaveBeenCalledWith('pp1', dto, actor);
  });

  it('delegates grantPortalProxy (UC-05-11)', async () => {
    const d = build();
    const dto = { proxyUserId: 'u1', scopeValueSetId: 's1', legalBasisRecordId: 'lb1' };
    await d.controller.grantPortalProxy('pp1', dto as any, actor);
    expect(d.patientsService.grantPortalProxy).toHaveBeenCalledWith('pp1', dto, actor);
  });

  it('delegates decease (UC-05-12)', async () => {
    const d = build();
    await d.controller.decease('p1', {} as any, actor);
    expect(d.patientsService.decease).toHaveBeenCalledWith('p1', {}, actor);
  });
});
