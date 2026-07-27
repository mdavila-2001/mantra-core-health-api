import { jest } from '@jest/globals';

// Loose-typed mock factory: keeps runtime 'jest' but avoids @jest/globals' strict Mock<never> typings under the root tsconfig.
const mockFn = (impl?: any): any => (jest.fn as any)(impl);
import { ProfilesPractitionersController } from './profiles-practitioners.controller';

const actor = { id: 'admin-1', roles: ['SECURITY_ADMIN'] } as any;

function build() {
  const practitionersService = {
    onboardPractitioner: mockFn(),
    addJurisdictionAuthorization: mockFn(),
    addSpecialty: mockFn(),
    verifyCredential: mockFn(),
  };
  const controller = new ProfilesPractitionersController(
    practitionersService as any,
  );
  return { controller, practitionersService };
}

describe('ProfilesPractitionersController', () => {
  it('delegates onboardPractitioner (UC-05-03)', async () => {
    const d = build();
    const dto = {
      practitionerCode: 'HP-1',
      licenseNumber: 'L1',
      credentialNumber: 'C1',
    };
    d.practitionersService.onboardPractitioner.mockResolvedValue({
      profileId: 'pp1',
    });
    await expect(
      d.controller.onboardPractitioner(dto as any, actor),
    ).resolves.toEqual({ profileId: 'pp1' });
    expect(d.practitionersService.onboardPractitioner).toHaveBeenCalledWith(
      dto,
      actor,
    );
  });

  it('delegates addJurisdictionAuthorization (UC-05-04)', async () => {
    const d = build();
    const dto = { licenseNumber: 'L2' };
    await d.controller.addJurisdictionAuthorization('pp1', dto, actor);
    expect(
      d.practitionersService.addJurisdictionAuthorization,
    ).toHaveBeenCalledWith('pp1', dto, actor);
  });

  it('delegates addSpecialty (UC-05-06)', async () => {
    const d = build();
    const dto = { isPrimary: true };
    await d.controller.addSpecialty('pp1', dto, actor);
    expect(d.practitionersService.addSpecialty).toHaveBeenCalledWith(
      'pp1',
      dto,
      actor,
    );
  });

  it('delegates verifyCredential (UC-05-05)', async () => {
    const d = build();
    const dto = { decision: 'VERIFIED' };
    await d.controller.verifyCredential('c1', dto as any, actor);
    expect(d.practitionersService.verifyCredential).toHaveBeenCalledWith(
      'c1',
      dto,
      actor,
    );
  });
});
