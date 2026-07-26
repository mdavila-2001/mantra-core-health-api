import { jest } from '@jest/globals';

// Loose-typed mock factory: keeps runtime 'jest' but avoids @jest/globals' strict Mock<never> typings under the root tsconfig.
const mockFn = (impl?: any): any => (jest.fn as any)(impl);
import { IamUsersController } from './iam-users.controller';

const actor = { id: 'admin-1', roles: ['SECURITY_ADMIN'] } as any;

function build() {
  const usersService = {
    createUser: mockFn(),
    lock: mockFn(),
    changeGlobalRole: mockFn(),
    anonymize: mockFn(),
  };
  const credentialsService = { linkFederated: mockFn(), revokeCredential: mockFn() };
  const mfaService = { enrollOrVerify: mockFn() };
  const devicesService = { register: mockFn() };

  const controller = new IamUsersController(
    usersService as any,
    credentialsService as any,
    mfaService as any,
    devicesService as any,
  );
  return { controller, usersService, credentialsService, mfaService, devicesService };
}

describe('IamUsersController', () => {
  it('delegates createUser (UC-01-01)', async () => {
    const d = build();
    const dto = { displayName: 'A', email: 'a@x.io', password: 'password123' };
    d.usersService.createUser.mockResolvedValue({ id: 'u1' });
    await expect(d.controller.createUser(dto as any, actor)).resolves.toEqual({ id: 'u1' });
    expect(d.usersService.createUser).toHaveBeenCalledWith(dto, actor);
  });

  it('delegates linkFederated (UC-01-02)', async () => {
    const d = build();
    const dto = { identityProvider: 'g', externalSubject: 's' };
    await d.controller.linkFederated('u1', dto as any, actor);
    expect(d.credentialsService.linkFederated).toHaveBeenCalledWith('u1', dto, actor);
  });

  it('delegates revokeCredential (UC-01-09)', async () => {
    const d = build();
    await d.controller.revokeCredential('u1', 'c1', actor);
    expect(d.credentialsService.revokeCredential).toHaveBeenCalledWith('u1', 'c1', actor);
  });

  it('delegates mfaFactor (UC-01-03)', async () => {
    const d = build();
    const dto = { factorType: 'TOTP' };
    await d.controller.mfaFactor('u1', dto as any, actor);
    expect(d.mfaService.enrollOrVerify).toHaveBeenCalledWith('u1', dto, actor);
  });

  it('delegates registerDevice (UC-01-05)', async () => {
    const d = build();
    const dto = { deviceFingerprint: 'fp' };
    await d.controller.registerDevice('u1', dto as any, actor);
    expect(d.devicesService.register).toHaveBeenCalledWith('u1', dto, actor);
  });

  it('delegates lock (UC-01-07)', async () => {
    const d = build();
    await d.controller.lock('u1', { reason: 'x' }, actor);
    expect(d.usersService.lock).toHaveBeenCalledWith('u1', { reason: 'x' }, actor);
  });

  it('delegates changeGlobalRole (UC-01-10)', async () => {
    const d = build();
    const dto = { role: 'USER', action: 'GRANT' };
    await d.controller.changeGlobalRole('u1', dto as any, actor);
    expect(d.usersService.changeGlobalRole).toHaveBeenCalledWith('u1', dto, actor);
  });

  it('delegates anonymize (UC-01-12)', async () => {
    const d = build();
    await d.controller.anonymize('u1', actor);
    expect(d.usersService.anonymize).toHaveBeenCalledWith('u1', actor);
  });
});
